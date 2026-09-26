// CKA 실습 과제 은행.
//
// ⚠️**기출 문제가 아니다.** CKA 는 응시자 비밀유지 서약(NDA)이 있어 실제 문항을 옮기면 안 된다.
//   여기 문제는 CNCF 가 공개한 교과과정(2025-02 개정) 역량 항목을 하나하나 '시험장에서 받는 형태'
//   — 짧은 지시문 + 네임스페이스·이름·경로 명시 + 부분 점수 — 로 새로 만든 것이다.
//
// 과제 하나 = { id, domain, title, level, lesson, text, setup(c,s), hints[], solution[], check(c,s) }
//   · setup  : 문제 상황을 만든다(망가진 클러스터 포함). 별도 세션으로 돌려 기록이 안 남는다.
//   · solution: 모범 답안. 문자열 = 터미널 입력, { vi, from, to } = 파일 고치기, { kedit, from, to } = kubectl edit.
//   · check  : [{ t: '채점 항목', ok }] — 항목별 부분 점수. **tools/cka-sim-test.mjs 가 과제마다
//              '준비 직후엔 통과하지 않고, 모범 답안 뒤엔 전부 통과'하는지 검사한다.**
import { isReady } from './engine.js';
import { serverVersion } from './shell.js';

export const DOMAINS = {
  basics: { ko: '기초 체력', weight: 0 },
  workloads: { ko: '워크로드 · 스케줄링', weight: 15 },
  arch: { ko: '클러스터 아키텍처 · 설치 · 구성', weight: 25 },
  network: { ko: '서비스 · 네트워킹', weight: 20 },
  storage: { ko: '스토리지', weight: 10 },
  trouble: { ko: '트러블슈팅', weight: 30 },
};

// ─── 채점 도우미 ────────────────────────────────────────────────────────────
const get = (c, kind, ns, name) => c.get(kind, ns, name);
const file = (c, path, host = 'controlplane') => c.hosts[host].files[path];
const podsOfDeploy = (c, ns, name) => { const d = c.get('Deployment', ns, name); if (!d) return []; return c.ownedBy('ReplicaSet', d).flatMap((r) => c.ownedBy('Pod', r)); };
const readyCount = (c, ns, name) => podsOfDeploy(c, ns, name).filter(isReady).length;
const ctr = (o, i = 0) => (((o || {}).spec || {}).containers || [])[i] || (((((o || {}).spec || {}).template || {}).spec || {}).containers || [])[i] || {};
const nodeReady = (c, n) => { const o = c.get('Node', '', n); return !!o && (o.status.conditions || []).some((x) => x.type === 'Ready' && x.status === 'True'); };
const pod = (c, ns, name) => c.get('Pod', ns, name);
const lines = (t) => (t || '').split('\n').map((x) => x.trim()).filter(Boolean);
const mkfile = (c, path, text, host = 'controlplane') => { c.hosts[host].files[path] = text; };
const mkdir = (c, path, host = 'controlplane') => { const h = c.hosts[host]; h.dirs = h.dirs || new Set(); h.dirs.add(path); };
const envOf = (c, p, name) => (ctr(p).env || []).find((e) => e.name === name);
const sa = (ns, n) => ({ user: `system:serviceaccount:${ns}:${n}`, sa: { ns, name: n }, groups: ['system:serviceaccounts', 'system:authenticated'] });

export const TASKS = [
  // ═════════════════════════ 기초 체력 ═════════════════════════
  {
    id: 'b1', domain: 'basics', level: 1, lesson: 'kubectl-essentials', title: '네임스페이스와 첫 파드',
    text: '네임스페이스 `dev` 를 만들고, 그 안에 이미지 `nginx:1.27` 로 파드 `web` 을 만드세요. 파드에는 레이블 `app=web`, `tier=frontend` 가 붙어 있어야 합니다.',
    setup() {},
    hints: ['`kubectl create namespace` 로 네임스페이스를 만든다.', '`kubectl run` 의 `--labels` 는 콤마로 여러 개를 준다.', '`-n dev` 를 빼먹으면 default 에 만들어진다.'],
    solution: ['kubectl create namespace dev', 'kubectl run web --image=nginx:1.27 --labels=app=web,tier=frontend -n dev', 'kubectl get pod web -n dev --show-labels'],
    check: (c) => {
      const p = pod(c, 'dev', 'web');
      return [
        { t: '네임스페이스 dev 가 있다', ok: !!get(c, 'Namespace', '', 'dev') },
        { t: 'dev/web 파드가 nginx:1.27 로 Running', ok: !!p && ctr(p).image === 'nginx:1.27' && isReady(p) },
        { t: '레이블 app=web, tier=frontend', ok: !!p && p.metadata.labels.app === 'web' && p.metadata.labels.tier === 'frontend' },
      ];
    },
  },
  {
    id: 'b2', domain: 'basics', level: 1, lesson: 'kubectl-essentials', title: 'jsonpath 로 필요한 값만 뽑기',
    text: '`kube-system` 네임스페이스에 있는 **모든 파드의 이름**을 한 줄에 하나씩 `/opt/course/b2/pods.txt` 에 저장하세요. (디렉터리는 이미 있습니다)',
    setup(c) { mkdir(c, '/opt/course/b2'); },
    hints: ['`-o jsonpath=\'{range .items[*]}{.metadata.name}{"\\n"}{end}\'`', '또는 `-o name` 결과에서 `pod/` 를 떼도 된다. `--no-headers -o custom-columns=NAME:.metadata.name` 도 방법.', '`> 파일` 로 저장한 뒤 `cat` 으로 확인하는 습관.'],
    solution: [`kubectl get pods -n kube-system -o jsonpath='{range .items[*]}{.metadata.name}{"\\n"}{end}' > /opt/course/b2/pods.txt`, 'cat /opt/course/b2/pods.txt'],
    check: (c) => {
      const want = c.list('Pod', 'kube-system').map((p) => p.metadata.name).sort();
      const got = lines(file(c, '/opt/course/b2/pods.txt')).sort();
      return [
        { t: '파일이 있다', ok: got.length > 0 },
        { t: 'kube-system 파드 이름이 빠짐없이, 한 줄에 하나씩', ok: JSON.stringify(want) === JSON.stringify(got) },
      ];
    },
  },
  {
    id: 'b3', domain: 'basics', level: 2, lesson: 'yaml-basics', title: 'dry-run 으로 YAML 뼈대 만들기',
    text: '파드 `cache` 를 만드세요(네임스페이스 `default`).\n- 이미지 `redis:7`, 컨테이너 포트 `6379`\n- 환경변수 `MODE=replica`\n- 만든 매니페스트를 `/root/cache.yaml` 로 남겨 두세요.',
    setup() {},
    hints: ['`kubectl run cache --image=redis:7 --port=6379 --env=MODE=replica --dry-run=client -o yaml > cache.yaml`', '파일을 만든 뒤 `kubectl apply -f cache.yaml`.'],
    solution: ['kubectl run cache --image=redis:7 --port=6379 --env=MODE=replica --dry-run=client -o yaml > /root/cache.yaml', 'kubectl apply -f /root/cache.yaml', 'kubectl get pod cache'],
    check: (c) => {
      const p = pod(c, 'default', 'cache');
      return [
        { t: '/root/cache.yaml 이 있다', ok: /kind:\s*Pod/.test(file(c, '/root/cache.yaml') || '') },
        { t: '파드 cache 가 redis:7 로 Running', ok: !!p && ctr(p).image === 'redis:7' && isReady(p) },
        { t: '포트 6379 · MODE=replica', ok: !!p && (ctr(p).ports || []).some((x) => x.containerPort === 6379) && (envOf(c, p, 'MODE') || {}).value === 'replica' },
      ];
    },
  },

  // ═════════════════════════ 워크로드 · 스케줄링 ═════════════════════════
  {
    id: 'w1', domain: 'workloads', level: 1, lesson: 'deployments', title: '디플로이먼트 만들고 늘리기',
    text: '네임스페이스 `shop` 에 디플로이먼트 `frontend` 를 이미지 `nginx:1.27`, 레플리카 3 으로 만드세요. 만든 뒤 레플리카를 **5** 로 늘리세요.',
    setup(c, s) { s.run('kubectl create ns shop'); },
    hints: ['`kubectl create deployment frontend --image=nginx:1.27 --replicas=3 -n shop`', '`kubectl scale deployment frontend --replicas=5 -n shop`'],
    solution: ['kubectl create deployment frontend --image=nginx:1.27 --replicas=3 -n shop', 'kubectl scale deployment frontend --replicas=5 -n shop', 'kubectl get deploy -n shop'],
    check: (c) => {
      const d = get(c, 'Deployment', 'shop', 'frontend');
      return [
        { t: 'shop/frontend 가 nginx:1.27', ok: !!d && ctr(d).image === 'nginx:1.27' },
        { t: '레플리카 5', ok: !!d && d.spec.replicas === 5 },
        { t: '5개 파드 모두 Ready', ok: readyCount(c, 'shop', 'frontend') === 5 },
      ];
    },
  },
  {
    id: 'w2', domain: 'workloads', level: 2, lesson: 'deployments', title: '롤링 업데이트와 변경 사유',
    text: '디플로이먼트 `api`(네임스페이스 `default`)의 이미지를 `nginx:1.27` 로 업데이트하세요. 롤아웃 이력(`kubectl rollout history`)의 CHANGE-CAUSE 에 `upgrade to 1.27` 이 보여야 합니다.',
    setup(c, s) { s.run('kubectl create deployment api --image=nginx:1.26 --replicas=3'); },
    hints: ['이미지는 `kubectl set image deployment/api nginx=nginx:1.27` (컨테이너 이름이 nginx).', 'CHANGE-CAUSE 는 `kubernetes.io/change-cause` 어노테이션에서 온다: `kubectl annotate deployment api kubernetes.io/change-cause="upgrade to 1.27"`', '`--record` 는 폐지 예정이라 어노테이션 방식을 익혀 두는 게 안전하다.'],
    solution: ['kubectl set image deployment/api nginx=nginx:1.27', 'kubectl annotate deployment api kubernetes.io/change-cause="upgrade to 1.27"', 'kubectl rollout status deployment api', 'kubectl rollout history deployment api'],
    check: (c) => {
      const d = get(c, 'Deployment', 'default', 'api');
      const rs = d ? c.ownedBy('ReplicaSet', d).find((r) => r.metadata.annotations['deployment.kubernetes.io/revision'] === d.metadata.annotations['deployment.kubernetes.io/revision']) : null;
      return [
        { t: '이미지가 nginx:1.27', ok: !!d && ctr(d).image === 'nginx:1.27' },
        { t: '3개 파드 모두 Ready', ok: readyCount(c, 'default', 'api') === 3 },
        { t: '현재 리비전 CHANGE-CAUSE = upgrade to 1.27', ok: !!rs && rs.metadata.annotations['kubernetes.io/change-cause'] === 'upgrade to 1.27' },
      ];
    },
  },
  {
    id: 'w3', domain: 'workloads', level: 2, lesson: 'deployments', title: '망가진 롤아웃 되돌리기',
    text: '누군가 디플로이먼트 `payment`(네임스페이스 `default`)를 업데이트한 뒤 새 파드가 뜨지 않습니다. **직전 정상 리비전으로 롤백**하고, 롤백 후의 현재 리비전 번호를 `/opt/course/w3/revision.txt` 에 숫자만 적으세요.',
    setup(c, s) { mkdir(c, '/opt/course/w3'); s.run('kubectl create deployment payment --image=nginx:1.26 --replicas=2'); s.run('kubectl set image deployment/payment nginx=nginx:1.29.99'); },
    hints: ['`kubectl rollout history deployment payment` 로 이력을 본다.', '`kubectl rollout undo deployment payment` — 되돌리면 옛 템플릿이 **새 리비전 번호**를 받는다.', '번호는 `kubectl get deploy payment -o jsonpath=\'{.metadata.annotations.deployment\\.kubernetes\\.io/revision}\'`'],
    solution: ['kubectl rollout history deployment payment', 'kubectl rollout undo deployment payment', 'kubectl rollout status deployment payment', 'kubectl rollout history deployment payment', 'echo 3 > /opt/course/w3/revision.txt'],
    check: (c) => {
      const d = get(c, 'Deployment', 'default', 'payment');
      const rev = d && d.metadata.annotations['deployment.kubernetes.io/revision'];
      return [
        { t: '이미지가 정상판 nginx:1.26', ok: !!d && ctr(d).image === 'nginx:1.26' },
        { t: '파드 2개 모두 Ready', ok: readyCount(c, 'default', 'payment') === 2 && podsOfDeploy(c, 'default', 'payment').length === 2 },
        { t: '파일에 현재 리비전 번호', ok: !!rev && (file(c, '/opt/course/w3/revision.txt') || '').trim() === rev },
      ];
    },
  },
  {
    id: 'w4', domain: 'workloads', level: 2, lesson: 'configmaps-secrets', title: 'ConfigMap · Secret 주입',
    text: '네임스페이스 `default` 에서:\n1. ConfigMap `app-config` — `APP_MODE=prod`\n2. Secret `db-cred` — `password=S3cr3t!`\n3. 파드 `app`(이미지 `busybox:1.37`, 명령 `sleep 3600`):\n   - 환경변수 `APP_MODE` ← ConfigMap 의 `APP_MODE`\n   - 환경변수 `DB_PASSWORD` ← Secret 의 `password`\n   - ConfigMap `app-config` 를 `/etc/app` 에 볼륨으로 마운트',
    setup() {},
    hints: ['CM·Secret 은 명령형으로: `kubectl create configmap app-config --from-literal=APP_MODE=prod`, `kubectl create secret generic db-cred --from-literal=password=\'S3cr3t!\'`', '파드는 `kubectl run app --image=busybox:1.37 --dry-run=client -o yaml -- sleep 3600 > app.yaml` 로 뼈대를 만든 뒤 env · volumes 를 추가한다.', '`valueFrom.configMapKeyRef` / `valueFrom.secretKeyRef` — 문서에서 "Define container environment variables using ConfigMap data" 를 찾으면 예제가 있다.'],
    solution: [
      'kubectl create configmap app-config --from-literal=APP_MODE=prod',
      "kubectl create secret generic db-cred --from-literal=password='S3cr3t!'",
      'cat <<EOF | kubectl apply -f -',
      'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: app', 'spec:', '  containers:', '  - name: app', '    image: busybox:1.37', '    command: ["sleep", "3600"]', '    env:', '    - name: APP_MODE', '      valueFrom:', '        configMapKeyRef:', '          name: app-config', '          key: APP_MODE', '    - name: DB_PASSWORD', '      valueFrom:', '        secretKeyRef:', '          name: db-cred', '          key: password', '    volumeMounts:', '    - name: cfg', '      mountPath: /etc/app', '  volumes:', '  - name: cfg', '    configMap:', '      name: app-config', 'EOF',
      'kubectl exec app -- env | grep -E "APP_MODE|DB_PASSWORD"',
      'kubectl exec app -- cat /etc/app/APP_MODE',
    ],
    check: (c) => {
      const p = pod(c, 'default', 'app');
      const cm = get(c, 'ConfigMap', 'default', 'app-config'), sc = get(c, 'Secret', 'default', 'db-cred');
      const e1 = p && envOf(c, p, 'APP_MODE'), e2 = p && envOf(c, p, 'DB_PASSWORD');
      const vol = p && (p.spec.volumes || []).find((v) => v.configMap && v.configMap.name === 'app-config');
      return [
        { t: 'ConfigMap·Secret 값이 맞다', ok: !!cm && cm.data.APP_MODE === 'prod' && !!sc && c.containerEnv({ env: [{ name: 'x', valueFrom: { secretKeyRef: { name: 'db-cred', key: 'password' } } }] }, 'default').x === 'S3cr3t!' },
        { t: 'APP_MODE ← configMapKeyRef', ok: !!e1 && !!e1.valueFrom && !!e1.valueFrom.configMapKeyRef && e1.valueFrom.configMapKeyRef.name === 'app-config' },
        { t: 'DB_PASSWORD ← secretKeyRef', ok: !!e2 && !!e2.valueFrom && !!e2.valueFrom.secretKeyRef && e2.valueFrom.secretKeyRef.name === 'db-cred' && e2.valueFrom.secretKeyRef.key === 'password' },
        { t: '/etc/app 에 ConfigMap 마운트 + 파드 Running', ok: !!vol && (ctr(p).volumeMounts || []).some((m) => m.name === vol.name && m.mountPath === '/etc/app') && isReady(p) },
      ];
    },
  },
  {
    id: 'w5', domain: 'workloads', level: 2, lesson: 'pods', title: '사이드카 로그 수집 컨테이너',
    text: '파드 `logger`(네임스페이스 `default`)를 만드세요.\n- 컨테이너 `app`: 이미지 `busybox:1.37`, 명령 `sh -c "while true; do echo $(date) hello >> /var/log/app.log; sleep 5; done"`\n- 컨테이너 `sidecar`: 이미지 `busybox:1.37`, 명령 `sh -c "tail -f /var/log/app.log"`\n- 두 컨테이너가 `emptyDir` 볼륨 `logs` 를 `/var/log` 에 함께 마운트',
    setup() {},
    hints: ['한 파드에 containers 두 개. `kubectl run` 으로 첫 컨테이너 뼈대를 만들고 YAML 에서 둘째를 복사해 붙인다.', '볼륨은 `volumes: - name: logs  emptyDir: {}`', '확인: `kubectl logs logger -c sidecar`'],
    solution: [
      'cat <<EOF > /root/logger.yaml',
      'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: logger', 'spec:', '  containers:', '  - name: app', '    image: busybox:1.37', '    command: ["sh", "-c", "while true; do echo $(date) hello >> /var/log/app.log; sleep 5; done"]', '    volumeMounts:', '    - name: logs', '      mountPath: /var/log', '  - name: sidecar', '    image: busybox:1.37', '    command: ["sh", "-c", "tail -f /var/log/app.log"]', '    volumeMounts:', '    - name: logs', '      mountPath: /var/log', '  volumes:', '  - name: logs', '    emptyDir: {}', 'EOF',
      'kubectl apply -f /root/logger.yaml',
      'kubectl get pod logger',
      'kubectl exec logger -c sidecar -- cat /var/log/app.log',
    ],
    check: (c) => {
      const p = pod(c, 'default', 'logger');
      const cs = p ? p.spec.containers : [];
      const vol = p && (p.spec.volumes || []).find((v) => v.name === 'logs' && v.emptyDir);
      const m = (name) => { const x = cs.find((y) => y.name === name); return !!x && (x.volumeMounts || []).some((v) => v.name === 'logs' && v.mountPath === '/var/log'); };
      return [
        { t: '컨테이너 app · sidecar 둘 다 busybox:1.37', ok: cs.length === 2 && cs.every((x) => x.image === 'busybox:1.37') && cs.some((x) => x.name === 'app') && cs.some((x) => x.name === 'sidecar') },
        { t: 'emptyDir logs 를 둘 다 /var/log 에 마운트', ok: !!vol && m('app') && m('sidecar') },
        { t: '파드 2/2 Running', ok: !!p && isReady(p) },
      ];
    },
  },
  {
    id: 'w6', domain: 'workloads', level: 2, lesson: 'resources-probes', title: 'ResourceQuota 가 있는 곳에 파드 넣기',
    text: '네임스페이스 `quota-ns` 에는 ResourceQuota 가 걸려 있어 파드 생성이 거부됩니다. 파드 `limited`(이미지 `nginx:1.27`)를 **요청 cpu 100m / memory 128Mi, 제한 cpu 200m / memory 256Mi** 로 만드세요.',
    setup(c, s) { s.run('kubectl create ns quota-ns'); s.run('kubectl create quota compute --hard=requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi,pods=5 -n quota-ns'); },
    hints: ['먼저 그냥 만들어 보고 오류 문장을 읽는다: `must specify limits.cpu…`', '`kubectl run limited --image=nginx:1.27 -n quota-ns --dry-run=client -o yaml > l.yaml` 후 `resources:` 를 채운다.', '`kubectl describe quota -n quota-ns` 로 사용량을 본다.'],
    solution: [
      'kubectl describe quota -n quota-ns',
      'cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: limited', '  namespace: quota-ns', 'spec:', '  containers:', '  - name: limited', '    image: nginx:1.27', '    resources:', '      requests:', '        cpu: 100m', '        memory: 128Mi', '      limits:', '        cpu: 200m', '        memory: 256Mi', 'EOF',
      'kubectl get pod limited -n quota-ns',
    ],
    check: (c) => {
      const p = pod(c, 'quota-ns', 'limited');
      const r = ctr(p).resources || {};
      return [
        { t: '파드 limited 가 Running', ok: !!p && isReady(p) },
        { t: '요청 cpu 100m · memory 128Mi', ok: !!r.requests && r.requests.cpu === '100m' && r.requests.memory === '128Mi' },
        { t: '제한 cpu 200m · memory 256Mi', ok: !!r.limits && r.limits.cpu === '200m' && r.limits.memory === '256Mi' },
      ];
    },
  },
  {
    id: 'w7', domain: 'workloads', level: 2, lesson: 'autoscaling-jobs', title: 'HPA 로 자동 확장',
    text: '디플로이먼트 `web`(네임스페이스 `default`)에 HorizontalPodAutoscaler 를 붙이세요. 최소 2, 최대 6, **CPU 평균 사용률 70%** 를 목표로 합니다. HPA 이름은 `web` 입니다.',
    setup(c, s) { s.run('kubectl create deployment web --image=nginx:1.27'); s.run('kubectl set resources deployment web --requests=cpu=100m,memory=64Mi'); },
    hints: ['`kubectl autoscale deployment web --min=2 --max=6 --cpu-percent=70`', 'HPA 가 CPU 사용률을 계산하려면 파드에 **cpu 요청량**이 있어야 한다(이미 설정돼 있다).', '`kubectl get hpa` 에서 REPLICAS 가 최소치 2로 맞춰지는지 본다.'],
    solution: ['kubectl autoscale deployment web --min=2 --max=6 --cpu-percent=70', 'kubectl get hpa web'],
    check: (c) => {
      const h = get(c, 'HorizontalPodAutoscaler', 'default', 'web');
      const m = h && (h.spec.metrics || []).find((x) => x.resource && x.resource.name === 'cpu');
      return [
        { t: 'HPA web → Deployment/web', ok: !!h && h.spec.scaleTargetRef.name === 'web' && h.spec.scaleTargetRef.kind === 'Deployment' },
        { t: 'min 2 · max 6', ok: !!h && h.spec.minReplicas === 2 && h.spec.maxReplicas === 6 },
        { t: 'CPU 70%', ok: !!m && m.resource.target.averageUtilization === 70 },
        { t: '레플리카가 최소치 2 이상', ok: readyCount(c, 'default', 'web') >= 2 },
      ];
    },
  },
  {
    id: 'w8', domain: 'workloads', level: 2, lesson: 'scheduling', title: 'nodeAffinity 로 SSD 노드에 배치',
    text: '노드 `node02` 에 레이블 `disktype=ssd` 를 붙이세요. 그리고 파드 `fast`(이미지 `nginx:1.27`, 네임스페이스 `default`)를 **requiredDuringSchedulingIgnoredDuringExecution nodeAffinity** 로 `disktype=ssd` 노드에만 뜨게 만드세요.',
    setup() {},
    hints: ['`kubectl label node node02 disktype=ssd`', 'affinity 블록은 문서 "Assign Pods to Nodes using Node Affinity" 예제를 그대로 가져와 key/values 만 바꾼다.', 'nodeSelector 로도 같은 결과가 나지만, 문제는 nodeAffinity 를 요구한다 — 문제의 단어를 그대로 지킬 것.'],
    solution: [
      'kubectl label node node02 disktype=ssd',
      'cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: fast', 'spec:', '  affinity:', '    nodeAffinity:', '      requiredDuringSchedulingIgnoredDuringExecution:', '        nodeSelectorTerms:', '        - matchExpressions:', '          - key: disktype', '            operator: In', '            values:', '            - ssd', '  containers:', '  - name: fast', '    image: nginx:1.27', 'EOF',
      'kubectl get pod fast -o wide',
    ],
    check: (c) => {
      const p = pod(c, 'default', 'fast');
      const aff = p && (((p.spec.affinity || {}).nodeAffinity || {}).requiredDuringSchedulingIgnoredDuringExecution || {}).nodeSelectorTerms;
      return [
        { t: 'node02 에 disktype=ssd', ok: (get(c, 'Node', '', 'node02').metadata.labels || {}).disktype === 'ssd' },
        { t: 'required nodeAffinity 로 disktype In [ssd]', ok: !!aff && aff.some((tm) => (tm.matchExpressions || []).some((e) => e.key === 'disktype' && e.operator === 'In' && (e.values || []).includes('ssd'))) },
        { t: 'fast 가 node02 에서 Running', ok: !!p && p.spec.nodeName === 'node02' && isReady(p) },
      ];
    },
  },
  {
    id: 'w9', domain: 'workloads', level: 2, lesson: 'scheduling', title: 'taint 가 걸린 노드에 들어가기',
    text: '`node01` 은 GPU 전용으로 예약돼 taint 가 걸려 있습니다(무엇인지 직접 확인). 파드 `gpu-job`(이미지 `busybox:1.37`, 명령 `sleep 3600`, 네임스페이스 `default`)이 **반드시 node01 에서** 돌도록 만드세요.',
    setup(c, s) { s.run('kubectl taint node node01 dedicated=gpu:NoSchedule'); s.run('kubectl label node node01 accelerator=gpu'); },
    hints: ['`kubectl describe node node01 | grep -i taint`', 'toleration 만으로는 "들어갈 수 있다"일 뿐 "반드시 간다"가 아니다 → nodeSelector(또는 nodeAffinity)도 함께.', 'toleration: `key: dedicated, operator: Equal, value: gpu, effect: NoSchedule`'],
    solution: [
      'kubectl describe node node01 | grep -i taint',
      'kubectl get node node01 --show-labels',
      'cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: gpu-job', 'spec:', '  nodeSelector:', '    kubernetes.io/hostname: node01', '  tolerations:', '  - key: dedicated', '    operator: Equal', '    value: gpu', '    effect: NoSchedule', '  containers:', '  - name: gpu-job', '    image: busybox:1.37', '    command: ["sleep", "3600"]', 'EOF',
      'kubectl get pod gpu-job -o wide',
    ],
    check: (c) => {
      const p = pod(c, 'default', 'gpu-job');
      const n1 = get(c, 'Node', '', 'node01');
      return [
        { t: 'node01 의 taint 는 그대로', ok: (n1.spec.taints || []).some((t) => t.key === 'dedicated' && t.value === 'gpu') },
        { t: 'dedicated=gpu:NoSchedule 를 견디는 toleration', ok: !!p && (p.spec.tolerations || []).some((t) => t.key === 'dedicated' && (t.operator === 'Exists' || t.value === 'gpu')) },
        { t: 'gpu-job 이 node01 에서 Running', ok: !!p && p.spec.nodeName === 'node01' && isReady(p) },
      ];
    },
  },
  {
    id: 'w10', domain: 'workloads', level: 2, lesson: 'scheduling', title: '모든 노드에 하나씩 — DaemonSet',
    text: '네임스페이스 `monitoring` 에 DaemonSet `node-agent` 를 만드세요. 이미지 `busybox:1.37`, 명령 `sleep infinity`. **컨트롤 플레인 노드를 포함한 모든 노드(3대)** 에 하나씩 떠야 합니다.',
    setup(c, s) { s.run('kubectl create ns monitoring'); },
    hints: ['DaemonSet 은 `kubectl create` 로 못 만든다 → `kubectl create deployment … --dry-run=client -o yaml` 뼈대에서 kind 를 DaemonSet 으로, replicas·strategy 를 지운다.', '컨트롤 플레인에는 `node-role.kubernetes.io/control-plane:NoSchedule` taint 가 있다 → toleration 필요.'],
    solution: [
      'cat <<EOF | kubectl apply -f -', 'apiVersion: apps/v1', 'kind: DaemonSet', 'metadata:', '  name: node-agent', '  namespace: monitoring', 'spec:', '  selector:', '    matchLabels:', '      app: node-agent', '  template:', '    metadata:', '      labels:', '        app: node-agent', '    spec:', '      tolerations:', '      - key: node-role.kubernetes.io/control-plane', '        operator: Exists', '        effect: NoSchedule', '      containers:', '      - name: agent', '        image: busybox:1.37', '        command: ["sleep", "infinity"]', 'EOF',
      'kubectl get ds,pods -n monitoring -o wide',
    ],
    check: (c) => {
      const ds = get(c, 'DaemonSet', 'monitoring', 'node-agent');
      const pods = ds ? c.ownedBy('Pod', ds) : [];
      return [
        { t: 'DaemonSet monitoring/node-agent', ok: !!ds && ctr(ds).image === 'busybox:1.37' },
        { t: '3개 노드 모두에 파드', ok: new Set(pods.map((p) => p.spec.nodeName)).size === 3 },
        { t: '파드 전부 Ready', ok: pods.length === 3 && pods.every(isReady) },
      ];
    },
  },
  {
    id: 'w11', domain: 'workloads', level: 2, lesson: 'autoscaling-jobs', title: 'CronJob 과 수동 실행',
    text: '네임스페이스 `default` 에 CronJob `backup` 을 만드세요.\n- **30분마다** 실행, 이미지 `busybox:1.37`, 명령 `sh -c "echo backup done"`\n- 성공한 Job 기록은 **2개**만 남긴다\n그런 다음 이 CronJob 으로 Job `backup-manual` 을 **지금 한 번** 실행하세요.',
    setup() {},
    hints: ['`kubectl create cronjob backup --image=busybox:1.37 --schedule="*/30 * * * *" -- sh -c "echo backup done"`', '`successfulJobsHistoryLimit` 은 명령형 플래그가 없다 → `kubectl edit` 나 dry-run YAML 로.', '`kubectl create job backup-manual --from=cronjob/backup`'],
    solution: [
      'kubectl create cronjob backup --image=busybox:1.37 --schedule="*/30 * * * *" --dry-run=client -o yaml -- sh -c "echo backup done" > /root/cj.yaml',
      { vi: '/root/cj.yaml', from: '  schedule:', to: '  successfulJobsHistoryLimit: 2\n  schedule:', note: 'spec 아래에 successfulJobsHistoryLimit: 2 를 넣는다' },
      'kubectl apply -f /root/cj.yaml',
      'kubectl create job backup-manual --from=cronjob/backup',
      'kubectl get cronjob,job',
      'kubectl logs job/backup-manual',
    ],
    check: (c) => {
      const cj = get(c, 'CronJob', 'default', 'backup');
      const j = get(c, 'Job', 'default', 'backup-manual');
      const cmd = cj ? [].concat(cj.spec.jobTemplate.spec.template.spec.containers[0].command || [], cj.spec.jobTemplate.spec.template.spec.containers[0].args || []).join(' ') : '';
      return [
        { t: '스케줄 */30 * * * * · busybox:1.37 · echo backup done', ok: !!cj && cj.spec.schedule.replace(/\s+/g, ' ') === '*/30 * * * *' && cj.spec.jobTemplate.spec.template.spec.containers[0].image === 'busybox:1.37' && cmd.includes('echo backup done') },
        { t: 'successfulJobsHistoryLimit 2', ok: !!cj && cj.spec.successfulJobsHistoryLimit === 2 },
        { t: 'Job backup-manual 이 완료', ok: !!j && ((j.status || {}).succeeded || 0) >= 1 },
      ];
    },
  },
  {
    id: 'w12', domain: 'workloads', level: 3, lesson: 'scheduling', title: '워커 노드의 static pod',
    text: '`node01` 에 static pod `static-web` 을 만드세요. 이미지 `nginx:1.27`. (kubelet 이 직접 띄우는 파드 — API 서버에는 `static-web-node01` 로 보입니다)',
    setup() {},
    hints: ['static pod 경로는 kubelet 설정 `staticPodPath` — `/var/lib/kubelet/config.yaml` 에서 확인한다(보통 `/etc/kubernetes/manifests`).', '`kubectl run static-web --image=nginx:1.27 --dry-run=client -o yaml > static-web.yaml` 을 만든 뒤, **node01 에 ssh 해서** 그 경로에 둔다.', 'controlplane 의 manifests 폴더에 두면 controlplane 에 뜬다 — 노드를 확인할 것.'],
    solution: [
      'ssh node01',
      'grep staticPodPath /var/lib/kubelet/config.yaml',
      'kubectl run static-web --image=nginx:1.27 --dry-run=client -o yaml > /etc/kubernetes/manifests/static-web.yaml',
      'exit',
      'kubectl get pod static-web-node01 -o wide',
    ],
    check: (c) => {
      const p = pod(c, 'default', 'static-web-node01');
      return [
        { t: 'node01 의 /etc/kubernetes/manifests 에 매니페스트', ok: Object.keys(c.hosts.node01.files).some((f) => f.startsWith('/etc/kubernetes/manifests/') && /static-web/.test(c.hosts.node01.files[f])) },
        { t: 'static-web-node01 이 node01 에서 Running', ok: !!p && p.spec.nodeName === 'node01' && isReady(p) && ctr(p).image === 'nginx:1.27' },
      ];
    },
  },
  {
    id: 'w13', domain: 'workloads', level: 1, lesson: 'scheduling', title: 'PriorityClass 붙이기',
    text: 'PriorityClass `high-priority`(값 `100000`, 전역 기본 아님)를 만들고, 네임스페이스 `default` 의 디플로이먼트 `critical`(이미 있음)의 파드가 이 우선순위를 쓰도록 바꾸세요.',
    setup(c, s) { s.run('kubectl create deployment critical --image=nginx:1.27 --replicas=2'); },
    hints: ['`kubectl create priorityclass high-priority --value=100000`', '파드 템플릿의 `spec.template.spec.priorityClassName` — `kubectl edit deploy critical` 이나 patch.'],
    solution: ['kubectl create priorityclass high-priority --value=100000', `kubectl patch deployment critical -p '{"spec":{"template":{"spec":{"priorityClassName":"high-priority"}}}}'`, 'kubectl rollout status deployment critical', "kubectl get pods -l app=critical -o custom-columns=NAME:.metadata.name,PRIORITY:.spec.priority"],
    check: (c) => {
      const pc = get(c, 'PriorityClass', '', 'high-priority');
      const pods = podsOfDeploy(c, 'default', 'critical');
      return [
        { t: 'high-priority = 100000', ok: !!pc && pc.value === 100000 && !pc.globalDefault },
        { t: '템플릿에 priorityClassName', ok: ((get(c, 'Deployment', 'default', 'critical') || {}).spec || { template: { spec: {} } }).template.spec.priorityClassName === 'high-priority' },
        { t: '새 파드 2개가 priority 100000 으로 Ready', ok: pods.length === 2 && pods.every((p) => p.spec.priority === 100000 && isReady(p)) },
      ];
    },
  },

  // ═════════════════════════ 클러스터 아키텍처 · 설치 · 구성 ═════════════════════════
  {
    id: 'a1', domain: 'arch', level: 2, lesson: 'rbac', title: 'ServiceAccount 에 네임스페이스 권한',
    text: '네임스페이스 `dev` 에서:\n1. ServiceAccount `deployer`\n2. Role `deploy-manager` — `deployments` 에 대해 `get, list, create, update, delete`\n3. RoleBinding `deployer-binding` 으로 둘을 연결\n`deployer` 는 dev 의 디플로이먼트는 만들 수 있지만 **파드를 지우거나 다른 네임스페이스에 손대면 안 됩니다**.',
    setup(c, s) { s.run('kubectl create ns dev'); },
    hints: ['`kubectl create sa deployer -n dev`', '`kubectl create role deploy-manager --verb=get,list,create,update,delete --resource=deployments -n dev`', '`kubectl create rolebinding deployer-binding --role=deploy-manager --serviceaccount=dev:deployer -n dev`', '검증: `kubectl auth can-i create deployments --as=system:serviceaccount:dev:deployer -n dev`'],
    solution: ['kubectl create sa deployer -n dev', 'kubectl create role deploy-manager --verb=get,list,create,update,delete --resource=deployments -n dev', 'kubectl create rolebinding deployer-binding --role=deploy-manager --serviceaccount=dev:deployer -n dev', 'kubectl auth can-i create deployments --as=system:serviceaccount:dev:deployer -n dev', 'kubectl auth can-i delete pods --as=system:serviceaccount:dev:deployer -n dev'],
    check: (c) => {
      const s = sa('dev', 'deployer');
      return [
        { t: 'SA dev/deployer', ok: !!get(c, 'ServiceAccount', 'dev', 'deployer') },
        { t: 'dev 에서 deployments create·delete 가능', ok: c.canI(s, 'create', 'deployments', 'dev', null, 'apps') && c.canI(s, 'delete', 'deployments', 'dev', null, 'apps') && c.canI(s, 'list', 'deployments', 'dev', null, 'apps') },
        { t: 'pods 삭제 불가 · default 네임스페이스 불가', ok: !c.canI(s, 'delete', 'pods', 'dev', null, '') && !c.canI(s, 'create', 'deployments', 'default', null, 'apps') },
        { t: 'RoleBinding deployer-binding → Role deploy-manager', ok: ((get(c, 'RoleBinding', 'dev', 'deployer-binding') || {}).roleRef || {}).name === 'deploy-manager' },
      ];
    },
  },
  {
    id: 'a2', domain: 'arch', level: 2, lesson: 'rbac', title: '클러스터 전체 읽기 권한(사용자)',
    text: '사용자 `auditor` 가 **클러스터 전체**의 `nodes` 와 `persistentvolumes` 를 `get, list, watch` 할 수 있게 하세요. ClusterRole 이름 `node-pv-reader`, 바인딩 이름 `auditor-binding`.',
    setup() {},
    hints: ['노드·PV 는 네임스페이스가 없는 리소스라 Role 이 아니라 **ClusterRole + ClusterRoleBinding**.', '`kubectl create clusterrole node-pv-reader --verb=get,list,watch --resource=nodes,persistentvolumes`', '`kubectl auth can-i list nodes --as=auditor`'],
    solution: ['kubectl create clusterrole node-pv-reader --verb=get,list,watch --resource=nodes,persistentvolumes', 'kubectl create clusterrolebinding auditor-binding --clusterrole=node-pv-reader --user=auditor', 'kubectl auth can-i list nodes --as=auditor', 'kubectl auth can-i delete nodes --as=auditor'],
    check: (c) => {
      const u = { user: 'auditor', groups: ['system:authenticated'] };
      return [
        { t: 'nodes · persistentvolumes 를 list/watch 가능', ok: c.canI(u, 'list', 'nodes', '', null, '') && c.canI(u, 'watch', 'persistentvolumes', '', null, '') && c.canI(u, 'get', 'nodes', '', null, '') },
        { t: '쓰기 권한은 없음', ok: !c.canI(u, 'delete', 'nodes', '', null, '') && !c.canI(u, 'list', 'pods', 'default', null, '') },
        { t: 'ClusterRoleBinding auditor-binding → node-pv-reader', ok: ((get(c, 'ClusterRoleBinding', '', 'auditor-binding') || {}).roleRef || {}).name === 'node-pv-reader' },
      ];
    },
  },
  {
    id: 'a3', domain: 'arch', level: 2, lesson: 'etcd-backup', title: 'etcd 스냅샷 백업',
    text: 'controlplane 의 etcd 를 `/opt/etcd-backup.db` 로 백업하세요. 인증서는 `/etc/kubernetes/pki/etcd/` 아래에 있습니다. 엔드포인트는 `https://127.0.0.1:2379`.',
    setup() {},
    hints: ['필요한 값은 etcd static pod 매니페스트에 다 있다: `cat /etc/kubernetes/manifests/etcd.yaml | grep -E "cert|key|listen-client"`', '`etcdctl snapshot save /opt/etcd-backup.db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key`', '확인: `etcdutl snapshot status /opt/etcd-backup.db -w table`'],
    solution: ['grep -E "cert-file|key-file|trusted-ca|listen-client" /etc/kubernetes/manifests/etcd.yaml', 'etcdctl snapshot save /opt/etcd-backup.db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key', 'etcdutl snapshot status /opt/etcd-backup.db -w table'],
    check: (c) => [
      { t: '/opt/etcd-backup.db 스냅샷이 저장됨', ok: !!c.etcd.snapshots['/opt/etcd-backup.db'] },
      { t: '클러스터는 계속 정상(API 서버 응답)', ok: c.apiUp() },
    ],
  },
  {
    id: 'a4', domain: 'arch', level: 3, lesson: 'etcd-backup', title: 'etcd 스냅샷으로 복구',
    text: '`/opt/backup/etcd-snapshot.db` 는 조금 전에 찍은 etcd 스냅샷입니다. 그 뒤에 만들어진 것들을 없애고 **스냅샷 시점으로 클러스터를 되돌리세요.** 복구 데이터 디렉터리는 `/var/lib/etcd-restore` 를 쓰세요.',
    setup(c, s) {
      mkdir(c, '/opt/backup');
      s.run('kubectl create deployment before-backup --image=nginx:1.27');
      s.run('etcdctl snapshot save /opt/backup/etcd-snapshot.db --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key');
      s.run('kubectl create deployment after-backup --image=nginx:1.27');
    },
    hints: ['복구는 서버에 접속할 필요가 없다 → `etcdutl snapshot restore /opt/backup/etcd-snapshot.db --data-dir /var/lib/etcd-restore`', '그다음 etcd 가 새 디렉터리를 쓰게 한다: `/etc/kubernetes/manifests/etcd.yaml` 의 **hostPath** `etcd-data` 경로를 `/var/lib/etcd-restore` 로.', '매니페스트를 저장하면 kubelet 이 etcd 를 다시 띄운다. 1~2분 동안 kubectl 이 안 되는 건 정상.'],
    solution: [
      'etcdutl snapshot restore /opt/backup/etcd-snapshot.db --data-dir /var/lib/etcd-restore',
      { vi: '/etc/kubernetes/manifests/etcd.yaml', from: 'path: /var/lib/etcd\n', to: 'path: /var/lib/etcd-restore\n', note: 'volumes 의 etcd-data hostPath.path 를 /var/lib/etcd-restore 로 바꾼다' },
      'kubectl get deploy',
    ],
    check: (c) => [
      { t: 'etcd 가 /var/lib/etcd-restore 를 쓴다', ok: c.etcd.active === '/var/lib/etcd-restore' },
      { t: 'API 서버 정상', ok: c.apiUp() },
      { t: '스냅샷 시점 상태(before-backup 있음, after-backup 없음)', ok: !!get(c, 'Deployment', 'default', 'before-backup') && !get(c, 'Deployment', 'default', 'after-backup') },
    ],
  },
  {
    id: 'a5', domain: 'arch', level: 3, lesson: 'cluster-upgrade', title: '컨트롤 플레인 업그레이드',
    text: '컨트롤 플레인 노드 `controlplane` 을 **v1.36.1** 로 업그레이드하세요(kubeadm · kubelet · kubectl 모두). 패키지 저장소는 이미 v1.36 으로 바꿔 두었습니다. 작업 전에 노드를 비우고, 끝나면 다시 스케줄 가능하게 돌려놓으세요. 워커는 건드리지 않습니다.',
    setup(c) { c.hosts.controlplane.files['/etc/apt/sources.list.d/kubernetes.list'] = 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.36/deb/ /\n'; },
    hints: ['순서: drain → kubeadm 올리기 → `kubeadm upgrade plan` → `kubeadm upgrade apply v1.36.1` → kubelet·kubectl 올리기 → daemon-reload·restart kubelet → uncordon', '패키지는 hold 가 걸려 있다: `apt-mark unhold kubeadm` … 끝나면 다시 hold.', '`apt-cache madison kubeadm` 으로 정확한 버전 문자열(1.36.1-1.1)을 확인.'],
    solution: [
      'kubectl drain controlplane --ignore-daemonsets',
      'apt-get update', 'apt-cache madison kubeadm',
      "apt-mark unhold kubeadm && apt-get install -y kubeadm='1.36.1-1.1' && apt-mark hold kubeadm",
      'kubeadm version', 'kubeadm upgrade plan', 'kubeadm upgrade apply v1.36.1 -y',
      "apt-mark unhold kubelet kubectl && apt-get install -y kubelet='1.36.1-1.1' kubectl='1.36.1-1.1' && apt-mark hold kubelet kubectl",
      'systemctl daemon-reload && systemctl restart kubelet',
      'kubectl uncordon controlplane', 'kubectl get nodes',
    ],
    check: (c) => [
      { t: '컨트롤 플레인 구성요소 v1.36.1', ok: serverVersion(c) === 'v1.36.1' },
      { t: 'controlplane kubelet v1.36.1 + kubectl v1.36.1', ok: c.hosts.controlplane.kubeletRunning === 'v1.36.1' && c.hosts.controlplane.pkgs.kubectl === 'v1.36.1' && nodeReady(c, 'controlplane') },
      { t: 'uncordon 으로 원상복구', ok: !get(c, 'Node', '', 'controlplane').spec.unschedulable },
      { t: '워커는 그대로 v1.35.2', ok: c.hosts.node01.kubeletRunning === 'v1.35.2' },
    ],
  },
  {
    id: 'a6', domain: 'arch', level: 3, lesson: 'cluster-upgrade', title: '워커 노드 업그레이드',
    text: '컨트롤 플레인은 이미 v1.36.1 입니다. 워커 `node01` 을 **v1.36.1** 로 올리세요(kubeadm · kubelet). 작업 중 워크로드는 다른 노드로 옮기고, 끝나면 복구하세요.',
    setup(c, s) {
      const cp = c.hosts.controlplane;
      for (const comp of ['kube-apiserver', 'kube-controller-manager', 'kube-scheduler']) cp.files[`/etc/kubernetes/manifests/${comp}.yaml`] = cp.files[`/etc/kubernetes/manifests/${comp}.yaml`].replace(/v1\.35\.2/, 'v1.36.1');
      cp.pkgs = { kubeadm: 'v1.36.1', kubelet: 'v1.36.1', kubectl: 'v1.36.1' }; cp.kubeletRunning = 'v1.36.1';
      c.hosts.node01.files['/etc/apt/sources.list.d/kubernetes.list'] = 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.36/deb/ /\n';
      s.run('kubectl create deployment shop --image=nginx:1.27 --replicas=4');
    },
    hints: ['drain·uncordon 은 **controlplane 셸에서**(워커엔 kubeconfig 가 없다), 패키지 작업은 **node01 에 ssh 해서**.', '워커는 `kubeadm upgrade apply` 가 아니라 `kubeadm upgrade node`.', '끝나면 `exit` 로 돌아와 `kubectl uncordon node01`.'],
    solution: [
      'kubectl drain node01 --ignore-daemonsets',
      'ssh node01',
      'apt-get update',
      "apt-mark unhold kubeadm && apt-get install -y kubeadm='1.36.1-1.1' && apt-mark hold kubeadm",
      'kubeadm upgrade node',
      "apt-mark unhold kubelet && apt-get install -y kubelet='1.36.1-1.1' && apt-mark hold kubelet",
      'systemctl daemon-reload && systemctl restart kubelet',
      'exit',
      'kubectl uncordon node01', 'kubectl get nodes',
    ],
    check: (c) => [
      { t: 'node01 kubelet v1.36.1', ok: c.hosts.node01.kubeletRunning === 'v1.36.1' && nodeReady(c, 'node01') },
      { t: 'kubeadm upgrade node 수행', ok: c.upgradedNodes.has('node01') },
      { t: 'node01 uncordon', ok: !get(c, 'Node', '', 'node01').spec.unschedulable },
      { t: 'shop 파드 4개 Ready', ok: readyCount(c, 'default', 'shop') === 4 },
    ],
  },
  {
    id: 'a7', domain: 'arch', level: 2, lesson: 'helm-kustomize', title: 'Helm 차트 설치',
    text: 'Helm 저장소 `bitnami`(`https://charts.bitnami.com/bitnami`)를 추가하고, 차트 `bitnami/nginx` **버전 21.1.2** 를 릴리스 이름 `web` 으로 네임스페이스 `web` 에 설치하세요(네임스페이스가 없으면 함께 만듦). 값: `replicaCount=2`, `service.type=ClusterIP`.',
    setup() {},
    hints: ['`helm repo add bitnami https://charts.bitnami.com/bitnami && helm repo update`', '`helm install web bitnami/nginx --version 21.1.2 -n web --create-namespace --set replicaCount=2 --set service.type=ClusterIP`', '`helm list -n web`, `kubectl get deploy,svc -n web`'],
    solution: ['helm repo add bitnami https://charts.bitnami.com/bitnami', 'helm repo update', 'helm search repo bitnami/nginx', 'helm install web bitnami/nginx --version 21.1.2 -n web --create-namespace --set replicaCount=2 --set service.type=ClusterIP', 'helm list -n web', 'kubectl get deploy,svc -n web'],
    check: (c) => {
      const rel = c.helm.releases.find((r) => r.name === 'web' && r.ns === 'web');
      const d = get(c, 'Deployment', 'web', 'web-nginx'), sv = get(c, 'Service', 'web', 'web-nginx');
      return [
        { t: '릴리스 web (bitnami/nginx 21.1.2, ns web)', ok: !!rel && rel.chart === 'bitnami/nginx' && rel.version === '21.1.2' },
        { t: '레플리카 2 가 Ready', ok: !!d && d.spec.replicas === 2 && readyCount(c, 'web', 'web-nginx') === 2 },
        { t: '서비스 타입 ClusterIP', ok: !!sv && sv.spec.type === 'ClusterIP' },
      ];
    },
  },
  {
    id: 'a8', domain: 'arch', level: 2, lesson: 'helm-kustomize', title: 'Helm template — CRD 없이 매니페스트 뽑기',
    text: 'Argo CD 를 설치할 매니페스트를 파일로 만드세요(설치는 하지 않음). 저장소 `argo`(`https://argoproj.github.io/argo-helm`), 차트 `argo/argo-cd` 버전 `8.3.0`, 릴리스 이름 `argocd`, 네임스페이스 `argocd`. **CRD 는 이미 설치돼 있으니 결과물에 CRD 가 들어가면 안 됩니다.** 저장 위치: `/opt/course/a8/argo.yaml`',
    setup(c) { mkdir(c, '/opt/course/a8'); },
    hints: ['`helm template` 은 렌더링만 한다(클러스터에 안 넣음).', '이 차트는 `crds.install` 값으로 CRD 를 끈다: `--set crds.install=false` (차트마다 다르다 → `helm show values argo/argo-cd | grep -A2 crds`)', '`> /opt/course/a8/argo.yaml` 로 저장 후 `grep -c CustomResourceDefinition` 으로 0 인지 확인.'],
    solution: ['helm repo add argo https://argoproj.github.io/argo-helm', 'helm show values argo/argo-cd --version 8.3.0 | grep -A1 crds', 'helm template argocd argo/argo-cd --version 8.3.0 -n argocd --set crds.install=false > /opt/course/a8/argo.yaml', 'grep -c "kind: CustomResourceDefinition" /opt/course/a8/argo.yaml', 'grep "kind:" /opt/course/a8/argo.yaml'],
    check: (c) => {
      const t = file(c, '/opt/course/a8/argo.yaml') || '';
      return [
        { t: '파일에 Deployment 가 렌더링됨', ok: /kind: Deployment/.test(t) && /name: argocd-server/.test(t) },
        { t: 'CRD 가 없다', ok: !!t && !/kind: CustomResourceDefinition/.test(t) },
        { t: '클러스터에 설치하지 않았다', ok: !c.helm.releases.some((r) => r.name === 'argocd') },
      ];
    },
  },
  {
    id: 'a9', domain: 'arch', level: 2, lesson: 'helm-kustomize', title: 'Kustomize 로 환경별 배포',
    text: '`/opt/course/a9/` 에 kustomization 이 있습니다. 이것을 고쳐서 적용했을 때 **네임스페이스 `staging`** 에, 이미지 **`nginx:1.27`**, 레플리카 **3** 인 디플로이먼트가 만들어지게 하세요. 적용은 `kubectl apply -k` 로 합니다. (`deployment.yaml` 은 수정하지 마세요)',
    setup(c, s) {
      mkdir(c, '/opt/course/a9');
      mkfile(c, '/opt/course/a9/deployment.yaml', 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: portal\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: portal\n  template:\n    metadata:\n      labels:\n        app: portal\n    spec:\n      containers:\n      - name: portal\n        image: nginx:1.26\n');
      mkfile(c, '/opt/course/a9/kustomization.yaml', 'apiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nresources:\n- deployment.yaml\n');
      s.run('kubectl create ns staging');
    },
    hints: ['kustomization.yaml 에 `namespace: staging`', '`images:` 항목: `- name: nginx  newTag: "1.27"`', '`replicas:` 항목: `- name: portal  count: 3`', '적용 전 미리보기: `kubectl kustomize /opt/course/a9`'],
    solution: [
      'cat <<EOF > /opt/course/a9/kustomization.yaml', 'apiVersion: kustomize.config.k8s.io/v1beta1', 'kind: Kustomization', 'namespace: staging', 'resources:', '- deployment.yaml', 'images:', '- name: nginx', '  newTag: "1.27"', 'replicas:', '- name: portal', '  count: 3', 'EOF',
      'kubectl kustomize /opt/course/a9',
      'kubectl apply -k /opt/course/a9',
      'kubectl get deploy -n staging -o wide',
    ],
    check: (c) => {
      const d = get(c, 'Deployment', 'staging', 'portal');
      return [
        { t: 'deployment.yaml 원본 그대로', ok: /nginx:1\.26/.test(file(c, '/opt/course/a9/deployment.yaml') || '') },
        { t: 'staging/portal 이 nginx:1.27', ok: !!d && ctr(d).image === 'nginx:1.27' },
        { t: '레플리카 3 모두 Ready', ok: !!d && d.spec.replicas === 3 && readyCount(c, 'staging', 'portal') === 3 },
      ];
    },
  },
  {
    id: 'a10', domain: 'arch', level: 2, lesson: 'extensions-crd', title: 'CRD 와 커스텀 리소스',
    text: '클러스터에 CRD `backups.stable.example.com` 이 설치돼 있습니다.\n1. `stable.example.com` 그룹의 CRD 에서 **`Backup` 리소스의 spec 필드 이름**을 확인하세요(`kubectl explain`).\n2. 네임스페이스 `default` 에 `Backup` 리소스 `nightly` 를 만드세요: `schedule: "0 2 * * *"`, `retention: 7`.\n3. 클러스터의 **모든 CRD 이름**을 `/opt/course/a10/crds.txt` 에 한 줄에 하나씩 저장하세요.',
    setup(c, s) {
      mkdir(c, '/opt/course/a10');
      mkfile(c, '/tmp/crd.yaml', 'apiVersion: apiextensions.k8s.io/v1\nkind: CustomResourceDefinition\nmetadata:\n  name: backups.stable.example.com\nspec:\n  group: stable.example.com\n  scope: Namespaced\n  names:\n    kind: Backup\n    plural: backups\n    singular: backup\n    shortNames: [bk]\n  versions:\n  - name: v1\n    served: true\n    storage: true\n    schema:\n      openAPIV3Schema:\n        type: object\n        properties:\n          spec:\n            type: object\n            description: BackupSpec defines when and how long to keep backups.\n            required: [schedule]\n            properties:\n              schedule:\n                type: string\n                description: Cron expression for the backup.\n              retention:\n                type: integer\n                description: Number of days to keep each backup.\n');
      s.run('kubectl apply -f /tmp/crd.yaml'); s.run('rm /tmp/crd.yaml');
    },
    hints: ['`kubectl get crd` → `kubectl explain backup.spec`', 'apiVersion 은 `<group>/<version>` = `stable.example.com/v1`', '`kubectl get crd -o name` 은 `customresourcedefinition.apiextensions.k8s.io/…` 가 붙는다 → jsonpath 나 custom-columns 로 이름만.'],
    solution: [
      'kubectl get crd', 'kubectl explain backup.spec',
      'cat <<EOF | kubectl apply -f -', 'apiVersion: stable.example.com/v1', 'kind: Backup', 'metadata:', '  name: nightly', 'spec:', '  schedule: "0 2 * * *"', '  retention: 7', 'EOF',
      'kubectl get backups',
      "kubectl get crd -o jsonpath='{range .items[*]}{.metadata.name}{\"\\n\"}{end}' > /opt/course/a10/crds.txt",
      'cat /opt/course/a10/crds.txt',
    ],
    check: (c) => {
      const b = get(c, 'Backup', 'default', 'nightly');
      const want = c.list('CustomResourceDefinition').map((x) => x.metadata.name).sort();
      return [
        { t: 'Backup nightly (0 2 * * *, 7)', ok: !!b && b.spec.schedule === '0 2 * * *' && Number(b.spec.retention) === 7 },
        { t: 'crds.txt 에 모든 CRD 이름', ok: JSON.stringify(lines(file(c, '/opt/course/a10/crds.txt')).sort()) === JSON.stringify(want) },
      ];
    },
  },

  // ═════════════════════════ 서비스 · 네트워킹 ═════════════════════════
  {
    id: 'n1', domain: 'network', level: 1, lesson: 'services', title: 'NodePort 로 외부 공개',
    text: '디플로이먼트 `shop`(네임스페이스 `default`, 이미 있음)을 서비스 `shop-svc` 로 공개하세요. 타입 **NodePort**, 포트 `80` → 컨테이너 `80`, 노드 포트 **30100**.',
    setup(c, s) { s.run('kubectl create deployment shop --image=nginx:1.27 --replicas=2'); },
    hints: ['`kubectl expose deployment shop --name=shop-svc --type=NodePort --port=80 --target-port=80` 은 nodePort 를 무작위로 준다.', '→ `--dry-run=client -o yaml` 로 뽑아 `nodePort: 30100` 을 넣거나, 만든 뒤 `kubectl edit svc shop-svc`.'],
    solution: ['kubectl expose deployment shop --name=shop-svc --type=NodePort --port=80 --target-port=80 --dry-run=client -o yaml > /root/svc.yaml', { vi: '/root/svc.yaml', from: '    targetPort: 80', to: '    targetPort: 80\n    nodePort: 30100', note: 'ports 항목에 nodePort: 30100 추가' }, 'kubectl apply -f /root/svc.yaml', 'kubectl get svc shop-svc', 'kubectl get endpoints shop-svc'],
    check: (c) => {
      const sv = get(c, 'Service', 'default', 'shop-svc');
      const ep = get(c, 'Endpoints', 'default', 'shop-svc');
      return [
        { t: 'NodePort 80 → 80, nodePort 30100', ok: !!sv && sv.spec.type === 'NodePort' && sv.spec.ports.some((p) => p.port === 80 && Number(p.targetPort) === 80 && p.nodePort === 30100) },
        { t: '엔드포인트 2개', ok: !!ep && (ep.subsets || []).reduce((a, x) => a + x.addresses.length, 0) === 2 },
      ];
    },
  },
  {
    id: 'n2', domain: 'network', level: 2, lesson: 'services', title: '엔드포인트가 비어 있는 서비스',
    text: '네임스페이스 `billing` 의 서비스 `billing-svc` 로 접속하면 연결이 거부됩니다. 디플로이먼트 `billing` 은 정상입니다. **서비스를 고쳐서** `billing-svc:80` 으로 nginx 응답이 오게 하세요. (디플로이먼트는 수정 금지)',
    setup(c, s) {
      s.run('kubectl create ns billing');
      s.run('kubectl create deployment billing --image=nginx:1.27 --replicas=2 -n billing');
      s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: Service', 'metadata:', '  name: billing-svc', '  namespace: billing', 'spec:', '  selector:', '    app: bill', '  ports:', '  - port: 80', '    targetPort: 8080', 'EOF'].join('\n'));
    },
    hints: ['`kubectl get ep billing-svc -n billing` — ENDPOINTS 가 `<none>` 이면 **셀렉터**가 파드 레이블과 안 맞는 것.', '`kubectl get pods -n billing --show-labels` 와 `kubectl describe svc` 의 Selector 를 비교.', '엔드포인트가 생겨도 거부되면 **targetPort** 가 컨테이너가 듣는 포트와 다른 것(nginx=80).', '확인: `kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n billing -- wget -qO- -T2 billing-svc`'],
    solution: ['kubectl get ep billing-svc -n billing', 'kubectl get pods -n billing --show-labels', `kubectl patch svc billing-svc -n billing -p '{"spec":{"selector":{"app":"billing"},"ports":[{"port":80,"targetPort":80}]}}'`, 'kubectl get ep billing-svc -n billing', 'kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n billing -- wget -qO- -T2 billing-svc'],
    check: (c) => {
      const d = get(c, 'Deployment', 'billing', 'billing');
      const probe = c.list('Pod', 'billing').find(isReady);
      const conn = probe ? c.connect(probe, 'billing-svc', 80) : { ok: false };
      return [
        { t: '디플로이먼트는 그대로(레이블 app=billing)', ok: !!d && d.spec.template.metadata.labels.app === 'billing' },
        { t: '엔드포인트가 생겼다', ok: !!(get(c, 'Endpoints', 'billing', 'billing-svc') || {}).subsets },
        { t: 'billing-svc:80 → nginx 응답', ok: conn.ok && /nginx/.test(conn.body || '') },
      ];
    },
  },
  {
    id: 'n3', domain: 'network', level: 2, lesson: 'network-policy', title: 'DB 는 API 에서만',
    text: '네임스페이스 `secure` 에 파드 `db`(app=db, 6379), `api`(app=api), `other`(app=other) 가 있습니다. NetworkPolicy `db-allow-api` 를 만들어 **`db` 로 들어오는 트래픽은 `app=api` 파드의 TCP 6379 만 허용**하세요. 다른 파드들의 통신에는 영향이 없어야 합니다.',
    setup(c, s) {
      s.run('kubectl create ns secure');
      s.run('kubectl run db --image=redis:7 --labels=app=db --port=6379 -n secure');
      s.run('kubectl run api --image=nginx:1.27 --labels=app=api -n secure');
      s.run('kubectl run other --image=nginx:1.27 --labels=app=other -n secure');
    },
    hints: ['정책이 **선택한 파드**(`podSelector: app=db`)만 영향을 받는다. 나머지 파드는 그대로.', 'ingress.from.podSelector 로 app=api, ports 로 TCP 6379.', '확인: `kubectl exec -n secure api -- …` 대신 nginx 이미지엔 nc 가 없다 → 임시 busybox 파드에 `--labels=app=api` 를 붙여 `nc -zv -w2 <db IP> 6379`.'],
    solution: [
      'cat <<EOF | kubectl apply -f -', 'apiVersion: networking.k8s.io/v1', 'kind: NetworkPolicy', 'metadata:', '  name: db-allow-api', '  namespace: secure', 'spec:', '  podSelector:', '    matchLabels:', '      app: db', '  policyTypes:', '  - Ingress', '  ingress:', '  - from:', '    - podSelector:', '        matchLabels:', '          app: api', '    ports:', '    - protocol: TCP', '      port: 6379', 'EOF',
      'kubectl describe netpol db-allow-api -n secure',
    ],
    check: (c) => {
      const db = pod(c, 'secure', 'db'), api = pod(c, 'secure', 'api'), other = pod(c, 'secure', 'other');
      if (!db || !api || !other) return [{ t: '파드 db·api·other 가 있어야 한다', ok: false }];
      return [
        { t: 'api → db:6379 허용', ok: c.netAllowed(api, db, 6379).ok },
        { t: 'other → db:6379 차단', ok: !c.netAllowed(other, db, 6379).ok },
        { t: 'api → db 의 다른 포트는 차단', ok: !c.netAllowed(api, db, 8080).ok },
        { t: '다른 파드끼리 통신은 그대로(other → api:80)', ok: c.netAllowed(other, api, 80).ok },
      ];
    },
  },
  {
    id: 'n4', domain: 'network', level: 3, lesson: 'network-policy', title: '기본 차단 + DNS 만 열기',
    text: '네임스페이스 `locked` 의 모든 파드에 대해:\n1. NetworkPolicy `default-deny` — 모든 **ingress 와 egress 를 차단**\n2. NetworkPolicy `allow-dns` — **DNS(UDP·TCP 53) egress 만** 허용\n두 정책 모두 네임스페이스 안의 모든 파드를 대상으로 합니다.',
    setup(c, s) { s.run('kubectl create ns locked'); s.run('kubectl run a --image=nginx:1.27 --labels=app=a -n locked'); s.run('kubectl run b --image=nginx:1.27 --labels=app=b -n locked'); },
    hints: ['"모든 파드" = `podSelector: {}`', 'default-deny: `policyTypes: [Ingress, Egress]` 에 규칙을 **하나도** 안 쓴다.', 'allow-dns: egress 에 ports 53/UDP, 53/TCP (to 를 생략하면 목적지 무관). DNS 를 막으면 서비스 이름 해석이 전부 죽는다.'],
    solution: [
      'cat <<EOF | kubectl apply -f -', 'apiVersion: networking.k8s.io/v1', 'kind: NetworkPolicy', 'metadata:', '  name: default-deny', '  namespace: locked', 'spec:', '  podSelector: {}', '  policyTypes:', '  - Ingress', '  - Egress', '---', 'apiVersion: networking.k8s.io/v1', 'kind: NetworkPolicy', 'metadata:', '  name: allow-dns', '  namespace: locked', 'spec:', '  podSelector: {}', '  policyTypes:', '  - Egress', '  egress:', '  - ports:', '    - protocol: UDP', '      port: 53', '    - protocol: TCP', '      port: 53', 'EOF',
      'kubectl get netpol -n locked',
    ],
    check: (c) => {
      const a = pod(c, 'locked', 'a'), b = pod(c, 'locked', 'b');
      if (!a || !b) return [{ t: '파드 a·b 가 있어야 한다', ok: false }];
      const ext = c.list('Pod', 'default')[0] || c.list('Pod', 'kube-system').find((p) => !p.spec.hostNetwork);
      return [
        { t: 'a → b 차단(ingress·egress)', ok: !c.netAllowed(a, b, 80).ok },
        { t: '밖 → a 차단', ok: !!ext && !c.netAllowed(ext, a, 80).ok },
        { t: 'DNS 해석은 된다', ok: c.resolveDNS(a, 'kubernetes.default').ok },
        { t: '정책 이름 default-deny · allow-dns', ok: !!get(c, 'NetworkPolicy', 'locked', 'default-deny') && !!get(c, 'NetworkPolicy', 'locked', 'allow-dns') },
      ];
    },
  },
  {
    id: 'n5', domain: 'network', level: 3, lesson: 'network-policy', title: '다른 네임스페이스에서만 허용',
    text: '네임스페이스 `backend` 의 파드 `app=api` 는 **레이블 `team=frontend` 가 붙은 네임스페이스의 파드**에서 오는 TCP 80 만 받아야 합니다. NetworkPolicy 이름은 `from-frontend`. 네임스페이스 `web-ui` 에 `team=frontend` 레이블을 붙여 이 정책의 혜택을 받게 하세요.',
    setup(c, s) {
      s.run('kubectl create ns backend'); s.run('kubectl create ns web-ui'); s.run('kubectl create ns batch');
      s.run('kubectl run api --image=nginx:1.27 --labels=app=api -n backend');
      s.run('kubectl run ui --image=nginx:1.27 --labels=app=ui -n web-ui');
      s.run('kubectl run job --image=nginx:1.27 --labels=app=job -n batch');
    },
    hints: ['`kubectl label ns web-ui team=frontend`', 'from 에 `namespaceSelector` 만 쓰면 "그 네임스페이스의 모든 파드". podSelector 와 **같은 항목**에 쓰면 AND, 다른 항목(- 두 개)이면 OR — 가장 흔한 실수.', '같은 네임스페이스(backend) 파드도 막혀야 한다.'],
    solution: [
      'kubectl label ns web-ui team=frontend',
      'cat <<EOF | kubectl apply -f -', 'apiVersion: networking.k8s.io/v1', 'kind: NetworkPolicy', 'metadata:', '  name: from-frontend', '  namespace: backend', 'spec:', '  podSelector:', '    matchLabels:', '      app: api', '  policyTypes:', '  - Ingress', '  ingress:', '  - from:', '    - namespaceSelector:', '        matchLabels:', '          team: frontend', '    ports:', '    - protocol: TCP', '      port: 80', 'EOF',
    ],
    check: (c) => {
      const api = pod(c, 'backend', 'api'), ui = pod(c, 'web-ui', 'ui'), job = pod(c, 'batch', 'job');
      if (!api || !ui || !job) return [{ t: '파드들이 있어야 한다', ok: false }];
      const self = { metadata: { namespace: 'backend', labels: { app: 'other' } }, spec: { containers: [] } };
      return [
        { t: 'web-ui 에 team=frontend', ok: ((get(c, 'Namespace', '', 'web-ui').metadata.labels) || {}).team === 'frontend' },
        { t: 'web-ui → api:80 허용', ok: c.netAllowed(ui, api, 80).ok },
        { t: 'batch → api 차단, backend 내부 → api 차단', ok: !c.netAllowed(job, api, 80).ok && !c.netAllowed(self, api, 80).ok },
      ];
    },
  },
  {
    id: 'n6', domain: 'network', level: 2, lesson: 'ingress-gateway', title: '호스트·경로 기반 Ingress',
    text: '네임스페이스 `default` 에 Ingress `shop-ing` 을 만드세요. IngressClass `nginx`, 호스트 `shop.example.com`:\n- `/api` (Prefix) → 서비스 `api-svc` 포트 `8080`\n- `/` (Prefix) → 서비스 `web-svc` 포트 `80`',
    setup(c, s) { s.run('kubectl create deployment api --image=hashicorp/http-echo:1.0 -- /http-echo -listen=:8080 -text=api'); s.run('kubectl create service clusterip api-svc --tcp=8080:8080'); s.run('kubectl create deployment web --image=nginx:1.27'); s.run('kubectl create service clusterip web-svc --tcp=80:80'); },
    hints: ['`kubectl create ingress shop-ing --class=nginx --rule="shop.example.com/api*=api-svc:8080" --rule="shop.example.com/*=web-svc:80"`', '`*` 를 붙이면 pathType Prefix, 안 붙이면 Exact.', '`kubectl describe ingress shop-ing` 에서 Backends 확인.'],
    solution: ['kubectl create ingress shop-ing --class=nginx --rule="shop.example.com/api*=api-svc:8080" --rule="shop.example.com/*=web-svc:80"', 'kubectl describe ingress shop-ing'],
    check: (c) => {
      const ing = get(c, 'Ingress', 'default', 'shop-ing');
      const rule = ing && (ing.spec.rules || []).find((r) => r.host === 'shop.example.com');
      const path = (p) => rule && rule.http.paths.find((x) => x.path === p);
      const a = path('/api'), w = path('/');
      return [
        { t: 'class nginx · host shop.example.com', ok: !!ing && ing.spec.ingressClassName === 'nginx' && !!rule },
        { t: '/api Prefix → api-svc:8080', ok: !!a && a.pathType === 'Prefix' && a.backend.service.name === 'api-svc' && a.backend.service.port.number === 8080 },
        { t: '/ Prefix → web-svc:80', ok: !!w && w.pathType === 'Prefix' && w.backend.service.name === 'web-svc' && w.backend.service.port.number === 80 },
      ];
    },
  },
  {
    id: 'n7', domain: 'network', level: 3, lesson: 'ingress-gateway', title: 'Gateway API 로 라우팅',
    text: 'Gateway API 로 서비스 `web`(네임스페이스 `default`, 포트 80)을 공개하세요.\n1. Gateway `web-gw` — GatewayClass `nginx`, 리스너 이름 `http`, 프로토콜 HTTP, 포트 80\n2. HTTPRoute `web-route` — 호스트 `web.example.com`, 부모 `web-gw`, 모든 경로(`/` PathPrefix) → 서비스 `web:80`',
    setup(c, s) { s.run('kubectl create deployment web --image=nginx:1.27'); s.run('kubectl expose deployment web --port=80'); },
    hints: ['Gateway API 는 명령형 생성기가 없다 → 문서 gateway-api.sigs.k8s.io 의 예제를 가져온다.', 'HTTPRoute 의 `parentRefs: - name: web-gw`, `backendRefs: - name: web  port: 80`', '`kubectl get gateway,httproute`'],
    solution: [
      'cat <<EOF | kubectl apply -f -', 'apiVersion: gateway.networking.k8s.io/v1', 'kind: Gateway', 'metadata:', '  name: web-gw', 'spec:', '  gatewayClassName: nginx', '  listeners:', '  - name: http', '    protocol: HTTP', '    port: 80', '---', 'apiVersion: gateway.networking.k8s.io/v1', 'kind: HTTPRoute', 'metadata:', '  name: web-route', 'spec:', '  parentRefs:', '  - name: web-gw', '  hostnames:', '  - web.example.com', '  rules:', '  - matches:', '    - path:', '        type: PathPrefix', '        value: /', '    backendRefs:', '    - name: web', '      port: 80', 'EOF',
      'kubectl get gateway,httproute',
    ],
    check: (c) => {
      const g = get(c, 'Gateway', 'default', 'web-gw'), r = get(c, 'HTTPRoute', 'default', 'web-route');
      const l = g && (g.spec.listeners || []).find((x) => x.name === 'http');
      const be = r && (r.spec.rules || []).flatMap((x) => x.backendRefs || []).find((b) => b.name === 'web');
      return [
        { t: 'Gateway web-gw (nginx, http/HTTP/80)', ok: !!g && g.spec.gatewayClassName === 'nginx' && !!l && l.protocol === 'HTTP' && l.port === 80 },
        { t: 'HTTPRoute 부모 = web-gw · 호스트 web.example.com', ok: !!r && (r.spec.parentRefs || []).some((p) => p.name === 'web-gw') && (r.spec.hostnames || []).includes('web.example.com') },
        { t: '백엔드 web:80', ok: !!be && Number(be.port) === 80 },
      ];
    },
  },
  {
    id: 'n8', domain: 'network', level: 1, lesson: 'dns-coredns', title: '서비스 DNS 이름',
    text: '네임스페이스 `data` 에 서비스 `db-svc` 가 있습니다.\n1. 이 서비스의 **FQDN**(완전한 도메인 이름)을 `/opt/course/n8/fqdn.txt` 에 쓰세요.\n2. 네임스페이스 `default` 의 임시 파드에서 그 이름을 `nslookup` 한 결과를 `/opt/course/n8/nslookup.txt` 에 저장하세요.',
    setup(c, s) { mkdir(c, '/opt/course/n8'); s.run('kubectl create ns data'); s.run('kubectl create deployment db --image=redis:7 -n data'); s.run('kubectl expose deployment db --name=db-svc --port=6379 -n data'); },
    hints: ['형식: `<서비스>.<네임스페이스>.svc.cluster.local`', '`kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- nslookup db-svc.data.svc.cluster.local > /opt/course/n8/nslookup.txt`'],
    solution: ['echo db-svc.data.svc.cluster.local > /opt/course/n8/fqdn.txt', 'kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- nslookup db-svc.data.svc.cluster.local > /opt/course/n8/nslookup.txt', 'cat /opt/course/n8/nslookup.txt'],
    check: (c) => {
      const ip = (get(c, 'Service', 'data', 'db-svc') || { spec: {} }).spec.clusterIP;
      return [
        { t: 'FQDN = db-svc.data.svc.cluster.local', ok: (file(c, '/opt/course/n8/fqdn.txt') || '').trim().replace(/\.$/, '') === 'db-svc.data.svc.cluster.local' },
        { t: 'nslookup 결과에 서비스 IP', ok: !!ip && (file(c, '/opt/course/n8/nslookup.txt') || '').includes(ip) },
      ];
    },
  },

  // ═════════════════════════ 스토리지 ═════════════════════════
  {
    id: 's1', domain: 'storage', level: 2, lesson: 'volumes-pv-pvc', title: 'PV · PVC · 파드 연결',
    text: '1. PersistentVolume `pv-data` — 용량 `1Gi`, 접근 모드 `ReadWriteOnce`, hostPath `/mnt/data`, storageClassName `manual`\n2. PersistentVolumeClaim `pvc-data`(네임스페이스 `default`) — `500Mi`, `ReadWriteOnce`, storageClassName `manual`\n3. 파드 `data-pod`(이미지 `nginx:1.27`) — PVC 를 `/usr/share/nginx/html` 에 마운트',
    setup() {},
    hints: ['PV·PVC 는 명령형 생성기가 없다 → 문서 "Configure a Pod to Use a PersistentVolume for Storage" 예제.', 'PVC 가 PV 에 묶이려면 **storageClassName · accessModes 가 같고 용량이 PV 이하**여야 한다.', '`kubectl get pv,pvc` 에서 STATUS 가 Bound 인지.'],
    solution: [
      'cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: PersistentVolume', 'metadata:', '  name: pv-data', 'spec:', '  capacity:', '    storage: 1Gi', '  accessModes:', '  - ReadWriteOnce', '  storageClassName: manual', '  hostPath:', '    path: /mnt/data', '---', 'apiVersion: v1', 'kind: PersistentVolumeClaim', 'metadata:', '  name: pvc-data', 'spec:', '  accessModes:', '  - ReadWriteOnce', '  storageClassName: manual', '  resources:', '    requests:', '      storage: 500Mi', '---', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: data-pod', 'spec:', '  containers:', '  - name: nginx', '    image: nginx:1.27', '    volumeMounts:', '    - name: data', '      mountPath: /usr/share/nginx/html', '  volumes:', '  - name: data', '    persistentVolumeClaim:', '      claimName: pvc-data', 'EOF',
      'kubectl get pv,pvc', 'kubectl get pod data-pod',
    ],
    check: (c) => {
      const pv = get(c, 'PersistentVolume', '', 'pv-data'), pvc = get(c, 'PersistentVolumeClaim', 'default', 'pvc-data'), p = pod(c, 'default', 'data-pod');
      return [
        { t: 'pv-data (1Gi, RWO, manual, /mnt/data)', ok: !!pv && pv.spec.capacity.storage === '1Gi' && pv.spec.accessModes.includes('ReadWriteOnce') && pv.spec.storageClassName === 'manual' && (pv.spec.hostPath || {}).path === '/mnt/data' },
        { t: 'pvc-data 가 pv-data 에 Bound', ok: !!pvc && pvc.status.phase === 'Bound' && pvc.spec.volumeName === 'pv-data' },
        { t: 'data-pod 가 /usr/share/nginx/html 에 마운트하고 Running', ok: !!p && isReady(p) && (ctr(p).volumeMounts || []).some((m) => m.mountPath === '/usr/share/nginx/html') && (p.spec.volumes || []).some((v) => v.persistentVolumeClaim && v.persistentVolumeClaim.claimName === 'pvc-data') },
      ];
    },
  },
  {
    id: 's2', domain: 'storage', level: 2, lesson: 'volumes-pv-pvc', title: '새 StorageClass 를 기본값으로',
    text: 'StorageClass `fast` 를 만드세요: provisioner `rancher.io/local-path`, reclaimPolicy **Retain**, volumeBindingMode **WaitForFirstConsumer**, 볼륨 확장 허용. 그리고 이것을 **클러스터 기본 StorageClass** 로 만드세요(기본값은 하나만).',
    setup() {},
    hints: ['기본값은 어노테이션 `storageclass.kubernetes.io/is-default-class: "true"`', '기존 기본값 `local-path` 의 어노테이션을 `"false"` 로: `kubectl patch sc local-path -p \'{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}\'`', '`kubectl get sc` 에서 (default) 표시가 하나인지.'],
    solution: [
      'cat <<EOF | kubectl apply -f -', 'apiVersion: storage.k8s.io/v1', 'kind: StorageClass', 'metadata:', '  name: fast', '  annotations:', '    storageclass.kubernetes.io/is-default-class: "true"', 'provisioner: rancher.io/local-path', 'reclaimPolicy: Retain', 'volumeBindingMode: WaitForFirstConsumer', 'allowVolumeExpansion: true', 'EOF',
      `kubectl patch sc local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'`,
      'kubectl get sc',
    ],
    check: (c) => {
      const sc = get(c, 'StorageClass', '', 'fast');
      const defs = c.list('StorageClass').filter((x) => (x.metadata.annotations || {})['storageclass.kubernetes.io/is-default-class'] === 'true');
      return [
        { t: 'fast: local-path · Retain · WaitForFirstConsumer · 확장 허용', ok: !!sc && sc.provisioner === 'rancher.io/local-path' && sc.reclaimPolicy === 'Retain' && sc.volumeBindingMode === 'WaitForFirstConsumer' && sc.allowVolumeExpansion === true },
        { t: '기본값은 fast 하나뿐', ok: defs.length === 1 && defs[0].metadata.name === 'fast' },
      ];
    },
  },
  {
    id: 's3', domain: 'storage', level: 2, lesson: 'volumes-pv-pvc', title: 'Pending PVC 고치기',
    text: '파드 `report`(네임스페이스 `default`)가 Pending 입니다. PVC `app-pvc` 가 PV `app-pv` 에 묶이지 않는 것이 원인입니다. **PV 는 그대로 두고** PVC 를 고쳐 파드가 뜨게 하세요. (PVC 이름은 유지)',
    setup(c, s) {
      s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: PersistentVolume', 'metadata:', '  name: app-pv', 'spec:', '  capacity:', '    storage: 1Gi', '  accessModes:', '  - ReadWriteOnce', '  storageClassName: manual', '  hostPath:', '    path: /mnt/app', '---', 'apiVersion: v1', 'kind: PersistentVolumeClaim', 'metadata:', '  name: app-pvc', 'spec:', '  accessModes:', '  - ReadWriteMany', '  storageClassName: manual', '  resources:', '    requests:', '      storage: 2Gi', '---', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: report', 'spec:', '  containers:', '  - name: report', '    image: nginx:1.27', '    volumeMounts:', '    - name: d', '      mountPath: /data', '  volumes:', '  - name: d', '    persistentVolumeClaim:', '      claimName: app-pvc', 'EOF'].join('\n'));
    },
    hints: ['`kubectl describe pvc app-pvc` 의 Events', 'PV 와 PVC 의 **accessModes · 용량**을 나란히 비교한다.', 'PVC 의 spec 은 만든 뒤 대부분 못 바꾼다 → `kubectl get pvc app-pvc -o yaml > pvc.yaml` 로 고친 뒤 `kubectl replace --force -f pvc.yaml`. 파드가 쓰고 있으면 PVC 가 지워지지 않을 수 있으니 파드도 다시 만든다.'],
    solution: [
      'kubectl describe pvc app-pvc | tail -4', 'kubectl get pv app-pv',
      'kubectl get pod report -o yaml > /root/report.yaml',
      'kubectl delete pod report --force --grace-period=0', 'kubectl delete pvc app-pvc',
      'cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: PersistentVolumeClaim', 'metadata:', '  name: app-pvc', 'spec:', '  accessModes:', '  - ReadWriteOnce', '  storageClassName: manual', '  resources:', '    requests:', '      storage: 1Gi', 'EOF',
      'kubectl apply -f /root/report.yaml', 'kubectl get pvc,pod',
    ],
    check: (c) => {
      const pv = get(c, 'PersistentVolume', '', 'app-pv'), pvc = get(c, 'PersistentVolumeClaim', 'default', 'app-pvc'), p = pod(c, 'default', 'report');
      return [
        { t: 'PV 는 그대로(1Gi, RWO)', ok: !!pv && pv.spec.capacity.storage === '1Gi' && pv.spec.accessModes.join() === 'ReadWriteOnce' },
        { t: 'app-pvc 가 app-pv 에 Bound', ok: !!pvc && pvc.status.phase === 'Bound' && pvc.spec.volumeName === 'app-pv' },
        { t: 'report 파드 Running', ok: !!p && isReady(p) },
      ];
    },
  },
  {
    id: 's4', domain: 'storage', level: 1, lesson: 'volumes-pv-pvc', title: 'PVC 용량 늘리기',
    text: 'PVC `grow-pvc`(네임스페이스 `default`)의 용량을 **1Gi → 2Gi** 로 늘리세요. 이 PVC 의 StorageClass 는 확장을 허용합니다.',
    setup(c, s) {
      s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: storage.k8s.io/v1', 'kind: StorageClass', 'metadata:', '  name: expandable', 'provisioner: rancher.io/local-path', 'volumeBindingMode: Immediate', 'allowVolumeExpansion: true', '---', 'apiVersion: v1', 'kind: PersistentVolumeClaim', 'metadata:', '  name: grow-pvc', 'spec:', '  accessModes:', '  - ReadWriteOnce', '  storageClassName: expandable', '  resources:', '    requests:', '      storage: 1Gi', 'EOF'].join('\n'));
    },
    hints: ['PVC 에서 바꿀 수 있는 몇 안 되는 필드가 `spec.resources.requests.storage`(늘리기만 가능).', "`kubectl patch pvc grow-pvc -p '{\"spec\":{\"resources\":{\"requests\":{\"storage\":\"2Gi\"}}}}'` 또는 `kubectl edit pvc grow-pvc`"],
    solution: [`kubectl patch pvc grow-pvc -p '{"spec":{"resources":{"requests":{"storage":"2Gi"}}}}'`, 'kubectl get pvc grow-pvc'],
    check: (c) => {
      const pvc = get(c, 'PersistentVolumeClaim', 'default', 'grow-pvc');
      return [
        { t: '요청 용량 2Gi', ok: !!pvc && pvc.spec.resources.requests.storage === '2Gi' },
        { t: '여전히 Bound', ok: !!pvc && pvc.status.phase === 'Bound' },
      ];
    },
  },

  // ═════════════════════════ 트러블슈팅 ═════════════════════════
  {
    id: 't1', domain: 'trouble', level: 1, lesson: 'troubleshoot-apps', title: '뜨지 않는 디플로이먼트 ①',
    text: '네임스페이스 `prod` 의 디플로이먼트 `web-app` 파드가 하나도 Ready 가 아닙니다. 원인을 찾아 고치세요. 올바른 이미지는 `nginx:1.27` 입니다.',
    setup(c, s) { s.run('kubectl create ns prod'); s.run('kubectl create deployment web-app --image=nginx:lates --replicas=3 -n prod'); },
    hints: ['`kubectl get pods -n prod` → STATUS 가 무엇인가?', '`kubectl describe pod <이름> -n prod` 의 Events 맨 아래를 읽는다.', '`kubectl set image deployment/web-app nginx=nginx:1.27 -n prod`'],
    solution: ['kubectl get pods -n prod', 'kubectl describe pod -n prod -l app=web-app | tail -5', 'kubectl set image deployment/web-app nginx=nginx:1.27 -n prod', 'kubectl rollout status deployment web-app -n prod'],
    check: (c) => [
      { t: '이미지 nginx:1.27', ok: ctr(get(c, 'Deployment', 'prod', 'web-app')).image === 'nginx:1.27' },
      { t: '3개 모두 Ready', ok: readyCount(c, 'prod', 'web-app') === 3 && podsOfDeploy(c, 'prod', 'web-app').length === 3 },
    ],
  },
  {
    id: 't2', domain: 'trouble', level: 2, lesson: 'troubleshoot-apps', title: '계속 재시작하는 DB',
    text: '파드 `mysql`(네임스페이스 `default`)이 CrashLoopBackOff 입니다. 로그를 보고 원인을 고치세요. 비밀번호는 이미 있는 Secret `mysql-secret` 의 키 `password` 를 써야 합니다(값을 직접 적지 말 것).',
    setup(c, s) { s.run("kubectl create secret generic mysql-secret --from-literal=password='r00tP@ss'"); s.run('kubectl run mysql --image=mysql:8.4'); },
    hints: ['`kubectl logs mysql` — 무엇을 요구하나?', '파드의 env 는 실행 중에 못 바꾼다 → `kubectl get pod mysql -o yaml > m.yaml`, 고친 뒤 `kubectl replace --force -f m.yaml`', '`valueFrom.secretKeyRef` 로 `MYSQL_ROOT_PASSWORD`.'],
    solution: [
      'kubectl logs mysql',
      'kubectl get pod mysql -o yaml > /root/mysql.yaml',
      { vi: '/root/mysql.yaml', from: '  - image: mysql:8.4\n', to: '  - image: mysql:8.4\n    env:\n    - name: MYSQL_ROOT_PASSWORD\n      valueFrom:\n        secretKeyRef:\n          name: mysql-secret\n          key: password\n', note: '컨테이너에 env 블록을 추가한다' },
      'kubectl replace --force -f /root/mysql.yaml',
      'kubectl get pod mysql',
    ],
    check: (c) => {
      const p = pod(c, 'default', 'mysql');
      const e = p && envOf(c, p, 'MYSQL_ROOT_PASSWORD');
      return [
        { t: 'MYSQL_ROOT_PASSWORD ← mysql-secret/password', ok: !!e && !!e.valueFrom && !!e.valueFrom.secretKeyRef && e.valueFrom.secretKeyRef.name === 'mysql-secret' && e.valueFrom.secretKeyRef.key === 'password' },
        { t: 'mysql 파드 Running', ok: !!p && isReady(p) },
      ];
    },
  },
  {
    id: 't3', domain: 'trouble', level: 2, lesson: 'troubleshoot-apps', title: 'Pending 에서 멈춘 파드',
    text: '디플로이먼트 `analytics`(네임스페이스 `default`)의 파드가 Pending 입니다. 이 워크로드는 SSD 디스크가 있는 노드에서 돌아야 합니다. **노드는 건드리지 말고** 고치세요.',
    setup(c, s) { s.run('kubectl label node node01 disktype=ssd'); s.run('kubectl create deployment analytics --image=nginx:1.27 --replicas=2'); s.run(`kubectl patch deployment analytics -p '{"spec":{"template":{"spec":{"nodeSelector":{"disktype":"sdd"}}}}}'`); },
    hints: ['`kubectl describe pod` 의 FailedScheduling 메시지를 읽는다.', '`kubectl get nodes --show-labels | grep disktype`', 'nodeSelector 값 오타(`sdd`) → `ssd`'],
    solution: ['kubectl get pods -l app=analytics', 'kubectl describe pod -l app=analytics | grep -A3 Events', 'kubectl get nodes -L disktype', `kubectl patch deployment analytics -p '{"spec":{"template":{"spec":{"nodeSelector":{"disktype":"ssd"}}}}}'`, 'kubectl get pods -l app=analytics -o wide'],
    check: (c) => {
      const pods = podsOfDeploy(c, 'default', 'analytics');
      return [
        { t: '노드 레이블은 그대로', ok: get(c, 'Node', '', 'node01').metadata.labels.disktype === 'ssd' && !get(c, 'Node', '', 'node02').metadata.labels.disktype },
        { t: '파드 2개 Ready · node01 에 배치', ok: pods.length === 2 && pods.every((p) => isReady(p) && p.spec.nodeName === 'node01') },
      ];
    },
  },
  {
    id: 't4', domain: 'trouble', level: 2, lesson: 'troubleshoot-cluster', title: 'NotReady 노드 ①',
    text: '노드 `node01` 이 NotReady 입니다. 원인을 찾아 고치고, **재부팅 후에도** 정상이도록 하세요.',
    setup(c) { const h = c.hosts.node01; h.services.kubelet.active = false; h.services.kubelet.enabled = false; },
    hints: ['노드 문제는 노드에서: `ssh node01`', '`systemctl status kubelet` — inactive? disabled?', '`systemctl enable --now kubelet` (enable = 부팅 시 자동 시작)'],
    solution: ['kubectl get nodes', 'kubectl describe node node01 | grep -A6 Conditions', 'ssh node01', 'systemctl status kubelet', 'systemctl enable --now kubelet', 'systemctl status kubelet', 'exit', 'kubectl get nodes'],
    check: (c) => [
      { t: 'node01 Ready', ok: nodeReady(c, 'node01') },
      { t: 'kubelet enabled(재부팅 대비)', ok: c.hosts.node01.services.kubelet.enabled },
    ],
  },
  {
    id: 't5', domain: 'trouble', level: 3, lesson: 'troubleshoot-cluster', title: 'NotReady 노드 ② — 서비스 설정',
    text: '노드 `node02` 가 NotReady 입니다. kubelet 을 재시작해도 해결되지 않습니다. 원인을 찾아 고치세요.',
    setup(c) { const h = c.hosts.node02; h.files['/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf'] = h.files['/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf'].replace('ExecStart=/usr/bin/kubelet ', 'ExecStart=/usr/local/bin/kubelet '); h.reloadedDropin = h.files['/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf']; },
    hints: ['`ssh node02` → `systemctl status kubelet` 의 `status=203/EXEC` 는 "실행 파일을 못 찾음".', '`journalctl -u kubelet | tail` 로 경로를 확인, `which kubelet` 과 비교.', 'drop-in 파일을 고친 뒤 **`systemctl daemon-reload`** 를 해야 systemd 가 새 설정을 읽는다.'],
    solution: ['ssh node02', 'systemctl status kubelet', 'journalctl -u kubelet | tail -4', 'which kubelet', { vi: '/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf', from: 'ExecStart=/usr/local/bin/kubelet ', to: 'ExecStart=/usr/bin/kubelet ', note: 'ExecStart 경로를 /usr/bin/kubelet 으로' }, 'systemctl daemon-reload', 'systemctl restart kubelet', 'systemctl status kubelet', 'exit', 'kubectl get nodes'],
    check: (c) => [
      { t: 'node02 Ready', ok: nodeReady(c, 'node02') },
      { t: 'drop-in 이 /usr/bin/kubelet 을 가리킨다', ok: /ExecStart=\/usr\/bin\/kubelet /.test(c.hosts.node02.files['/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf']) },
    ],
  },
  {
    id: 't6', domain: 'trouble', level: 3, lesson: 'troubleshoot-cluster', title: '새 파드가 전부 Pending',
    text: '방금 만든 파드 `probe`(네임스페이스 `default`)가 Pending 에서 움직이지 않고, Events 도 없습니다. 기존 파드들은 멀쩡합니다. 클러스터를 고치세요.',
    setup(c, s) { const f = '/etc/kubernetes/manifests/kube-scheduler.yaml'; c.hosts.controlplane.files[f] = c.hosts.controlplane.files[f].replace(/--kubeconfig=\/etc\/kubernetes\/scheduler\.conf/, '--kubeconfig=/etc/kubernetes/scheduler.conff'); c.reconcile(); s.run('kubectl run probe --image=nginx:1.27'); },
    hints: ['Events 가 아예 없다 = 스케줄러가 파드를 보지도 않았다.', '`kubectl get pods -n kube-system` → kube-scheduler 상태', '`kubectl logs -n kube-system kube-scheduler-controlplane` 또는 `crictl ps -a` + `crictl logs`', '컨트롤 플레인 구성요소는 `/etc/kubernetes/manifests/` 의 static pod — 파일을 고치면 kubelet 이 다시 띄운다.'],
    solution: ['kubectl describe pod probe | tail -3', 'kubectl get pods -n kube-system', 'kubectl logs -n kube-system kube-scheduler-controlplane', 'grep kubeconfig /etc/kubernetes/manifests/kube-scheduler.yaml', 'ls /etc/kubernetes/', { vi: '/etc/kubernetes/manifests/kube-scheduler.yaml', from: 'scheduler.conff', to: 'scheduler.conf', note: '--kubeconfig 경로 오타(conff → conf)' }, 'kubectl get pods -n kube-system', 'kubectl get pod probe -o wide'],
    check: (c) => {
      const p = pod(c, 'default', 'probe');
      return [
        { t: 'kube-scheduler 정상', ok: c.schedulerUp() && isReady(pod(c, 'kube-system', 'kube-scheduler-controlplane')) },
        { t: 'probe 가 스케줄되어 Running', ok: !!p && !!p.spec.nodeName && isReady(p) },
      ];
    },
  },
  {
    id: 't7', domain: 'trouble', level: 3, lesson: 'troubleshoot-cluster', title: 'kubectl 이 전혀 안 된다',
    text: '누군가 API 서버 설정을 만진 뒤 `kubectl` 이 `connection refused` 만 냅니다. 원인을 찾아 클러스터를 복구하세요.',
    setup(c) { const f = '/etc/kubernetes/manifests/kube-apiserver.yaml'; c.hosts.controlplane.files[f] = c.hosts.controlplane.files[f].replace('--etcd-servers=https://127.0.0.1:2379', '--etcd-servers=https://127.0.0.1:2380'); c.reconcile(); },
    hints: ['kubectl 이 죽었으니 **런타임**에 직접 묻는다: `crictl ps -a | grep apiserver` → `crictl logs <ID>`', '로그의 접속 대상 포트를 etcd 가 실제로 듣는 포트(`/etc/kubernetes/manifests/etcd.yaml` 의 `--listen-client-urls`)와 비교.', 'etcd 클라이언트 포트는 2379, 2380 은 피어(etcd 끼리) 포트.'],
    solution: ['kubectl get nodes', 'crictl ps -a | grep apiserver', 'crictl logs $(crictl ps -a --name kube-apiserver -q)', 'grep listen-client /etc/kubernetes/manifests/etcd.yaml', 'grep etcd-servers /etc/kubernetes/manifests/kube-apiserver.yaml', { vi: '/etc/kubernetes/manifests/kube-apiserver.yaml', from: '127.0.0.1:2380', to: '127.0.0.1:2379', note: '--etcd-servers 포트 2380 → 2379' }, 'kubectl get nodes'],
    check: (c) => [
      { t: 'API 서버 응답', ok: c.apiUp() },
      { t: '--etcd-servers 가 2379', ok: /--etcd-servers=https:\/\/127\.0\.0\.1:2379/.test(c.hosts.controlplane.files['/etc/kubernetes/manifests/kube-apiserver.yaml']) },
    ],
  },
  {
    id: 't8', domain: 'trouble', level: 2, lesson: 'troubleshoot-network', title: 'Ready 가 안 되는 파드와 빈 서비스',
    text: '디플로이먼트 `catalog`(네임스페이스 `default`) 파드는 Running 인데 READY 가 0/1 이고, 서비스 `catalog` 로 접속이 안 됩니다. **디플로이먼트를 고쳐** 서비스가 동작하게 하세요. 컨테이너는 포트 80 에서 서비스합니다.',
    setup(c, s) {
      s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: apps/v1', 'kind: Deployment', 'metadata:', '  name: catalog', 'spec:', '  replicas: 2', '  selector:', '    matchLabels:', '      app: catalog', '  template:', '    metadata:', '      labels:', '        app: catalog', '    spec:', '      containers:', '      - name: catalog', '        image: nginx:1.27', '        ports:', '        - containerPort: 80', '        readinessProbe:', '          httpGet:', '            path: /', '            port: 8080', '          periodSeconds: 5', 'EOF'].join('\n'));
      s.run('kubectl expose deployment catalog --port=80');
    },
    hints: ['READY 0/1 + Running = 준비성 검사(readinessProbe) 실패. `kubectl describe pod` 의 `Readiness probe failed`.', '준비 안 된 파드는 서비스 엔드포인트에서 빠진다 → `kubectl get ep catalog` 가 비어 있다.', 'probe 의 port 를 80 으로.'],
    solution: ['kubectl get pods -l app=catalog', 'kubectl describe pod -l app=catalog | grep -i readiness', 'kubectl get ep catalog', `kubectl patch deployment catalog --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/port","value":80}]'`, 'kubectl rollout status deployment catalog', 'kubectl get ep catalog'],
    check: (c) => [
      { t: '파드 2개 Ready', ok: readyCount(c, 'default', 'catalog') === 2 && podsOfDeploy(c, 'default', 'catalog').length === 2 },
      { t: 'readinessProbe 는 유지(포트 80)', ok: ((ctr(get(c, 'Deployment', 'default', 'catalog')).readinessProbe || {}).httpGet || {}).port == 80 },
      { t: '서비스 엔드포인트 2개', ok: ((get(c, 'Endpoints', 'default', 'catalog') || {}).subsets || []).reduce((a, x) => a + x.addresses.length, 0) === 2 },
    ],
  },
  {
    id: 't9', domain: 'trouble', level: 2, lesson: 'dns-coredns', title: '이름 해석이 안 된다',
    text: '어떤 파드에서도 서비스 이름이 해석되지 않습니다(`nslookup kubernetes` 실패). 클러스터 DNS 를 복구하세요. CoreDNS 는 원래 레플리카 2 로 돌았습니다.',
    setup(c, s) { s.run('kubectl scale deployment coredns -n kube-system --replicas=0'); s.run('kubectl run client --image=busybox:1.37 -- sleep 3600'); },
    hints: ['`kubectl run t --rm -it --image=busybox:1.37 --restart=Never -- nslookup kubernetes` 로 증상 확인', '`kubectl get deploy,pods -n kube-system -l k8s-app=kube-dns`', '`kubectl get ep kube-dns -n kube-system` 가 비어 있으면 DNS 서버가 없는 것.'],
    solution: ['kubectl exec client -- nslookup kubernetes', 'kubectl get deploy -n kube-system', 'kubectl get ep kube-dns -n kube-system', 'kubectl scale deployment coredns -n kube-system --replicas=2', 'kubectl exec client -- nslookup kubernetes'],
    check: (c) => {
      const cl = pod(c, 'default', 'client');
      return [
        { t: 'CoreDNS 2개 Ready', ok: readyCount(c, 'kube-system', 'coredns') === 2 },
        { t: '파드에서 kubernetes.default 해석', ok: !!cl && c.resolveDNS(cl, 'kubernetes').ok },
      ];
    },
  },
  {
    id: 't10', domain: 'trouble', level: 2, lesson: 'troubleshoot-apps', title: 'OOMKilled',
    text: '디플로이먼트 `memhog`(네임스페이스 `default`) 파드가 계속 재시작됩니다. 원인을 확인하고, 앱이 필요로 하는 만큼 **메모리 제한을 256Mi 로** 올려 안정화하세요. 다른 설정은 바꾸지 마세요.',
    setup(c, s) {
      s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: apps/v1', 'kind: Deployment', 'metadata:', '  name: memhog', 'spec:', '  replicas: 1', '  selector:', '    matchLabels:', '      app: memhog', '  template:', '    metadata:', '      labels:', '        app: memhog', '    spec:', '      containers:', '      - name: stress', '        image: polinux/stress', '        command: ["stress"]', '        args: ["--vm", "1", "--vm-bytes", "150M", "--vm-hang", "1"]', '        resources:', '          requests:', '            memory: 64Mi', '          limits:', '            memory: 100Mi', 'EOF'].join('\n'));
    },
    hints: ['`kubectl describe pod -l app=memhog` 의 **Last State: Terminated / Reason: OOMKilled / Exit Code 137**', '`kubectl set resources deployment memhog --limits=memory=256Mi`'],
    solution: ['kubectl get pods -l app=memhog', 'kubectl describe pod -l app=memhog | grep -A3 "Last State"', 'kubectl set resources deployment memhog --limits=memory=256Mi', 'kubectl rollout status deployment memhog', 'kubectl get pods -l app=memhog'],
    check: (c) => {
      const d = get(c, 'Deployment', 'default', 'memhog');
      const r = ctr(d).resources || {};
      return [
        { t: '메모리 제한 256Mi (요청은 64Mi 그대로)', ok: (r.limits || {}).memory === '256Mi' && (r.requests || {}).memory === '64Mi' },
        { t: '파드 Running · Ready', ok: readyCount(c, 'default', 'memhog') === 1 },
      ];
    },
  },
  {
    id: 't11', domain: 'trouble', level: 1, lesson: 'troubleshoot-network', title: 'CPU 를 가장 많이 쓰는 파드',
    text: '네임스페이스 `batch` 에서 레이블 `app=worker` 인 파드 중 **CPU 를 가장 많이 쓰는 파드의 이름**을 `/opt/course/t11/top.txt` 에 쓰세요.',
    setup(c, s) {
      mkdir(c, '/opt/course/t11'); s.run('kubectl create ns batch');
      for (const n of ['worker-a', 'worker-b', 'worker-c', 'helper']) s.run(`kubectl run ${n} --image=nginx:1.27 --labels=app=${n === 'helper' ? 'helper' : 'worker'} -n batch`);
      c.metricsOverride = { 'batch/worker-a': { cpu: 31, mem: 40 }, 'batch/worker-b': { cpu: 412, mem: 60 }, 'batch/worker-c': { cpu: 88, mem: 210 }, 'batch/helper': { cpu: 900, mem: 20 } };
    },
    hints: ['`kubectl top pods -n batch -l app=worker --sort-by=cpu`', '레이블을 빠뜨리면 helper 가 1등이 된다 — 조건을 끝까지 읽을 것.', '이름만 파일로: 표를 눈으로 보고 `echo 이름 > 파일` 해도 된다.'],
    solution: ['kubectl top pods -n batch -l app=worker --sort-by=cpu', "kubectl top pods -n batch -l app=worker --sort-by=cpu --no-headers | head -1 | awk '{print $1}' > /opt/course/t11/top.txt", 'cat /opt/course/t11/top.txt'],
    check: (c) => [{ t: 'worker-b', ok: (file(c, '/opt/course/t11/top.txt') || '').trim() === 'worker-b' }],
  },
  {
    id: 't12', domain: 'trouble', level: 1, lesson: 'troubleshoot-network', title: '로그에서 오류만 모으기',
    text: '파드 `legacy-app`(네임스페이스 `default`)의 로그 중 **`ERROR` 가 들어간 줄만** `/opt/course/t12/errors.log` 에 저장하세요.',
    setup(c, s) {
      mkdir(c, '/opt/course/t12');
      c.logs['default/legacy-app'] = ['2026-09-01T09:00:01Z INFO  starting legacy-app v2.3', '2026-09-01T09:00:02Z INFO  connected to db', '2026-09-01T09:00:07Z ERROR payment gateway timeout (order=1042)', '2026-09-01T09:00:09Z WARN  retrying order=1042', '2026-09-01T09:00:12Z ERROR payment gateway timeout (order=1042)', '2026-09-01T09:00:15Z INFO  order=1043 ok', '2026-09-01T09:00:21Z ERROR cache miss storm: 812 keys'];
      s.run('kubectl run legacy-app --image=nginx:1.27');
    },
    hints: ['`kubectl logs legacy-app | grep ERROR > /opt/course/t12/errors.log`', '대소문자 구분: 문제는 `ERROR` 라고 했다.'],
    solution: ['kubectl logs legacy-app | grep ERROR > /opt/course/t12/errors.log', 'cat /opt/course/t12/errors.log'],
    check: (c) => {
      const want = c.logs['default/legacy-app'].filter((l) => l.includes('ERROR'));
      return [{ t: 'ERROR 3줄이 그대로', ok: JSON.stringify(lines(file(c, '/opt/course/t12/errors.log'))) === JSON.stringify(want) }];
    },
  },
  {
    id: 't13', domain: 'trouble', level: 1, lesson: 'troubleshoot-apps', title: 'CreateContainerConfigError',
    text: '파드 `reporter`(네임스페이스 `default`)가 시작되지 않습니다. 원인을 찾아 고치세요. 설정값 `level` 은 `debug` 여야 합니다. (파드 정의는 수정하지 마세요)',
    setup(c, s) {
      s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: reporter', 'spec:', '  containers:', '  - name: reporter', '    image: busybox:1.37', '    command: ["sh", "-c", "echo level=$LOG_LEVEL; sleep 3600"]', '    env:', '    - name: LOG_LEVEL', '      valueFrom:', '        configMapKeyRef:', '          name: reporter-config', '          key: level', 'EOF'].join('\n'));
    },
    hints: ['`kubectl describe pod reporter` → `configmap "reporter-config" not found`', '`kubectl create configmap reporter-config --from-literal=level=debug` — kubelet 이 곧 다시 시도한다.'],
    solution: ['kubectl get pod reporter', 'kubectl describe pod reporter | tail -3', 'kubectl create configmap reporter-config --from-literal=level=debug', 'kubectl get pod reporter'],
    check: (c) => {
      const cm = get(c, 'ConfigMap', 'default', 'reporter-config');
      const p = pod(c, 'default', 'reporter');
      return [
        { t: 'ConfigMap reporter-config level=debug', ok: !!cm && (cm.data || {}).level === 'debug' },
        { t: 'reporter Running', ok: !!p && isReady(p) },
      ];
    },
  },
  {
    id: 't14', domain: 'trouble', level: 2, lesson: 'troubleshoot-cluster', title: '노드 유지보수',
    text: '`node02` 를 점검하려 합니다. 이 노드에 **새 파드가 오지 않게** 하고, 떠 있는 파드를 모두 다른 노드로 옮기세요(DaemonSet 파드는 예외). 디플로이먼트 `shop` 의 파드는 계속 전부 Ready 여야 합니다.',
    setup(c, s) { s.run('kubectl create deployment shop --image=nginx:1.27 --replicas=4'); s.run('kubectl run scratch --image=nginx:1.27'); s.run(`kubectl patch pod scratch -p '{"spec":{"nodeName":"node02"}}'`); },
    hints: ['`kubectl drain node02 --ignore-daemonsets` — 오류 메시지를 끝까지 읽는다.', '컨트롤러가 없는 파드(scratch)는 옮겨지지 않고 **사라진다** → 그래서 `--force` 가 필요하다.', 'drain 은 cordon 을 포함한다. 점검이 끝날 때까지 uncordon 하지 말 것.'],
    solution: ['kubectl get pods -o wide', 'kubectl drain node02 --ignore-daemonsets', 'kubectl drain node02 --ignore-daemonsets --force', 'kubectl get nodes', 'kubectl get pods -o wide'],
    check: (c) => {
      const n = get(c, 'Node', '', 'node02');
      const left = c.list('Pod').filter((p) => p.spec.nodeName === 'node02' && !(p.metadata.ownerReferences || []).some((o) => o.kind === 'DaemonSet'));
      return [
        { t: 'node02 SchedulingDisabled', ok: !!n.spec.unschedulable },
        { t: 'node02 에 DaemonSet 외 파드 없음', ok: left.length === 0 },
        { t: 'shop 파드 4개 Ready', ok: readyCount(c, 'default', 'shop') === 4 },
      ];
    },
  },
];
// ⚠️t14 준비: patch 로 nodeName 을 바꿀 수 없다(파드 불변) — 준비 단계에서 직접 옮긴다.
TASKS.find((t) => t.id === 't14').setup = function (c, s) {
  s.run('kubectl create deployment shop --image=nginx:1.27 --replicas=4');
  s.runAll(['cat <<EOF | kubectl apply -f -', 'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: scratch', 'spec:', '  nodeName: node02', '  containers:', '  - name: scratch', '    image: nginx:1.27', 'EOF'].join('\n'));
};

export const taskById = (id) => TASKS.find((t) => t.id === id);

/** 과제 하나를 새 클러스터에 준비한다 → { cluster, session } */
export function prepareTask(task, Cluster, Session, seed = 7) {
  const c = new Cluster({ seed });
  const setupSession = new Session(c);
  task.setup(c, setupSession);
  c.reconcile();
  c.events = c.events.slice(-60);
  return { cluster: c, session: new Session(c) };
}

/** 모범 답안 한 단계를 실행한다(브라우저의 '답안 재생'과 node 검증이 같은 코드를 쓴다) */
export function applyStep(s, step) {
  if (typeof step === 'string') return s.run(step);
  if (step.vi) {
    const p = s.abs(step.vi);
    const cur = s.h.files[p];
    if (cur === undefined) return { out: '', err: `(답안 재생) ${step.vi} 가 없습니다` };
    if (!cur.includes(step.from)) return { out: '', err: `(답안 재생) ${step.vi} 에서 '${step.from}' 를 못 찾았습니다` };
    s.h.files[p] = cur.replace(step.from, step.to);
    s.c.reconcile();
    return { out: `(vi ${step.vi} — ${step.note || '수정'})`, err: '' };
  }
  return { out: '', err: '알 수 없는 단계' };
}
export function score(task, c, s) {
  const items = task.check(c, s);
  const got = items.filter((x) => x.ok).length;
  return { items, got, total: items.length, ratio: items.length ? got / items.length : 0 };
}
