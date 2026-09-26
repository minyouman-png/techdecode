// 쿠버네티스 클러스터 시뮬레이터 — 상태 저장소 + 컨트롤러(조정 루프) + 스케줄러 + 네트워크 판정.
//
// ⚠️목표는 '쿠버네티스를 다시 만드는 것'이 아니라 **CKA 실습에서 판단이 갈리는 지점을 진짜처럼
//   재현하는 것**이다. 그래서 다음은 실제와 같은 규칙으로 움직인다:
//     · 컨트롤러 체인(Deployment → ReplicaSet → Pod)과 롤아웃·롤백 이력
//     · 스케줄링(nodeSelector·affinity·taint/toleration·cordon·자원 요청량)
//     · 이미지 오타 → ImagePullBackOff, 없는 ConfigMap → CreateContainerConfigError, 메모리 부족 → OOMKilled
//     · Service 셀렉터·targetPort → Endpoints, NetworkPolicy 로 막힌 통신
//     · 컨트롤 플레인 = /etc/kubernetes/manifests 의 static pod(파일을 고치면 고쳐진다)
//     · kubelet = systemd 서비스(노드에 ssh 해서 살린다), etcd 스냅샷·복구, kubeadm 업그레이드
//   나머지(실제 네트워크·시간 경과 등)는 결과만 흉내 낸다.
// ⚠️DOM 을 쓰지 않는다 — tools/cka-sim-test.mjs 가 node 에서 같은 코드로 과제 전부를 검증한다.

import yaml from 'js-yaml';
import {
  RESOURCES, resolveResource, resourceByKind, parseCpu, parseMem, matchSelector,
  matchLabelSelectorAllowEmpty, clone,
} from './resources.js';

export const K8S_VERSION = 'v1.35.2';
export const K8S_NEXT = 'v1.36.1';
const CP_COMPONENTS = ['etcd', 'kube-apiserver', 'kube-controller-manager', 'kube-scheduler'];
const BASE_TIME = Date.UTC(2026, 8, 1, 9, 0, 0) / 1000;

// ─── 이미지 카탈로그 ─────────────────────────────────────────────────────────
// 여기 없는 저장소 이름은 '레지스트리에 없는 이미지'로 본다(ngnix 같은 오타가 그대로 ErrImagePull).
const IMAGES = {
  nginx: { port: 80, long: true, log: ['/docker-entrypoint.sh: Configuration complete; ready for start up', '2026/09/01 09:00:01 [notice] 1#1: nginx/1.27.3', '2026/09/01 09:00:01 [notice] 1#1: start worker processes'], body: '<h1>Welcome to nginx!</h1>' },
  httpd: { port: 80, long: true, log: ['AH00558: httpd: Could not reliably determine the server\'s fully qualified domain name', '[mpm_event:notice] AH00489: Apache/2.4.62 (Unix) configured -- resuming normal operations'], body: '<html><body><h1>It works!</h1></body></html>' },
  redis: { port: 6379, long: true, log: ['1:M 01 Sep 2026 09:00:01.000 * Ready to accept connections tcp'] },
  memcached: { port: 11211, long: true, log: [] },
  mysql: { port: 3306, long: true, needEnv: ['MYSQL_ROOT_PASSWORD', 'MYSQL_ALLOW_EMPTY_PASSWORD', 'MYSQL_RANDOM_ROOT_PASSWORD'], log: ['[Server] /usr/sbin/mysqld: ready for connections. Version: \'8.4.3\'  port: 3306'], failLog: ['2026-09-01 09:00:01+00:00 [ERROR] [Entrypoint]: Database is uninitialized and password option is not specified', '    You need to specify one of the following as an environment variable:', '    - MYSQL_ROOT_PASSWORD', '    - MYSQL_ALLOW_EMPTY_PASSWORD', '    - MYSQL_RANDOM_ROOT_PASSWORD'] },
  postgres: { port: 5432, long: true, needEnv: ['POSTGRES_PASSWORD'], log: ['LOG:  database system is ready to accept connections'], failLog: ['Error: Database is uninitialized and superuser password is not specified.', '       You must specify POSTGRES_PASSWORD to a non-empty value for the', '       superuser.'] },
  'traefik/whoami': { port: 80, long: true, log: ['Starting up on port 80'], body: 'Hostname: {pod}\nIP: {ip}' },
  'hashicorp/http-echo': { port: 5678, long: true, log: ['[INFO] server is listening on :5678'], body: 'hello-world' },
  'kicbase/echo-server': { port: 8080, long: true, log: [], body: 'Request served by {pod}' },
  busybox: { long: false }, alpine: { long: false }, ubuntu: { long: false }, debian: { long: false },
  'curlimages/curl': { long: false }, python: { long: false }, node: { long: false }, 'nicolaka/netshoot': { long: false },
  'polinux/stress': { long: true },
  'registry.k8s.io/pause': { long: true },
  'registry.k8s.io/coredns/coredns': { port: 53, long: true, log: ['.:53', '[INFO] plugin/reload: Running configuration SHA512 = 591cf3…', 'CoreDNS-1.12.1', 'linux/amd64, go1.24.1'] },
  'registry.k8s.io/metrics-server/metrics-server': { port: 10250, long: true, log: ['I0901 09:00:03 serving securely on [::]:10250'] },
  'registry.k8s.io/kube-proxy': { long: true, log: ['I0901 09:00:02 server_linux.go:66] "Using iptables proxy"'] },
  'registry.k8s.io/ingress-nginx/controller': { port: 80, long: true, log: ['NGINX Ingress controller', 'Release: v1.12.1'] },
  'docker.io/calico/node': { long: true, log: ['Calico node started successfully'] },
  'docker.io/calico/kube-controllers': { long: true, log: [] },
  'rancher/local-path-provisioner': { long: true, log: [] },
  'bitnami/nginx': { port: 8080, long: true, log: ['nginx 09:00:02.00 INFO  ==> ** Starting NGINX **'], body: '<h1>Welcome to nginx!</h1>' },
  'quay.io/argoproj/argocd': { port: 8080, long: true, log: [] },
  'envoyproxy/envoy': { port: 8080, long: true, log: [] },
  'registry.k8s.io/etcd': { long: true }, 'registry.k8s.io/kube-apiserver': { long: true },
  'registry.k8s.io/kube-controller-manager': { long: true }, 'registry.k8s.io/kube-scheduler': { long: true },
};

export function parseImage(img) {
  img = String(img || '').trim();
  let ref = img, tag = 'latest';
  const at = img.indexOf('@');
  if (at >= 0) { ref = img.slice(0, at); tag = img.slice(at + 1); }
  else {
    const i = img.lastIndexOf(':');
    if (i > img.lastIndexOf('/')) { ref = img.slice(0, i); tag = img.slice(i + 1); }
  }
  let repo = ref.replace(/^docker\.io\/(library\/)?/, '').replace(/^library\//, '');
  if (ref.startsWith('docker.io/calico')) repo = ref;
  return { repo, tag, info: IMAGES[repo] || IMAGES[ref] || null };
}

// 없는 태그(오타)로 흔히 쓰는 것들 — 저장소가 맞아도 이 태그면 이미지가 없다고 본다.
const BAD_TAG = /^(lates|latset|lastest|latestt|1\.2[0-9]\.99|9\.9\.9|v0\.0\.0|nonexist.*|notfound|x)$/;
export function imageExists(img) {
  const p = parseImage(img);
  if (!p.info) return false;
  if (BAD_TAG.test(p.tag)) return false;
  return true;
}

// ─── 난수(시드 고정 — node 검증과 브라우저가 같은 결과를 낸다) ──────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SAFE = 'bcdfghjklmnpqrstvwxz2456789';
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function hashName(s, n) {
  let h = hashStr(s), out = '';
  for (let i = 0; i < n; i++) { out += SAFE[h % SAFE.length]; h = (Math.floor(h / SAFE.length) ^ hashStr(out + s)) >>> 0; }
  return out;
}

export const key = (kind, ns, name) => `${kind}|${ns || ''}|${name}`;

// ─── 컨트롤 플레인 static pod 매니페스트 ────────────────────────────────────
function manifest(name, version, extra = {}) {
  const cmds = {
    'kube-apiserver': ['kube-apiserver', '--advertise-address=172.30.1.2', '--allow-privileged=true', '--authorization-mode=Node,RBAC',
      '--client-ca-file=/etc/kubernetes/pki/ca.crt', '--enable-admission-plugins=NodeRestriction', '--enable-bootstrap-token-auth=true',
      '--etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt', '--etcd-certfile=/etc/kubernetes/pki/apiserver-etcd-client.crt',
      '--etcd-keyfile=/etc/kubernetes/pki/apiserver-etcd-client.key', '--etcd-servers=https://127.0.0.1:2379',
      '--kubelet-client-certificate=/etc/kubernetes/pki/apiserver-kubelet-client.crt', '--kubelet-client-key=/etc/kubernetes/pki/apiserver-kubelet-client.key',
      '--secure-port=6443', '--service-account-issuer=https://kubernetes.default.svc.cluster.local', '--service-account-key-file=/etc/kubernetes/pki/sa.pub',
      '--service-account-signing-key-file=/etc/kubernetes/pki/sa.key', '--service-cluster-ip-range=10.96.0.0/12',
      '--tls-cert-file=/etc/kubernetes/pki/apiserver.crt', '--tls-private-key-file=/etc/kubernetes/pki/apiserver.key'],
    'kube-controller-manager': ['kube-controller-manager', '--allocate-node-cidrs=true', '--authentication-kubeconfig=/etc/kubernetes/controller-manager.conf',
      '--authorization-kubeconfig=/etc/kubernetes/controller-manager.conf', '--bind-address=127.0.0.1', '--client-ca-file=/etc/kubernetes/pki/ca.crt',
      '--cluster-cidr=10.244.0.0/16', '--cluster-name=kubernetes', '--cluster-signing-cert-file=/etc/kubernetes/pki/ca.crt',
      '--cluster-signing-key-file=/etc/kubernetes/pki/ca.key', '--controllers=*,bootstrapsigner,tokencleaner',
      '--kubeconfig=/etc/kubernetes/controller-manager.conf', '--leader-elect=true', '--root-ca-file=/etc/kubernetes/pki/ca.crt',
      '--service-account-private-key-file=/etc/kubernetes/pki/sa.key', '--service-cluster-ip-range=10.96.0.0/12', '--use-service-account-credentials=true'],
    'kube-scheduler': ['kube-scheduler', '--authentication-kubeconfig=/etc/kubernetes/scheduler.conf', '--authorization-kubeconfig=/etc/kubernetes/scheduler.conf',
      '--bind-address=127.0.0.1', '--kubeconfig=/etc/kubernetes/scheduler.conf', '--leader-elect=true'],
    etcd: ['etcd', '--advertise-client-urls=https://172.30.1.2:2379', '--cert-file=/etc/kubernetes/pki/etcd/server.crt', '--client-cert-auth=true',
      '--data-dir=/var/lib/etcd', '--initial-advertise-peer-urls=https://172.30.1.2:2380', '--initial-cluster=controlplane=https://172.30.1.2:2380',
      '--key-file=/etc/kubernetes/pki/etcd/server.key', '--listen-client-urls=https://127.0.0.1:2379,https://172.30.1.2:2379',
      '--listen-peer-urls=https://172.30.1.2:2380', '--name=controlplane', '--peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt',
      '--peer-client-cert-auth=true', '--peer-key-file=/etc/kubernetes/pki/etcd/peer.key', '--peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt',
      '--snapshot-count=10000', '--trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt'],
  };
  const img = name === 'etcd' ? 'registry.k8s.io/etcd:3.6.4-0' : `registry.k8s.io/${name}:${version}`;
  const pod = {
    apiVersion: 'v1', kind: 'Pod',
    metadata: { labels: { component: name, tier: 'control-plane' }, name, namespace: 'kube-system' },
    spec: {
      containers: [{
        command: cmds[name], image: img, imagePullPolicy: 'IfNotPresent', name,
        resources: { requests: { cpu: name === 'kube-apiserver' ? '250m' : name === 'etcd' ? '100m' : name === 'kube-scheduler' ? '100m' : '200m' } },
        volumeMounts: name === 'etcd'
          ? [{ mountPath: '/var/lib/etcd', name: 'etcd-data' }, { mountPath: '/etc/kubernetes/pki/etcd', name: 'etcd-certs' }]
          : [{ mountPath: '/etc/kubernetes/pki', name: 'k8s-certs', readOnly: true }],
      }],
      hostNetwork: true, priorityClassName: 'system-node-critical',
      volumes: name === 'etcd'
        ? [{ hostPath: { path: '/etc/kubernetes/pki/etcd', type: 'DirectoryOrCreate' }, name: 'etcd-certs' },
          { hostPath: { path: '/var/lib/etcd', type: 'DirectoryOrCreate' }, name: 'etcd-data' }]
        : [{ hostPath: { path: '/etc/kubernetes/pki', type: 'DirectoryOrCreate' }, name: 'k8s-certs' }],
    },
    ...extra,
  };
  return yaml.dump(pod, { lineWidth: -1, noRefs: true });
}

const KUBELET_DROPIN = `# Note: This dropin only works with kubeadm and kubelet v1.11+
[Service]
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf --kubeconfig=/etc/kubernetes/kubelet.conf"
Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
EnvironmentFile=-/etc/default/kubelet
ExecStart=
ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
`;
const KUBELET_CONFIG = `apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
authentication:
  anonymous:
    enabled: false
  webhook:
    enabled: true
  x509:
    clientCAFile: /etc/kubernetes/pki/ca.crt
authorization:
  mode: Webhook
cgroupDriver: systemd
clusterDNS:
- 10.96.0.10
clusterDomain: cluster.local
containerRuntimeEndpoint: unix:///var/run/containerd/containerd.sock
staticPodPath: /etc/kubernetes/manifests
`;
const DROPIN_PATH = '/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf';
export { DROPIN_PATH };

function hostFiles(role, version) {
  const minor = version.split('.').slice(0, 2).join('.');
  const f = {
    '/root/.bashrc': 'alias k=kubectl\ncomplete -o default -F __start_kubectl k\n',
    [DROPIN_PATH]: KUBELET_DROPIN,
    '/var/lib/kubelet/config.yaml': KUBELET_CONFIG,
    '/etc/kubernetes/kubelet.conf': 'apiVersion: v1\nkind: Config\n# (kubelet kubeconfig)\n',
    '/etc/kubernetes/pki/ca.crt': '-----BEGIN CERTIFICATE-----\nMIIDBTCCAe2gAwIBAgII…(시뮬레이터 인증서)\n-----END CERTIFICATE-----\n',
    '/etc/apt/sources.list.d/kubernetes.list': `deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/${minor}/deb/ /\n`,
  };
  if (role === 'controlplane') {
    for (const c of ['etcd', 'kube-apiserver', 'kube-controller-manager', 'kube-scheduler']) {
      f[`/etc/kubernetes/manifests/${c}.yaml`] = manifest(c, version);
    }
    for (const p of ['ca.key', 'apiserver.crt', 'apiserver.key', 'apiserver-etcd-client.crt', 'apiserver-etcd-client.key',
      'apiserver-kubelet-client.crt', 'apiserver-kubelet-client.key', 'sa.key', 'sa.pub', 'front-proxy-ca.crt',
      'etcd/ca.crt', 'etcd/ca.key', 'etcd/server.crt', 'etcd/server.key', 'etcd/peer.crt', 'etcd/peer.key',
      'etcd/healthcheck-client.crt', 'etcd/healthcheck-client.key']) {
      f[`/etc/kubernetes/pki/${p}`] = p.endsWith('.key') ? '-----BEGIN PRIVATE KEY-----\n(시뮬레이터 키)\n-----END PRIVATE KEY-----\n' : '-----BEGIN CERTIFICATE-----\n(시뮬레이터 인증서)\n-----END CERTIFICATE-----\n';
    }
    for (const c of ['admin.conf', 'super-admin.conf', 'controller-manager.conf', 'scheduler.conf']) {
      f[`/etc/kubernetes/${c}`] = 'apiVersion: v1\nkind: Config\nclusters:\n- cluster:\n    server: https://172.30.1.2:6443\n  name: kubernetes\n';
    }
    f['/root/.kube/config'] = f['/etc/kubernetes/admin.conf'];
  }
  return f;
}

// ─── 클러스터 ───────────────────────────────────────────────────────────────
export class Cluster {
  constructor({ seed = 7 } = {}) {
    this.rand = mulberry32(seed);
    this.t = BASE_TIME;
    this.objs = new Map();
    this.extraRes = [];          // CRD 로 생긴 리소스 정의
    this.events = [];
    this.logs = {};              // `ns/파드이름접두어` → 로그 줄(과제용)
    this.ipSeq = 10; this.svcSeq = 20; this.nodePortSeq = 30000 + 1200;
    this.hosts = {
      controlplane: { role: 'controlplane', ip: '172.30.1.2', files: hostFiles('controlplane', K8S_VERSION), services: { kubelet: { active: true, enabled: true }, containerd: { active: true, enabled: true } }, pkgs: { kubeadm: K8S_VERSION, kubelet: K8S_VERSION, kubectl: K8S_VERSION }, held: new Set(['kubeadm', 'kubelet', 'kubectl']), kubeletRunning: K8S_VERSION, reloadedDropin: KUBELET_DROPIN, aptUpdated: false },
      node01: { role: 'worker', ip: '172.30.2.2', files: hostFiles('worker', K8S_VERSION), services: { kubelet: { active: true, enabled: true }, containerd: { active: true, enabled: true } }, pkgs: { kubeadm: K8S_VERSION, kubelet: K8S_VERSION, kubectl: K8S_VERSION }, held: new Set(['kubeadm', 'kubelet', 'kubectl']), kubeletRunning: K8S_VERSION, reloadedDropin: KUBELET_DROPIN, aptUpdated: false },
      node02: { role: 'worker', ip: '172.30.2.3', files: hostFiles('worker', K8S_VERSION), services: { kubelet: { active: true, enabled: true }, containerd: { active: true, enabled: true } }, pkgs: { kubeadm: K8S_VERSION, kubelet: K8S_VERSION, kubectl: K8S_VERSION }, held: new Set(['kubeadm', 'kubelet', 'kubectl']), kubeletRunning: K8S_VERSION, reloadedDropin: KUBELET_DROPIN, aptUpdated: false },
    };
    // 빈 디렉터리(파일이 없어도 있어야 하는 곳) — 워커의 staticPodPath 가 대표적
    for (const h of Object.values(this.hosts)) h.dirs = new Set(['/etc/kubernetes/manifests', '/opt', '/tmp', '/root', '/var/lib', '/mnt', '/srv']);
    this.upgradedNodes = new Set();  // kubeadm upgrade node 를 마친 워커
    this.etcd = { dataDirs: { '/var/lib/etcd': 'live' }, active: '/var/lib/etcd', snapshots: {} };
    this.helm = { repos: {}, releases: [] };
    this.contexts = [
      { name: 'kubernetes-admin@kubernetes', cluster: 'kubernetes', user: 'kubernetes-admin', namespace: '' },
    ];
    this.currentContext = 'kubernetes-admin@kubernetes';
    this.bootstrap();
    this.reconcile();
    // 기본 시스템 파드는 '12일 전부터 떠 있던 것'으로 보이게 한다(방금 만든 것처럼 보이면 어색하다)
    for (const o of this.objs.values()) if (o.metadata.creationTimestamp === this.ts()) o.metadata.creationTimestamp = this.ts(-86400 * 12);
    this.events = [];
    this._booted = true;
  }

  now() { return this.t; }
  tick(sec = 3) { this.t += sec; }
  ts(offset = 0) { return new Date((this.t + offset) * 1000).toISOString().replace(/\.\d+Z$/, 'Z'); }
  uid() { const h = () => Math.floor(this.rand() * 0xffff).toString(16).padStart(4, '0'); return `${h()}${h()}-${h()}-${h()}-${h()}-${h()}${h()}${h()}`; }
  randName(n = 5) { let s = ''; for (let i = 0; i < n; i++) s += SAFE[Math.floor(this.rand() * SAFE.length)]; return s; }
  allResources() { return RESOURCES.concat(this.extraRes); }
  resolve(name) { return resolveResource(name, this.extraRes); }
  resOf(kind) { return resourceByKind(kind, this.extraRes); }
  get ns() { return (this.contexts.find((c) => c.name === this.currentContext) || {}).namespace || 'default'; }

  // ── 저장소 ──
  get(kind, ns, name) {
    const r = this.resOf(kind);
    return this.objs.get(key(kind, r && r.ns ? ns || 'default' : '', name)) || null;
  }
  list(kind, ns) {
    const r = this.resOf(kind);
    const out = [];
    for (const o of this.objs.values()) {
      if (o.kind !== kind) continue;
      if (r && r.ns && ns && o.metadata.namespace !== ns) continue;
      out.push(o);
    }
    return out.sort((a, b) => (a.metadata.namespace || '').localeCompare(b.metadata.namespace || '') || a.metadata.name.localeCompare(b.metadata.name));
  }
  put(o) {
    const r = this.resOf(o.kind);
    if (r && r.ns) o.metadata.namespace = o.metadata.namespace || 'default';
    else if (o.metadata) delete o.metadata.namespace;
    this.objs.set(key(o.kind, o.metadata.namespace, o.metadata.name), o);
    return o;
  }
  remove(o) { this.objs.delete(key(o.kind, o.metadata.namespace, o.metadata.name)); }
  event(obj, type, reason, message) {
    this.events.push({ t: this.t, ns: obj.metadata.namespace || 'default', kind: obj.kind, name: obj.metadata.name, type, reason, message });
    if (this.events.length > 400) this.events.splice(0, 100);
  }
  eventsFor(obj) {
    return this.events.filter((e) => e.kind === obj.kind && e.name === obj.metadata.name && (e.ns === (obj.metadata.namespace || 'default')));
  }

  /** 새 객체의 공통 메타데이터를 채운다 */
  stamp(o, offset = 0) {
    o.metadata = o.metadata || {};
    o.metadata.uid = o.metadata.uid || this.uid();
    o.metadata.creationTimestamp = o.metadata.creationTimestamp || this.ts(offset);
    o.metadata.resourceVersion = String(Math.floor(this.rand() * 90000) + 10000);
    const r = this.resOf(o.kind);
    if (r) o.apiVersion = o.apiVersion || r.api;
    return o;
  }

  // ── 기본 클러스터 ──
  bootstrap() {
    const add = (o, off = -86400 * 12) => this.put(this.stamp(o, off));
    const node = (name, role, ip) => add({
      apiVersion: 'v1', kind: 'Node',
      metadata: { name, labels: { 'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/os': 'linux', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': name, 'kubernetes.io/os': 'linux', ...(role === 'controlplane' ? { 'node-role.kubernetes.io/control-plane': '', 'node.kubernetes.io/exclude-from-external-load-balancers': '' } : {}) }, annotations: { 'kubeadm.alpha.kubernetes.io/cri-socket': 'unix:///var/run/containerd/containerd.sock' } },
      spec: { podCIDR: role === 'controlplane' ? '10.244.0.0/24' : name === 'node01' ? '10.244.1.0/24' : '10.244.2.0/24', ...(role === 'controlplane' ? { taints: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }] } : {}) },
      status: { capacity: { cpu: '2', memory: '4015Mi', pods: '110' }, allocatable: { cpu: '2', memory: '3913Mi', pods: '110' }, addresses: [{ type: 'InternalIP', address: ip }, { type: 'Hostname', address: name }], nodeInfo: { kubeletVersion: K8S_VERSION, containerRuntimeVersion: 'containerd://2.1.4', osImage: 'Ubuntu 24.04.3 LTS', kernelVersion: '6.8.0-79-generic', architecture: 'amd64', operatingSystem: 'linux' } },
    });
    node('controlplane', 'controlplane', '172.30.1.2');
    node('node01', 'worker', '172.30.2.2');
    node('node02', 'worker', '172.30.2.3');
    for (const n of ['default', 'kube-system', 'kube-public', 'kube-node-lease', 'ingress-nginx', 'local-path-storage']) {
      add({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: n, labels: { 'kubernetes.io/metadata.name': n } }, spec: { finalizers: ['kubernetes'] }, status: { phase: 'Active' } });
    }
    add({ apiVersion: 'v1', kind: 'Service', metadata: { name: 'kubernetes', namespace: 'default', labels: { component: 'apiserver', provider: 'kubernetes' } }, spec: { type: 'ClusterIP', clusterIP: '10.96.0.1', ports: [{ name: 'https', port: 443, protocol: 'TCP', targetPort: 6443 }] } });
    add({ apiVersion: 'v1', kind: 'Service', metadata: { name: 'kube-dns', namespace: 'kube-system', labels: { 'k8s-app': 'kube-dns' } }, spec: { type: 'ClusterIP', clusterIP: '10.96.0.10', selector: { 'k8s-app': 'kube-dns' }, ports: [{ name: 'dns', port: 53, protocol: 'UDP', targetPort: 53 }, { name: 'dns-tcp', port: 53, protocol: 'TCP', targetPort: 53 }, { name: 'metrics', port: 9153, protocol: 'TCP', targetPort: 9153 }] } });
    add({ apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'coredns', namespace: 'kube-system' }, data: { Corefile: '.:53 {\n    errors\n    health {\n       lameduck 5s\n    }\n    ready\n    kubernetes cluster.local in-addr.arpa ip6.arpa {\n       pods insecure\n       fallthrough in-addr.arpa ip6.arpa\n       ttl 30\n    }\n    prometheus :9153\n    forward . /etc/resolv.conf {\n       max_concurrent 1000\n    }\n    cache 30\n    loop\n    reload\n    loadbalance\n}\n' } });
    const deploy = (name, ns, image, labels, replicas = 1, extraSpec = {}, extraCtr = {}) => add({
      apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name, namespace: ns, labels, annotations: { 'deployment.kubernetes.io/revision': '1' } },
      spec: { replicas, selector: { matchLabels: labels }, strategy: { type: 'RollingUpdate', rollingUpdate: { maxSurge: '25%', maxUnavailable: '25%' } }, template: { metadata: { labels }, spec: { containers: [{ name: name.replace(/-.*/, '') === 'calico' ? name : name, image, ...extraCtr }], ...extraSpec } } },
    });
    const cpTol = [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }, { key: 'CriticalAddonsOnly', operator: 'Exists' }];
    deploy('coredns', 'kube-system', 'registry.k8s.io/coredns/coredns:v1.12.1', { 'k8s-app': 'kube-dns' }, 2, { tolerations: cpTol, priorityClassName: 'system-cluster-critical' }, { resources: { requests: { cpu: '100m', memory: '70Mi' }, limits: { memory: '170Mi' } }, ports: [{ containerPort: 53, name: 'dns', protocol: 'UDP' }, { containerPort: 53, name: 'dns-tcp', protocol: 'TCP' }] });
    deploy('metrics-server', 'kube-system', 'registry.k8s.io/metrics-server/metrics-server:v0.8.0', { 'k8s-app': 'metrics-server' }, 1, {}, { args: ['--cert-dir=/tmp', '--secure-port=10250', '--kubelet-preferred-address-types=InternalIP', '--kubelet-insecure-tls'] });
    deploy('calico-kube-controllers', 'kube-system', 'docker.io/calico/kube-controllers:v3.30.3', { 'k8s-app': 'calico-kube-controllers' }, 1, { tolerations: cpTol });
    deploy('ingress-nginx-controller', 'ingress-nginx', 'registry.k8s.io/ingress-nginx/controller:v1.12.1', { 'app.kubernetes.io/name': 'ingress-nginx', 'app.kubernetes.io/component': 'controller' }, 1, {}, { ports: [{ containerPort: 80, name: 'http' }, { containerPort: 443, name: 'https' }] });
    deploy('local-path-provisioner', 'local-path-storage', 'rancher/local-path-provisioner:v0.0.31', { app: 'local-path-provisioner' });
    add({ apiVersion: 'v1', kind: 'Service', metadata: { name: 'ingress-nginx-controller', namespace: 'ingress-nginx' }, spec: { type: 'NodePort', clusterIP: '10.106.51.12', selector: { 'app.kubernetes.io/name': 'ingress-nginx', 'app.kubernetes.io/component': 'controller' }, ports: [{ name: 'http', port: 80, targetPort: 'http', nodePort: 30080, protocol: 'TCP' }, { name: 'https', port: 443, targetPort: 'https', nodePort: 30443, protocol: 'TCP' }] } });
    const ds = (name, image, labels) => add({
      apiVersion: 'apps/v1', kind: 'DaemonSet', metadata: { name, namespace: 'kube-system', labels },
      spec: { selector: { matchLabels: labels }, template: { metadata: { labels }, spec: { containers: [{ name: name.replace('calico-node', 'calico-node'), image }], hostNetwork: true, tolerations: [{ operator: 'Exists' }] } } },
    });
    ds('kube-proxy', `registry.k8s.io/kube-proxy:${K8S_VERSION}`, { 'k8s-app': 'kube-proxy' });
    ds('calico-node', 'docker.io/calico/node:v3.30.3', { 'k8s-app': 'calico-node' });
    add({ apiVersion: 'storage.k8s.io/v1', kind: 'StorageClass', metadata: { name: 'local-path', annotations: { 'storageclass.kubernetes.io/is-default-class': 'true' } }, provisioner: 'rancher.io/local-path', reclaimPolicy: 'Delete', volumeBindingMode: 'WaitForFirstConsumer' });
    add({ apiVersion: 'networking.k8s.io/v1', kind: 'IngressClass', metadata: { name: 'nginx' }, spec: { controller: 'k8s.io/ingress-nginx' } });
    add({ apiVersion: 'scheduling.k8s.io/v1', kind: 'PriorityClass', metadata: { name: 'system-cluster-critical' }, value: 2000000000, description: 'Used for system critical pods that must run in the cluster, but can be moved to another node if necessary.', preemptionPolicy: 'PreemptLowerPriority' });
    add({ apiVersion: 'scheduling.k8s.io/v1', kind: 'PriorityClass', metadata: { name: 'system-node-critical' }, value: 2000001000, description: 'Used for system critical pods that must not be moved from their current node.', preemptionPolicy: 'PreemptLowerPriority' });
    // 기본 ClusterRole(kubectl auth can-i --as 판정에 쓰인다)
    const all = [{ apiGroups: ['*'], resources: ['*'], verbs: ['*'] }, { nonResourceURLs: ['*'], verbs: ['*'] }];
    const rw = ['create', 'delete', 'deletecollection', 'get', 'list', 'patch', 'update', 'watch'];
    const ro = ['get', 'list', 'watch'];
    const core = ['pods', 'pods/log', 'pods/exec', 'services', 'endpoints', 'configmaps', 'secrets', 'persistentvolumeclaims', 'serviceaccounts', 'replicationcontrollers'];
    const apps = ['deployments', 'replicasets', 'statefulsets', 'daemonsets', 'deployments/scale'];
    add({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', metadata: { name: 'cluster-admin', labels: { 'kubernetes.io/bootstrapping': 'rbac-defaults' } }, rules: all });
    add({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', metadata: { name: 'admin' }, rules: [{ apiGroups: [''], resources: core, verbs: rw }, { apiGroups: ['apps'], resources: apps, verbs: rw }, { apiGroups: ['batch'], resources: ['jobs', 'cronjobs'], verbs: rw }, { apiGroups: ['rbac.authorization.k8s.io'], resources: ['roles', 'rolebindings'], verbs: rw }] });
    add({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', metadata: { name: 'edit' }, rules: [{ apiGroups: [''], resources: core, verbs: rw }, { apiGroups: ['apps'], resources: apps, verbs: rw }, { apiGroups: ['batch'], resources: ['jobs', 'cronjobs'], verbs: rw }] });
    add({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole', metadata: { name: 'view' }, rules: [{ apiGroups: [''], resources: core.filter((r) => r !== 'secrets' && r !== 'pods/exec'), verbs: ro }, { apiGroups: ['apps'], resources: apps, verbs: ro }, { apiGroups: ['batch'], resources: ['jobs', 'cronjobs'], verbs: ro }] });
    add({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRoleBinding', metadata: { name: 'cluster-admin' }, roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'ClusterRole', name: 'cluster-admin' }, subjects: [{ apiGroup: 'rbac.authorization.k8s.io', kind: 'Group', name: 'system:masters' }] });
    add({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRoleBinding', metadata: { name: 'kubeadm:cluster-admins' }, roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'ClusterRole', name: 'cluster-admin' }, subjects: [{ apiGroup: 'rbac.authorization.k8s.io', kind: 'Group', name: 'kubeadm:cluster-admins' }] });
    // Gateway API CRD(기본 설치 — 2025년 개정 교과과정에 포함)
    for (const [kind, plural] of [['GatewayClass', 'gatewayclasses'], ['Gateway', 'gateways'], ['HTTPRoute', 'httproutes']]) {
      add({ apiVersion: 'apiextensions.k8s.io/v1', kind: 'CustomResourceDefinition', metadata: { name: `${plural}.gateway.networking.k8s.io` }, spec: { group: 'gateway.networking.k8s.io', names: { kind, plural }, scope: kind === 'GatewayClass' ? 'Cluster' : 'Namespaced', versions: [{ name: 'v1', served: true, storage: true }] } });
    }
    add({ apiVersion: 'gateway.networking.k8s.io/v1', kind: 'GatewayClass', metadata: { name: 'nginx' }, spec: { controllerName: 'gateway.nginx.org/nginx-gateway-controller' } });
  }

  /** 모든 네임스페이스에 default SA · kube-root-ca.crt 를 채운다(네임스페이스 컨트롤러 흉내) */
  nsDefaults() {
    for (const n of this.list('Namespace')) {
      const ns = n.metadata.name;
      if (!this.get('ServiceAccount', ns, 'default')) {
        this.put(this.stamp({ apiVersion: 'v1', kind: 'ServiceAccount', metadata: { name: 'default', namespace: ns, creationTimestamp: n.metadata.creationTimestamp } }));
      }
      if (!this.get('ConfigMap', ns, 'kube-root-ca.crt')) {
        this.put(this.stamp({ apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'kube-root-ca.crt', namespace: ns, creationTimestamp: n.metadata.creationTimestamp }, data: { 'ca.crt': '-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----\n' } }));
      }
    }
    // 네임스페이스가 사라지면 그 안의 객체도 지운다
    const live = new Set(this.list('Namespace').map((n) => n.metadata.name));
    for (const o of [...this.objs.values()]) {
      if (o.metadata.namespace && !live.has(o.metadata.namespace)) this.remove(o);
    }
  }

  // ── 컨트롤 플레인 상태 ──
  /** 노드의 static pod 매니페스트(kubelet 의 staticPodPath). host 를 안 주면 controlplane */
  staticManifests(host = 'controlplane') {
    const files = this.hosts[host].files;
    const out = [];
    for (const [p, txt] of Object.entries(files)) {
      if (!p.startsWith('/etc/kubernetes/manifests/') || !/\.(ya?ml|json)$/.test(p) || p.slice(26).includes('/')) continue;
      let doc = null, err = null;
      try { doc = yaml.load(txt); } catch (e) { err = e.message.split('\n')[0]; }
      out.push({ path: p, doc, err });
    }
    return out;
  }
  /** 컨트롤 플레인 구성요소 하나의 건강 상태 — { ok, reason, log } */
  componentHealth(name) {
    const m = this.staticManifests().find((x) => x.doc && x.doc.metadata && x.doc.metadata.name === name)
      || this.staticManifests().find((x) => x.path.endsWith(`/${name}.yaml`));
    if (!m) return { ok: false, missing: true, reason: 'NotFound', log: [] };
    if (!m.doc) return { ok: false, missing: true, reason: 'InvalidManifest', log: [`E0901 kubelet: Could not process manifest file "${m.path}": ${m.err}`] };
    const c = ((m.doc.spec || {}).containers || [])[0];
    if (!c) return { ok: false, reason: 'InvalidManifest', log: [] };
    if (!imageExists(c.image)) return { ok: false, reason: 'ImagePullBackOff', image: c.image, log: [] };
    const cmd = [].concat(c.command || [], c.args || []);
    if (cmd[0] !== name) return { ok: false, reason: 'CrashLoopBackOff', log: [`exec: "${cmd[0]}": executable file not found in $PATH`], runErr: `exec: "${cmd[0]}": executable file not found in $PATH` };
    const files = this.hosts.controlplane.files;
    const flags = {};
    for (const a of cmd.slice(1)) { const mm = String(a).match(/^--([\w-]+)(?:=(.*))?$/); if (mm) flags[mm[1]] = mm[2] === undefined ? 'true' : mm[2]; else return { ok: false, reason: 'CrashLoopBackOff', log: [`Error: unknown command "${a}" for "${name}"`] }; }
    const KNOWN = {
      'kube-scheduler': ['authentication-kubeconfig', 'authorization-kubeconfig', 'bind-address', 'kubeconfig', 'leader-elect', 'config', 'v'],
      'kube-controller-manager': null, 'kube-apiserver': null, etcd: null,
    };
    if (KNOWN[name]) {
      for (const f of Object.keys(flags)) if (!KNOWN[name].includes(f)) return { ok: false, reason: 'CrashLoopBackOff', log: [`E0901 run.go:72] "command failed" err="unknown flag: --${f}"`] };
    }
    for (const [f, v] of Object.entries(flags)) {
      if (/(kubeconfig|-file|cafile|certfile|keyfile)$/.test(f) && v.startsWith('/') && !files[v]) {
        return { ok: false, reason: 'CrashLoopBackOff', log: [`E0901 run.go:72] "command failed" err="stat ${v}: no such file or directory"`] };
      }
    }
    if (name === 'kube-apiserver') {
      if (flags['etcd-servers'] && !/^https:\/\/127\.0\.0\.1:2379$|^https:\/\/172\.30\.1\.2:2379$/.test(flags['etcd-servers'])) {
        return { ok: false, reason: 'CrashLoopBackOff', log: [`W0901 logging.go:55] [core] grpc: addrConn.createTransport failed to connect to {Addr: "${flags['etcd-servers'].replace('https://', '')}"}: connection refused`, 'F0901 instance.go:226] Error creating leases: error creating storage factory: context deadline exceeded'] };
      }
      if (!this.componentHealth('etcd').ok) return { ok: false, reason: 'CrashLoopBackOff', log: ['F0901 instance.go:226] Error creating leases: error creating storage factory: context deadline exceeded'] };
    }
    if (name === 'etcd') {
      const dataVol = ((m.doc.spec.volumes || []).find((v) => v.name === 'etcd-data') || {}).hostPath;
      const dir = dataVol && dataVol.path;
      if (!dir || !this.etcd.dataDirs[dir]) return { ok: false, reason: 'CrashLoopBackOff', log: [`{"level":"fatal","msg":"failed to open data dir","data-dir":"${dir}"}`] };
    }
    return { ok: true, flags, container: c, doc: m.doc };
  }
  apiUp() { return this.componentHealth('kube-apiserver').ok; }
  schedulerUp() { return this.componentHealth('kube-scheduler').ok; }
  controllersUp() { return this.componentHealth('kube-controller-manager').ok; }

  /** etcd 매니페스트가 가리키는 데이터 디렉터리가 바뀌면 그 데이터로 갈아탄다(스냅샷 복구) */
  syncEtcd() {
    const h = this.componentHealth('etcd');
    if (!h.ok) return;
    const dir = ((h.doc.spec.volumes || []).find((v) => v.name === 'etcd-data') || {}).hostPath.path;
    if (dir === this.etcd.active) return;
    // 떠나는 디렉터리는 현재 상태를 기억해 둔다(되돌아와도 이어지게)
    this.etcd.dataDirs[this.etcd.active] = { objs: [...this.objs.values()].map(clone), extra: clone(this.extraRes) };
    const d = this.etcd.dataDirs[dir];
    if (d && d !== 'live') {
      this.objs = new Map();
      for (const o of d.objs) this.put(clone(o));
      this.extraRes = clone(d.extra || []);
    }
    this.etcd.dataDirs[dir] = 'live';
    this.etcd.active = dir;
  }
  snapshotData() { return { objs: [...this.objs.values()].filter((o) => !(o.metadata.annotations || {})['kubernetes.io/config.mirror']).map(clone), extra: clone(this.extraRes) }; }

  kubeletState(nodeName) {
    const h = this.hosts[nodeName];
    if (!h) return { ok: true };
    const svc = h.services.kubelet;
    if (!svc.active) return { ok: false, reason: 'inactive' };
    // ⚠️systemd 는 daemon-reload 해야 바뀐 유닛 파일을 읽는다 — 파일을 고치고 restart 만 하면 옛 설정 그대로다
    const d = h.reloadedDropin ?? h.files[DROPIN_PATH] ?? '';
    const exec = (d.match(/^ExecStart=(\S+)/gm) || []).map((l) => l.slice(10)).filter(Boolean).pop();
    if (exec !== '/usr/bin/kubelet') return { ok: false, reason: 'exec', path: exec };
    let cfg;
    try { cfg = yaml.load(h.files['/var/lib/kubelet/config.yaml'] || ''); } catch (e) { return { ok: false, reason: 'config', err: e.message.split('\n')[0] }; }
    const ca = cfg && cfg.authentication && cfg.authentication.x509 && cfg.authentication.x509.clientCAFile;
    if (ca && !h.files[ca]) return { ok: false, reason: 'ca', path: ca };
    return { ok: true };
  }

  // ── 파드 평가(이미지·명령·설정 참조·프로브·자원) ──
  /** 컨테이너 하나가 실제로 어떻게 될지 — 스케줄 이후의 상태 */
  evalContainer(c, podSpec, ns, podName = '') {
    const r = { state: 'running', reason: '', exitCode: 0, ready: true, restarts: 0, logs: [], listening: [] };
    const img = parseImage(c.image);
    if (!c.image || !imageExists(c.image)) {
      return { ...r, state: 'waiting', reason: 'ImagePullBackOff', ready: false, message: `Back-off pulling image "${c.image}"`, pullErr: true };
    }
    // env / envFrom 참조
    for (const e of c.env || []) {
      const vf = e.valueFrom || {};
      if (vf.configMapKeyRef && !vf.configMapKeyRef.optional) {
        const cm = this.get('ConfigMap', ns, vf.configMapKeyRef.name);
        if (!cm) return { ...r, state: 'waiting', reason: 'CreateContainerConfigError', ready: false, message: `configmap "${vf.configMapKeyRef.name}" not found` };
        if (!cm.data || !(vf.configMapKeyRef.key in cm.data)) return { ...r, state: 'waiting', reason: 'CreateContainerConfigError', ready: false, message: `couldn't find key ${vf.configMapKeyRef.key} in ConfigMap ${ns}/${vf.configMapKeyRef.name}` };
      }
      if (vf.secretKeyRef && !vf.secretKeyRef.optional) {
        const s = this.get('Secret', ns, vf.secretKeyRef.name);
        if (!s) return { ...r, state: 'waiting', reason: 'CreateContainerConfigError', ready: false, message: `secret "${vf.secretKeyRef.name}" not found` };
        const keys = Object.keys(s.data || {}).concat(Object.keys(s.stringData || {}));
        if (!keys.includes(vf.secretKeyRef.key)) return { ...r, state: 'waiting', reason: 'CreateContainerConfigError', ready: false, message: `couldn't find key ${vf.secretKeyRef.key} in Secret ${ns}/${vf.secretKeyRef.name}` };
      }
    }
    for (const ef of c.envFrom || []) {
      if (ef.configMapRef && !ef.configMapRef.optional && !this.get('ConfigMap', ns, ef.configMapRef.name)) return { ...r, state: 'waiting', reason: 'CreateContainerConfigError', ready: false, message: `configmap "${ef.configMapRef.name}" not found` };
      if (ef.secretRef && !ef.secretRef.optional && !this.get('Secret', ns, ef.secretRef.name)) return { ...r, state: 'waiting', reason: 'CreateContainerConfigError', ready: false, message: `secret "${ef.secretRef.name}" not found` };
    }
    const env = this.containerEnv(c, ns);
    // 이미지가 요구하는 환경변수
    if (img.info.needEnv && !img.info.needEnv.some((k) => env[k])) {
      return { ...r, state: 'waiting', reason: 'CrashLoopBackOff', ready: false, restarts: 4, exitCode: 1, logs: img.info.failLog || [], lastReason: 'Error' };
    }
    const cmd = [].concat(c.command || [], c.args || []).map(String).join(' ');
    // OOM(stress 류)
    const lim = parseMem(((c.resources || {}).limits || {}).memory);
    const vm = cmd.match(/--vm-bytes\s+(\d+[KMG]?)/i);
    if (vm && lim) {
      const need = parseMem(vm[1].replace(/([KMG])$/i, (x) => x.toUpperCase()));
      if (need > lim) return { ...r, state: 'waiting', reason: 'CrashLoopBackOff', lastReason: 'OOMKilled', exitCode: 137, ready: false, restarts: 5, logs: ['stress: info: [1] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd'] };
    }
    // 로그: echo 문
    const echoes = [...cmd.matchAll(/echo\s+(?:-e\s+)?(?:"([^"]*)"|'([^']*)'|([^;&|]+))/g)].map((m) => (m[1] ?? m[2] ?? m[3]).trim().replace(/\$\(date\)/g, 'Tue Sep  1 09:00:00 UTC 2026'));
    let logs = echoes.length ? echoes : (img.info.log || []).slice();
    const custom = Object.entries(this.logs).find(([k]) => k === `${ns}/${podName}` || (podName && podName.startsWith(k.split('/')[1]) && k.startsWith(ns + '/')));
    if (custom) logs = custom[1].slice();
    if (/while\s+true|while\s*:|for\s*\(\(/.test(cmd) && echoes.length) logs = [].concat(...Array(3).fill(echoes));
    r.logs = logs;
    // 명령 실행 결과
    // 명령이 오래 도는가 — 명시적 대기(sleep·tail -f·while)거나, 서버 이미지인데 짧은 명령으로 덮어쓰지 않았거나
    const LONG = /sleep\s+(infinity|\d{2,})|sleep\s+[1-9]\d*[hmd]|tail\s+-f|while\s+true|while\s*:|nginx|httpd-foreground|redis-server|--daemon|http\.server|nc\s+-l/;
    const first = cmd.replace(/^(\/bin\/)?(ba)?sh\s+-c\s+/, '').replace(/^["']/, '').split(/\s+/)[0];
    const SHORT = /^(echo|date|ls|cat|printenv|env|true|exit|hostname|whoami|nslookup|wget|curl|sleep|expr|uname|id)$/;
    const long = !cmd ? !!img.info.long : LONG.test(cmd) || (img.info.long && !SHORT.test(first));
    const fails = /exit\s+[1-9]|\bfalse\b|ls\s+\/nonexist|cat\s+\/nonexist/.test(cmd);
    if (cmd && fails) {
      r.state = 'waiting'; r.reason = 'CrashLoopBackOff'; r.lastReason = 'Error'; r.exitCode = 1; r.ready = false; r.restarts = 4;
    } else if (!long) {
      // 금방 끝나는 명령(echo, date …) 또는 명령 없는 busybox — 종료코드 0
      r.state = 'terminated'; r.reason = 'Completed'; r.exitCode = 0; r.ready = false;
    }
    // 듣는 포트
    if (r.state === 'running') {
      if (c.ports && c.ports.length) r.listening = c.ports.map((p) => ({ port: Number(p.containerPort), name: p.name }));
      if (img.info.port && !c.command) r.listening.push({ port: img.info.port });
      if (/http\.server\s+(\d+)/.test(cmd)) r.listening.push({ port: Number(cmd.match(/http\.server\s+(\d+)/)[1]) });
      if (/nc\s+-l[kp]*\s+(?:-p\s+)?(\d+)/.test(cmd)) r.listening.push({ port: Number(cmd.match(/nc\s+-l[kp]*\s+(?:-p\s+)?(\d+)/)[1]) });
      // 프로브
      const probeOk = (p) => {
        if (!p) return true;
        if (p.httpGet || p.tcpSocket) {
          const port = (p.httpGet || p.tcpSocket).port;
          const n = typeof port === 'number' || /^\d+$/.test(port) ? Number(port) : (r.listening.find((l) => l.name === port) || {}).port;
          const imgPort = img.info.port;
          return r.listening.some((l) => l.port === n) || (imgPort && n === imgPort && !c.command);
        }
        if (p.exec) {
          const s = [].concat(p.exec.command || []).join(' ');
          if (/\bfalse\b|nonexist|exit 1/.test(s)) return false;
          const f = s.match(/cat\s+(\S+)/);
          if (f && !cmd.includes(f[1])) return false;
          return true;
        }
        return true;
      };
      if (!probeOk(c.livenessProbe)) { r.restarts = 6; r.ready = false; r.state = 'waiting'; r.reason = 'CrashLoopBackOff'; r.lastReason = 'Error'; r.probeFail = 'Liveness'; r.exitCode = 137; }
      else if (!probeOk(c.readinessProbe)) { r.ready = false; r.probeFail = 'Readiness'; }
      else if (!probeOk(c.startupProbe)) { r.ready = false; r.restarts = 3; r.probeFail = 'Startup'; }
    }
    return r;
  }
  containerEnv(c, ns) {
    const env = {};
    for (const ef of c.envFrom || []) {
      if (ef.configMapRef) Object.assign(env, (this.get('ConfigMap', ns, ef.configMapRef.name) || {}).data || {});
      if (ef.secretRef) { const s = this.get('Secret', ns, ef.secretRef.name) || {}; for (const [k, v] of Object.entries(s.data || {})) env[(ef.prefix || '') + k] = b64d(v); }
    }
    for (const e of c.env || []) {
      if ('value' in e) env[e.name] = String(e.value);
      else if (e.valueFrom && e.valueFrom.configMapKeyRef) env[e.name] = ((this.get('ConfigMap', ns, e.valueFrom.configMapKeyRef.name) || {}).data || {})[e.valueFrom.configMapKeyRef.key];
      else if (e.valueFrom && e.valueFrom.secretKeyRef) env[e.name] = b64d(((this.get('Secret', ns, e.valueFrom.secretKeyRef.name) || {}).data || {})[e.valueFrom.secretKeyRef.key] || '');
      else if (e.valueFrom && e.valueFrom.fieldRef) env[e.name] = `(${e.valueFrom.fieldRef.fieldPath})`;
    }
    return env;
  }
  /** 파드 템플릿이 '살아서 준비될' 파드를 만드는가 — 롤아웃이 멈출지 판단용 */
  templateHealthy(tpl, ns) {
    const spec = (tpl || {}).spec || {};
    return (spec.containers || []).every((c) => { const e = this.evalContainer(c, spec, ns); return e.state === 'running' && e.ready; });
  }

  // ── 어드미션(생성 시 검사) ──
  /** 파드 생성 전 검사·보정. 실패하면 오류 문자열, 성공하면 null */
  admitPod(pod) {
    const ns = pod.metadata.namespace || 'default';
    if (!this.get('Namespace', '', ns)) return `namespaces "${ns}" not found`;
    const spec = pod.spec = pod.spec || {};
    if (!spec.containers || !spec.containers.length) return `Pod "${pod.metadata.name}" is invalid: spec.containers: Required value`;
    for (const c of spec.containers) if (!c.name) return `Pod "${pod.metadata.name}" is invalid: spec.containers[0].name: Required value`;
    spec.serviceAccountName = spec.serviceAccountName || spec.serviceAccount || 'default';
    if (!this.get('ServiceAccount', ns, spec.serviceAccountName) && !(pod.metadata.annotations || {})['kubernetes.io/config.mirror']) {
      return `pods "${pod.metadata.name}" is forbidden: error looking up service account ${ns}/${spec.serviceAccountName}: serviceaccount "${spec.serviceAccountName}" not found`;
    }
    if (spec.priorityClassName) {
      const pc = this.get('PriorityClass', '', spec.priorityClassName);
      if (!pc) return `pods "${pod.metadata.name}" is forbidden: no PriorityClass with name ${spec.priorityClassName} was found`;
      spec.priority = pc.value;
    }
    // LimitRange 기본값
    for (const lr of this.list('LimitRange', ns)) {
      for (const l of (lr.spec || {}).limits || []) {
        if (l.type !== 'Container') continue;
        for (const c of [].concat(spec.containers, spec.initContainers || [])) {
          c.resources = c.resources || {};
          if (l.default) { c.resources.limits = { ...l.default, ...(c.resources.limits || {}) }; }
          if (l.defaultRequest) { c.resources.requests = { ...l.defaultRequest, ...(c.resources.requests || {}) }; }
          else if (l.default) { c.resources.requests = { ...c.resources.limits, ...(c.resources.requests || {}) }; }
          if (l.max) {
            for (const [res, v] of Object.entries(l.max)) {
              const lim = (c.resources.limits || {})[res];
              const f = res === 'cpu' ? parseCpu : parseMem;
              if (lim && f(lim) > f(v)) return `pods "${pod.metadata.name}" is forbidden: maximum ${res} usage per Container is ${v}, but limit is ${lim}`;
            }
          }
        }
      }
    }
    // ResourceQuota
    for (const q of this.list('ResourceQuota', ns)) {
      const hard = (q.spec || {}).hard || {};
      const used = this.quotaUsed(ns);
      const add = podResources(spec);
      for (const [res, lim] of Object.entries(hard)) {
        const r2 = res.replace(/^requests\./, 'req.').replace(/^limits\./, 'lim.');
        const kind = r2 === 'cpu' ? 'req.cpu' : r2 === 'memory' ? 'req.memory' : r2;
        if (kind === 'pods') {
          if (used.pods + 1 > Number(lim)) return `pods "${pod.metadata.name}" is forbidden: exceeded quota: ${q.metadata.name}, requested: pods=1, used: pods=${used.pods}, limited: pods=${lim}`;
          continue;
        }
        if (!(kind in add)) continue;
        const f = kind.endsWith('cpu') ? parseCpu : parseMem;
        if (add[kind] === null) return `pods "${pod.metadata.name}" is forbidden: failed quota: ${q.metadata.name}: must specify ${res.replace(/^(cpu|memory)$/, 'requests.$1')}`;
        if (used[kind] + add[kind] > f(lim) + 1e-9) return `pods "${pod.metadata.name}" is forbidden: exceeded quota: ${q.metadata.name}, requested: ${res}=${add.raw[kind]}, limited: ${res}=${lim}`;
      }
    }
    return null;
  }
  quotaUsed(ns) {
    const u = { pods: 0, 'req.cpu': 0, 'req.memory': 0, 'lim.cpu': 0, 'lim.memory': 0 };
    for (const p of this.list('Pod', ns)) {
      if (['Succeeded', 'Failed'].includes((p.status || {}).phase)) continue;
      u.pods++;
      const r = podResources(p.spec);
      for (const k of ['req.cpu', 'req.memory', 'lim.cpu', 'lim.memory']) u[k] += r[k] || 0;
    }
    return u;
  }

  /** 컨트롤러가 파드를 만든다(어드미션 포함). 실패하면 이벤트를 남기고 null */
  createPodFrom(owner, tpl, name, extraMeta = {}) {
    const ns = owner.metadata.namespace;
    const pod = {
      apiVersion: 'v1', kind: 'Pod',
      metadata: { name, namespace: ns, labels: clone((tpl.metadata || {}).labels || {}), ...(tpl.metadata && tpl.metadata.annotations ? { annotations: clone(tpl.metadata.annotations) } : {}), ownerReferences: [{ apiVersion: owner.apiVersion, kind: owner.kind, name: owner.metadata.name, uid: owner.metadata.uid, controller: true, blockOwnerDeletion: true }], ...extraMeta },
      spec: clone(tpl.spec || {}),
    };
    if (extraMeta.labels) pod.metadata.labels = { ...pod.metadata.labels, ...extraMeta.labels };
    const err = this.admitPod(pod);
    if (err) {
      const recent = this.eventsFor(owner).slice(-1)[0];
      if (!recent || recent.message !== `Error creating: ${err}`) this.event(owner, 'Warning', 'FailedCreate', `Error creating: ${err}`);
      return null;
    }
    if (!pod.spec.restartPolicy) pod.spec.restartPolicy = 'Always';
    this.put(this.stamp(pod));
    this.event(owner, 'Normal', 'SuccessfulCreate', `Created pod: ${name}`);
    return pod;
  }

  ownedBy(kind, owner) {
    return this.list(kind, owner.metadata.namespace).filter((o) => (o.metadata.ownerReferences || []).some((r) => r.uid === owner.metadata.uid));
  }

  // ── 조정 루프 ──
  reconcile() {
    for (let i = 0; i < 3; i++) this.reconcileOnce();
  }
  reconcileOnce() {
    this.syncEtcd();
    this.nsDefaults();
    this.mirrorPods();
    this.syncNodes();
    if (this.controllersUp()) {
      for (const d of this.list('Deployment')) this.syncDeployment(d);
      for (const rs of this.list('ReplicaSet')) this.syncReplicaSet(rs);
      for (const ds of this.list('DaemonSet')) this.syncDaemonSet(ds);
      for (const s of this.list('StatefulSet')) this.syncStatefulSet(s);
      for (const j of this.list('Job')) this.syncJob(j);
      for (const h of this.list('HorizontalPodAutoscaler')) this.syncHPA(h);
      this.gcOrphans();
      this.bindPVCs();
    }
    this.schedule();
    for (const p of this.list('Pod')) this.syncPodStatus(p);
    if (this.controllersUp()) {
      for (const d of this.list('Deployment')) this.deploymentStatus(d);
      for (const rs of this.list('ReplicaSet')) this.rsStatus(rs);
      for (const ds of this.list('DaemonSet')) this.dsStatus(ds);
      for (const s of this.list('StatefulSet')) this.stsStatus(s);
      for (const j of this.list('Job')) this.jobStatus(j);
      this.syncEndpoints();
    }
    this.syncGateways();
  }

  mirrorPods() {
    const want = new Set();
    for (const host of Object.keys(this.hosts)) {
      // kubelet 이 죽은 노드는 static pod 을 새로 띄우지 못한다(이미 떠 있던 건 남는다)
      const alive = this.kubeletState(host).ok;
      for (const m of this.staticManifests(host)) {
        if (!m.doc || m.doc.kind !== 'Pod' || !m.doc.metadata || !m.doc.metadata.name) continue;
        const name = `${m.doc.metadata.name}-${host}`;
        const ns = m.doc.metadata.namespace || 'default';
        const k = key('Pod', ns, name);
        const existing = this.get('Pod', ns, name);
        if (!alive && !existing) continue;
        want.add(k);
        const txt = JSON.stringify(m.doc);
        if (existing && existing._src === txt) continue;
        const pod = clone(m.doc);
        pod.metadata.name = name; pod.metadata.namespace = ns;
        pod.metadata.annotations = { ...(pod.metadata.annotations || {}), 'kubernetes.io/config.mirror': hashName(txt, 16), 'kubernetes.io/config.source': 'file' };
        pod.metadata.ownerReferences = [{ apiVersion: 'v1', kind: 'Node', name: host, controller: true }];
        pod.spec.nodeName = host;
        pod.spec.restartPolicy = pod.spec.restartPolicy || 'Always';
        pod.metadata.creationTimestamp = existing || this._booted ? this.ts() : this.ts(-86400 * 12);
        this.put(this.stamp(pod));
        Object.defineProperty(pod, '_src', { value: txt, enumerable: false, writable: true });
      }
    }
    for (const p of this.list('Pod')) {
      if ((p.metadata.annotations || {})['kubernetes.io/config.mirror'] && !want.has(key('Pod', p.metadata.namespace, p.metadata.name))) this.remove(p);
    }
  }

  syncNodes() {
    for (const n of this.list('Node')) {
      const k = this.kubeletState(n.metadata.name);
      const h = this.hosts[n.metadata.name];
      if (h) n.status.nodeInfo.kubeletVersion = h.kubeletRunning;
      const ready = k.ok;
      n.status.conditions = [
        { type: 'MemoryPressure', status: ready ? 'False' : 'Unknown', reason: ready ? 'KubeletHasSufficientMemory' : 'NodeStatusUnknown' },
        { type: 'DiskPressure', status: ready ? 'False' : 'Unknown', reason: ready ? 'KubeletHasNoDiskPressure' : 'NodeStatusUnknown' },
        { type: 'PIDPressure', status: ready ? 'False' : 'Unknown', reason: ready ? 'KubeletHasSufficientPID' : 'NodeStatusUnknown' },
        { type: 'Ready', status: ready ? 'True' : 'Unknown', reason: ready ? 'KubeletReady' : 'NodeStatusUnknown', message: ready ? 'kubelet is posting ready status' : 'Kubelet stopped posting node status.' },
      ];
      // NotReady 노드에는 not-ready/unreachable taint 가 붙는다
      const taints = (n.spec.taints || []).filter((t) => t.key !== 'node.kubernetes.io/unreachable');
      if (!ready) taints.push({ key: 'node.kubernetes.io/unreachable', effect: 'NoSchedule', timeAdded: this.ts() });
      if (taints.length) n.spec.taints = taints; else delete n.spec.taints;
    }
  }

  syncDeployment(d) {
    const ns = d.metadata.namespace;
    const tpl = d.spec.template || {};
    const tplHash = hashName(JSON.stringify(tpl), 10);
    const rsName = `${d.metadata.name}-${tplHash}`;
    const all = this.ownedBy('ReplicaSet', d);
    let cur = all.find((r) => r.metadata.labels && r.metadata.labels['pod-template-hash'] === tplHash);
    const maxRev = Math.max(0, ...all.map((r) => Number((r.metadata.annotations || {})['deployment.kubernetes.io/revision'] || 0)));
    const replicas = d.spec.replicas ?? 1;
    if (!cur) {
      const labels = { ...((tpl.metadata || {}).labels || {}), 'pod-template-hash': tplHash };
      cur = this.put(this.stamp({
        apiVersion: 'apps/v1', kind: 'ReplicaSet',
        metadata: { name: rsName, namespace: ns, labels, annotations: { 'deployment.kubernetes.io/desired-replicas': String(replicas), 'deployment.kubernetes.io/max-replicas': String(replicas + 1), 'deployment.kubernetes.io/revision': String(maxRev + 1), ...((d.metadata.annotations || {})['kubernetes.io/change-cause'] ? { 'kubernetes.io/change-cause': d.metadata.annotations['kubernetes.io/change-cause'] } : {}) }, ownerReferences: [{ apiVersion: 'apps/v1', kind: 'Deployment', name: d.metadata.name, uid: d.metadata.uid, controller: true, blockOwnerDeletion: true }] },
        spec: { replicas: 0, selector: { matchLabels: { ...((d.spec.selector || {}).matchLabels || {}), 'pod-template-hash': tplHash } }, template: { metadata: { ...clone(tpl.metadata || {}), labels }, spec: clone(tpl.spec || {}) } },
      }));
      this.event(d, 'Normal', 'ScalingReplicaSet', `Scaled up replica set ${rsName} from 0 to ${replicas}`);
    } else if (Number((cur.metadata.annotations || {})['deployment.kubernetes.io/revision']) !== maxRev && all.length > 1) {
      // 롤백 등으로 옛 RS 가 다시 현재가 되면 새 리비전 번호를 받는다
      const active = all.filter((r) => r !== cur && (r.spec.replicas || 0) > 0);
      if (active.length) {
        cur.metadata.annotations['deployment.kubernetes.io/revision'] = String(maxRev + 1);
        if ((d.metadata.annotations || {})['kubernetes.io/change-cause']) cur.metadata.annotations['kubernetes.io/change-cause'] = d.metadata.annotations['kubernetes.io/change-cause'];
      }
    }
    d.metadata.annotations = { ...(d.metadata.annotations || {}), 'deployment.kubernetes.io/revision': cur.metadata.annotations['deployment.kubernetes.io/revision'] };
    const olds = all.filter((r) => r !== cur);
    if (d.spec.paused) return;
    const healthy = this.templateHealthy(tpl, ns);
    const strat = d.spec.strategy || {};
    if (healthy || strat.type === 'Recreate' || !olds.some((r) => r.spec.replicas > 0)) {
      if (cur.spec.replicas !== replicas) cur.spec.replicas = replicas;
      for (const o of olds) if (o.spec.replicas !== 0) { o.spec.replicas = 0; this.event(d, 'Normal', 'ScalingReplicaSet', `Scaled down replica set ${o.metadata.name} from ${o.spec.replicas} to 0`); }
    } else {
      // 새 템플릿이 망가졌으면 롤링 업데이트가 중간에 멈춘다(maxSurge 만큼만 새 파드)
      const surge = pct(strat.rollingUpdate && strat.rollingUpdate.maxSurge, replicas, true, 0.25);
      const unav = pct(strat.rollingUpdate && strat.rollingUpdate.maxUnavailable, replicas, false, 0.25);
      cur.spec.replicas = Math.max(1, surge + unav);
      let keep = Math.max(0, replicas - unav);
      for (const o of olds.sort((a, b) => (b.spec.replicas || 0) - (a.spec.replicas || 0))) {
        const n = Math.min(o.spec.replicas || 0, keep);
        o.spec.replicas = n; keep -= n;
      }
    }
    for (const r of all) r.metadata.annotations['deployment.kubernetes.io/desired-replicas'] = String(replicas);
    // 이력 한도
    const limit = d.spec.revisionHistoryLimit ?? 10;
    const dead = olds.filter((r) => !r.spec.replicas).sort((a, b) => Number(a.metadata.annotations['deployment.kubernetes.io/revision']) - Number(b.metadata.annotations['deployment.kubernetes.io/revision']));
    while (dead.length > limit) this.remove(dead.shift());
  }

  syncReplicaSet(rs) {
    const pods = this.ownedBy('Pod', rs).filter((p) => !p.metadata.deletionTimestamp);
    const want = rs.spec.replicas ?? 1;
    if (pods.length < want) {
      for (let i = pods.length; i < want; i++) {
        if (!this.createPodFrom(rs, rs.spec.template, `${rs.metadata.name}-${this.randName(5)}`)) break;
      }
    } else if (pods.length > want) {
      // 준비 안 된 것부터 지운다
      const order = pods.sort((a, b) => Number(isReady(a)) - Number(isReady(b)) || b.metadata.creationTimestamp.localeCompare(a.metadata.creationTimestamp));
      for (const p of order.slice(0, pods.length - want)) { this.remove(p); this.event(rs, 'Normal', 'SuccessfulDelete', `Deleted pod: ${p.metadata.name}`); }
    }
  }

  syncDaemonSet(ds) {
    const pods = this.ownedBy('Pod', ds);
    for (const n of this.list('Node')) {
      const tpl = ds.spec.template || {};
      const fit = this.nodeFits(n, tpl.spec || {}, { daemon: true });
      const onNode = pods.filter((p) => p.spec.nodeName === n.metadata.name);
      if (fit.ok && !onNode.length) {
        const p = this.createPodFrom(ds, tpl, `${ds.metadata.name}-${this.randName(5)}`);
        if (p) p.spec.nodeName = n.metadata.name;
      } else if (!fit.ok && onNode.length && !fit.onlyUnschedulable) {
        for (const p of onNode) this.remove(p);
      }
    }
    // 템플릿이 바뀌면 파드를 갈아 끼운다(RollingUpdate)
    const h = hashName(JSON.stringify(ds.spec.template), 10);
    for (const p of this.ownedBy('Pod', ds)) {
      if (p.metadata.labels['controller-revision-hash'] && p.metadata.labels['controller-revision-hash'] !== h) this.remove(p);
      else p.metadata.labels['controller-revision-hash'] = h;
    }
  }

  syncStatefulSet(s) {
    const want = s.spec.replicas ?? 1;
    const ns = s.metadata.namespace;
    for (let i = 0; i < want; i++) {
      const name = `${s.metadata.name}-${i}`;
      for (const vct of s.spec.volumeClaimTemplates || []) {
        const pvcName = `${vct.metadata.name}-${name}`;
        if (!this.get('PersistentVolumeClaim', ns, pvcName)) {
          this.put(this.stamp({ apiVersion: 'v1', kind: 'PersistentVolumeClaim', metadata: { name: pvcName, namespace: ns, labels: clone((s.spec.selector || {}).matchLabels || {}) }, spec: clone(vct.spec) }));
        }
      }
      if (this.get('Pod', ns, name)) continue;
      const tpl = clone(s.spec.template);
      tpl.spec.volumes = (tpl.spec.volumes || []).concat((s.spec.volumeClaimTemplates || []).map((v) => ({ name: v.metadata.name, persistentVolumeClaim: { claimName: `${v.metadata.name}-${name}` } })));
      if (!this.createPodFrom(s, tpl, name, { labels: { 'statefulset.kubernetes.io/pod-name': name } })) break;
      // 앞 번호가 준비돼야 다음 번호를 만든다(OrderedReady) — 시뮬레이터에선 한 번에 하나씩
      if ((s.spec.podManagementPolicy || 'OrderedReady') === 'OrderedReady') break;
    }
    for (const p of this.ownedBy('Pod', s)) {
      const idx = Number(p.metadata.name.slice(s.metadata.name.length + 1));
      if (idx >= want) this.remove(p);
    }
  }

  syncJob(j) {
    const pods = this.ownedBy('Pod', j);
    const completions = j.spec.completions ?? 1;
    const done = pods.filter((p) => p.status && p.status.phase === 'Succeeded').length;
    const failed = pods.filter((p) => p.status && p.status.phase === 'Failed').length;
    const active = pods.filter((p) => !p.status || !['Succeeded', 'Failed'].includes(p.status.phase)).length;
    const limit = j.spec.backoffLimit ?? 6;
    if (j.spec.suspend) return;
    if (done >= completions || failed > limit) return;
    const par = j.spec.parallelism ?? 1;
    const need = Math.min(par - active, completions - done - active);
    for (let i = 0; i < need; i++) {
      const tpl = clone(j.spec.template);
      tpl.metadata = tpl.metadata || {};
      tpl.metadata.labels = { ...(tpl.metadata.labels || {}), 'batch.kubernetes.io/job-name': j.metadata.name, 'job-name': j.metadata.name, 'batch.kubernetes.io/controller-uid': j.metadata.uid };
      if (!this.createPodFrom(j, tpl, `${j.metadata.name}-${this.randName(5)}`)) break;
    }
  }

  syncHPA(h) {
    const ref = h.spec.scaleTargetRef || {};
    const t = this.get(ref.kind || 'Deployment', h.metadata.namespace, ref.name);
    if (!t) return;
    const min = h.spec.minReplicas ?? 1, max = h.spec.maxReplicas;
    const cur = t.spec.replicas ?? 1;
    const want = Math.min(max, Math.max(min, cur));
    if (want !== cur) t.spec.replicas = want;
    const target = ((h.spec.metrics || [])[0] || {}).resource;
    h.status = { currentReplicas: t.spec.replicas, desiredReplicas: t.spec.replicas, currentMetrics: target ? [{ type: 'Resource', resource: { name: target.name, current: { averageUtilization: 12, averageValue: target.name === 'memory' ? '18Mi' : '6m' } } }] : [] };
  }

  gcOrphans() {
    const uids = new Set([...this.objs.values()].map((o) => o.metadata.uid));
    for (const o of [...this.objs.values()]) {
      const refs = o.metadata.ownerReferences || [];
      if (refs.length && refs.every((r) => r.uid && !uids.has(r.uid))) this.remove(o);
    }
  }

  // ── 스토리지 ──
  bindPVCs() {
    const defSC = this.list('StorageClass').find((s) => (s.metadata.annotations || {})['storageclass.kubernetes.io/is-default-class'] === 'true');
    for (const pvc of this.list('PersistentVolumeClaim')) {
      pvc.status = pvc.status || {};
      if (pvc.spec.storageClassName === undefined && defSC && !pvc.spec.volumeName) pvc.spec.storageClassName = defSC.metadata.name;
      if (pvc.status.phase === 'Bound' && this.get('PersistentVolume', '', pvc.spec.volumeName)) continue;
      const scName = pvc.spec.storageClassName ?? '';
      const req = parseMem(((pvc.spec.resources || {}).requests || {}).storage);
      const modes = pvc.spec.accessModes || [];
      const fits = (pv) => (pv.spec.storageClassName || '') === scName
        && modes.every((m) => (pv.spec.accessModes || []).includes(m))
        && parseMem((pv.spec.capacity || {}).storage) >= req
        && (!pvc.spec.selector || matchSelector(pvc.spec.selector, pv.metadata.labels || {}))
        && (!pv.spec.volumeMode || !pvc.spec.volumeMode || pv.spec.volumeMode === pvc.spec.volumeMode);
      let pv = null;
      if (pvc.spec.volumeName) {
        pv = this.get('PersistentVolume', '', pvc.spec.volumeName);
        if (pv && (!fits(pv) || (pv.spec.claimRef && pv.spec.claimRef.name !== pvc.metadata.name))) pv = null;
      } else {
        const cands = this.list('PersistentVolume').filter((v) => (!v.status || v.status.phase === 'Available') && !v.spec.claimRef && fits(v))
          .sort((a, b) => parseMem(a.spec.capacity.storage) - parseMem(b.spec.capacity.storage));
        pv = cands[0] || null;
      }
      if (!pv && scName) {
        const sc = this.get('StorageClass', '', scName);
        if (sc && sc.provisioner !== 'kubernetes.io/no-provisioner') {
          const consumer = this.list('Pod', pvc.metadata.namespace).find((p) => (p.spec.volumes || []).some((v) => v.persistentVolumeClaim && v.persistentVolumeClaim.claimName === pvc.metadata.name) && p.spec.nodeName);
          if (sc.volumeBindingMode === 'WaitForFirstConsumer' && !consumer) {
            pvc.status = { phase: 'Pending' };
            this.pvcWait(pvc, 'WaitForFirstConsumer', 'waiting for first consumer to be created before binding');
            continue;
          }
          pv = this.put(this.stamp({ apiVersion: 'v1', kind: 'PersistentVolume', metadata: { name: `pvc-${pvc.metadata.uid}`, annotations: { 'pv.kubernetes.io/provisioned-by': sc.provisioner } }, spec: { capacity: { storage: ((pvc.spec.resources || {}).requests || {}).storage || '1Gi' }, accessModes: clone(modes), persistentVolumeReclaimPolicy: sc.reclaimPolicy || 'Delete', storageClassName: scName, ...(sc.provisioner === 'rancher.io/local-path' ? { hostPath: { path: `/opt/local-path-provisioner/pvc-${pvc.metadata.uid}_${pvc.metadata.namespace}_${pvc.metadata.name}`, type: 'DirectoryOrCreate' } } : {}) } }));
          this.event(pvc, 'Normal', 'ProvisioningSucceeded', `Successfully provisioned volume ${pv.metadata.name}`);
        }
      }
      if (!pv) {
        pvc.status = { phase: 'Pending' };
        this.pvcWait(pvc, 'FailedBinding', scName && !this.get('StorageClass', '', scName) ? `storageclass.storage.k8s.io "${scName}" not found` : 'no persistent volumes available for this claim and no storage class is set');
        continue;
      }
      pv.spec.claimRef = { apiVersion: 'v1', kind: 'PersistentVolumeClaim', name: pvc.metadata.name, namespace: pvc.metadata.namespace, uid: pvc.metadata.uid };
      pv.status = { phase: 'Bound' };
      pvc.spec.volumeName = pv.metadata.name;
      pvc.status = { phase: 'Bound', accessModes: clone(pv.spec.accessModes), capacity: { storage: pv.spec.capacity.storage } };
    }
    // PV 상태
    for (const pv of this.list('PersistentVolume')) {
      const c = pv.spec.claimRef;
      if (!c) { pv.status = { phase: 'Available' }; continue; }
      const pvc = this.get('PersistentVolumeClaim', c.namespace, c.name);
      if (pvc && (!c.uid || pvc.metadata.uid === c.uid)) { pv.status = { phase: 'Bound' }; continue; }
      const pol = pv.spec.persistentVolumeReclaimPolicy || 'Retain';
      if (pol === 'Delete') this.remove(pv);
      else pv.status = { phase: 'Released' };
    }
  }
  pvcWait(pvc, reason, msg) {
    const last = this.eventsFor(pvc).slice(-1)[0];
    if (!last || last.message !== msg) this.event(pvc, reason === 'WaitForFirstConsumer' ? 'Normal' : 'Warning', reason, msg);
  }

  // ── 스케줄러 ──
  nodeFits(n, spec, opt = {}) {
    const name = n.metadata.name;
    if (n.spec.unschedulable && !opt.daemon) return { ok: false, why: '1 node(s) were unschedulable', onlyUnschedulable: true };
    const ready = (n.status.conditions || []).find((c) => c.type === 'Ready');
    if (ready && ready.status !== 'True' && !opt.daemon) return { ok: false, why: "1 node(s) had untolerated taint {node.kubernetes.io/unreachable: }" };
    for (const t of n.spec.taints || []) {
      if (!['NoSchedule', 'NoExecute'].includes(t.effect)) continue;
      if (opt.daemon && t.key === 'node.kubernetes.io/unreachable') continue;
      const tol = (spec.tolerations || []).some((x) => tolerates(x, t));
      if (!tol) return { ok: false, why: `1 node(s) had untolerated taint {${t.key}: ${t.value || ''}}` };
    }
    for (const [k, v] of Object.entries(spec.nodeSelector || {})) {
      if ((n.metadata.labels || {})[k] !== String(v)) return { ok: false, why: "1 node(s) didn't match Pod's node affinity/selector" };
    }
    const req = (((spec.affinity || {}).nodeAffinity || {}).requiredDuringSchedulingIgnoredDuringExecution || {}).nodeSelectorTerms;
    if (req && req.length) {
      const any = req.some((term) => (term.matchExpressions || []).every((e) => matchSelector([e], n.metadata.labels || {}))
        && (term.matchFields || []).every((e) => matchSelector([e], { 'metadata.name': name })));
      if (!any) return { ok: false, why: "1 node(s) didn't match Pod's node affinity/selector" };
    }
    if (!opt.daemon && !opt.ignoreResources) {
      const want = podResources(spec);
      const used = this.nodeRequested(name);
      if ((want['req.cpu'] || 0) + used.cpu > parseCpu(n.status.allocatable.cpu) + 1e-9) return { ok: false, why: '1 Insufficient cpu' };
      if ((want['req.memory'] || 0) + used.mem > parseMem(n.status.allocatable.memory)) return { ok: false, why: '1 Insufficient memory' };
    }
    // 파드 anti-affinity (hostname 토폴로지만)
    const anti = (((spec.affinity || {}).podAntiAffinity || {}).requiredDuringSchedulingIgnoredDuringExecution) || [];
    for (const term of anti) {
      if (term.topologyKey !== 'kubernetes.io/hostname') continue;
      const clash = this.list('Pod').some((p) => p.spec.nodeName === name && p !== opt.self && matchSelector(term.labelSelector || {}, p.metadata.labels || {}) && (!term.namespaces || term.namespaces.includes(p.metadata.namespace)));
      if (clash) return { ok: false, why: "1 node(s) didn't match pod anti-affinity rules" };
    }
    const aff = (((spec.affinity || {}).podAffinity || {}).requiredDuringSchedulingIgnoredDuringExecution) || [];
    for (const term of aff) {
      if (term.topologyKey !== 'kubernetes.io/hostname') continue;
      const near = this.list('Pod').some((p) => p.spec.nodeName === name && p !== opt.self && matchSelector(term.labelSelector || {}, p.metadata.labels || {}));
      if (!near) return { ok: false, why: "1 node(s) didn't match pod affinity rules" };
    }
    return { ok: true };
  }
  nodeRequested(nodeName) {
    let cpu = 0, mem = 0;
    for (const p of this.list('Pod')) {
      if (p.spec.nodeName !== nodeName || ['Succeeded', 'Failed'].includes((p.status || {}).phase)) continue;
      const r = podResources(p.spec);
      cpu += r['req.cpu'] || 0; mem += r['req.memory'] || 0;
    }
    return { cpu, mem };
  }
  schedule() {
    const nodes = this.list('Node');
    for (const p of this.list('Pod')) {
      if (p.spec.nodeName) continue;
      if (p.spec.schedulerName && p.spec.schedulerName !== 'default-scheduler') continue;
      if (!this.schedulerUp()) continue;
      // PVC 가 묶이지 않았으면 스케줄 불가(WaitForFirstConsumer 는 예외)
      let pvcBlock = null;
      for (const v of p.spec.volumes || []) {
        if (!v.persistentVolumeClaim) continue;
        const pvc = this.get('PersistentVolumeClaim', p.metadata.namespace, v.persistentVolumeClaim.claimName);
        if (!pvc) { pvcBlock = `persistentvolumeclaim "${v.persistentVolumeClaim.claimName}" not found`; break; }
        const sc = this.get('StorageClass', '', pvc.spec.storageClassName || '');
        if (pvc.status && pvc.status.phase === 'Bound') continue;
        if (sc && sc.volumeBindingMode === 'WaitForFirstConsumer') continue;
        pvcBlock = 'pod has unbound immediate PersistentVolumeClaims. preemption: 0/3 nodes are available: 3 Preemption is not helpful for scheduling.';
      }
      if (pvcBlock) { this.failSched(p, `0/3 nodes are available: ${pvcBlock}`); continue; }
      const reasons = {};
      const fit = [];
      for (const n of nodes) {
        const f = this.nodeFits(n, p.spec, { self: p });
        if (f.ok) fit.push(n); else reasons[f.why] = (reasons[f.why] || 0) + 1;
      }
      if (!fit.length) {
        const why = Object.entries(reasons).map(([w, c]) => w.replace(/^1 /, `${c} `)).join(', ');
        this.failSched(p, `0/${nodes.length} nodes are available: ${why}. preemption: 0/${nodes.length} nodes are available: ${nodes.length} Preemption is not helpful for scheduling.`);
        continue;
      }
      // 가장 한가한 노드(요청 cpu 기준), 동률이면 이름순 — preferred affinity 가 있으면 가중치 우선
      const pref = (((p.spec.affinity || {}).nodeAffinity || {}).preferredDuringSchedulingIgnoredDuringExecution) || [];
      const score = (n) => pref.reduce((s, t) => s + ((t.preference.matchExpressions || []).every((e) => matchSelector([e], n.metadata.labels || {})) ? t.weight : 0), 0);
      const podsOn = (n) => this.list('Pod').filter((x) => x.spec.nodeName === n.metadata.name).length;
      fit.sort((a, b) => score(b) - score(a) || this.nodeRequested(a.metadata.name).cpu - this.nodeRequested(b.metadata.name).cpu || podsOn(a) - podsOn(b) || a.metadata.name.localeCompare(b.metadata.name));
      p.spec.nodeName = fit[0].metadata.name;
      this.event(p, 'Normal', 'Scheduled', `Successfully assigned ${p.metadata.namespace}/${p.metadata.name} to ${p.spec.nodeName}`);
    }
  }
  failSched(p, msg) {
    Object.defineProperty(p, '_schedMsg', { value: msg, enumerable: false, writable: true, configurable: true });
    const last = this.eventsFor(p).slice(-1)[0];
    if (!last || last.message !== msg) this.event(p, 'Warning', 'FailedScheduling', msg);
  }

  syncPodStatus(p) {
    const ns = p.metadata.namespace;
    const created = p.metadata.creationTimestamp;
    const st = { phase: 'Pending', conditions: [], qosClass: qosOf(p.spec) };
    if (!p.spec.nodeName) {
      st.conditions.push({ type: 'PodScheduled', status: 'False', reason: 'Unschedulable', message: p._schedMsg || '' });
      if (!this.schedulerUp()) st.conditions = [];
      p.status = st;
      return;
    }
    const node = this.get('Node', '', p.spec.nodeName);
    const host = this.hosts[p.spec.nodeName];
    st.hostIP = host ? host.ip : '172.30.9.9';
    st.startTime = created;
    if (!p._ip) Object.defineProperty(p, '_ip', { value: p.spec.hostNetwork ? st.hostIP : `10.244.${node && node.spec.podCIDR ? node.spec.podCIDR.split('.')[2] : 9}.${(this.ipSeq++ % 250) + 2}`, enumerable: false, writable: true });
    st.podIP = p._ip; st.podIPs = [{ ip: p._ip }];
    st.conditions.push({ type: 'PodScheduled', status: 'True' });
    const nodeOk = !node || ((node.status.conditions || []).find((c) => c.type === 'Ready') || {}).status === 'True';
    // 볼륨 준비
    let volWait = null;
    for (const v of p.spec.volumes || []) {
      if (v.configMap && !v.configMap.optional && !this.get('ConfigMap', ns, v.configMap.name)) volWait = `MountVolume.SetUp failed for volume "${v.name}" : configmap "${v.configMap.name}" not found`;
      if (v.secret && !v.secret.optional && !this.get('Secret', ns, v.secret.secretName)) volWait = `MountVolume.SetUp failed for volume "${v.name}" : secret "${v.secret.secretName}" not found`;
      if (v.persistentVolumeClaim) {
        const pvc = this.get('PersistentVolumeClaim', ns, v.persistentVolumeClaim.claimName);
        if (!pvc || !pvc.status || pvc.status.phase !== 'Bound') volWait = `Unable to attach or mount volumes: unmounted volumes=[${v.name}]`;
      }
    }
    // init 컨테이너
    const initSt = [];
    let initBlocked = null;
    for (const c of p.spec.initContainers || []) {
      if (c.restartPolicy === 'Always') { // 네이티브 사이드카
        const e = this.evalContainer(c, p.spec, ns, p.metadata.name);
        initSt.push(ctrStatus(c, e, created));
        continue;
      }
      const e = this.evalContainer(c, p.spec, ns, p.metadata.name);
      if (e.state === 'terminated' && e.exitCode === 0) { initSt.push({ name: c.name, image: c.image, ready: true, restartCount: 0, started: false, state: { terminated: { exitCode: 0, reason: 'Completed' } } }); continue; }
      if (e.state === 'running') { initBlocked = { reason: 'Init:0/' + (p.spec.initContainers.length), c }; initSt.push({ name: c.name, image: c.image, ready: false, restartCount: 0, state: { running: { startedAt: created } } }); break; }
      initBlocked = { reason: e.reason === 'ImagePullBackOff' ? 'Init:ImagePullBackOff' : e.reason === 'CreateContainerConfigError' ? 'Init:CreateContainerConfigError' : 'Init:CrashLoopBackOff', c };
      initSt.push(ctrStatus(c, e, created));
      break;
    }
    if (initSt.length) st.initContainerStatuses = initSt;
    const cs = [];
    const evals = [];
    for (const c of p.spec.containers) {
      if (volWait || initBlocked || !nodeOk) {
        cs.push({ name: c.name, image: c.image, ready: false, restartCount: 0, started: false, state: { waiting: { reason: volWait ? 'ContainerCreating' : 'PodInitializing' } } });
        continue;
      }
      let e = this.evalContainer(c, p.spec, ns, p.metadata.name);
      if ((p.metadata.annotations || {})['kubernetes.io/config.mirror'] && p.spec.nodeName === 'controlplane' && CP_COMPONENTS.includes(p.metadata.name.replace(/-controlplane$/, ''))) {
        // static pod 은 매니페스트 판정(componentHealth)을 그대로 따른다
        const hh = this.componentHealth(p.metadata.name.replace(/-controlplane$/, ''));
        e = hh.ok ? { state: 'running', ready: true, restarts: 0, logs: [], listening: [] }
          : { state: 'waiting', reason: hh.reason === 'ImagePullBackOff' ? 'ImagePullBackOff' : 'CrashLoopBackOff', lastReason: 'Error', exitCode: 1, ready: false, restarts: 6, logs: hh.log || [], pullErr: hh.reason === 'ImagePullBackOff' };
      }
      // 재시작 정책이 Never/OnFailure 인 파드
      if (e.state === 'terminated' || (e.reason === 'CrashLoopBackOff' && p.spec.restartPolicy !== 'Always')) {
        if (p.spec.restartPolicy === 'Always') { e.state = 'waiting'; e.reason = 'CrashLoopBackOff'; e.lastReason = 'Completed'; e.restarts = 5; }
        else if (e.reason === 'CrashLoopBackOff') { e.state = 'terminated'; e.reason = e.lastReason || 'Error'; e.restarts = p.spec.restartPolicy === 'OnFailure' ? 3 : 0; }
      }
      evals.push(e);
      cs.push(ctrStatus(c, e, created));
    }
    st.containerStatuses = cs;
    Object.defineProperty(p, '_evals', { value: evals, enumerable: false, writable: true, configurable: true });
    const age = this.t - Date.parse(created) / 1000;
    if (!nodeOk && age > 0) {
      st.phase = 'Running'; // 노드가 죽어도 API 서버에는 마지막 상태가 남는다
      st.conditions.push({ type: 'Ready', status: 'False' });
      st.reason = 'NodeLost';
    } else if (volWait) {
      st.phase = 'Pending';
      const last = this.eventsFor(p).slice(-1)[0];
      if (!last || last.message !== volWait) this.event(p, 'Warning', 'FailedMount', volWait);
    } else if (initBlocked) {
      st.phase = 'Pending';
      st.initReason = initBlocked.reason;
    } else if (evals.length && evals.every((e) => e.state === 'terminated')) {
      st.phase = evals.every((e) => e.exitCode === 0) ? 'Succeeded' : 'Failed';
    } else if (evals.some((e) => e.state === 'running') || evals.some((e) => e.reason === 'CrashLoopBackOff')) {
      st.phase = 'Running';
    } else st.phase = 'Pending';
    const allReady = evals.length === p.spec.containers.length && evals.every((e) => e.state === 'running' && e.ready);
    st.conditions.push({ type: 'Initialized', status: initBlocked ? 'False' : 'True' });
    st.conditions.push({ type: 'ContainersReady', status: allReady ? 'True' : 'False' });
    if (!st.conditions.some((c) => c.type === 'Ready')) st.conditions.push({ type: 'Ready', status: allReady && nodeOk ? 'True' : 'False' });
    // 이벤트(처음 한 번)
    const evs = this.eventsFor(p);
    for (const [i, e] of evals.entries()) {
      const c = p.spec.containers[i];
      if (e.pullErr && !evs.some((x) => x.reason === 'Failed')) {
        this.event(p, 'Normal', 'Pulling', `Pulling image "${c.image}"`);
        this.event(p, 'Warning', 'Failed', `Failed to pull image "${c.image}": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/${c.image}": failed to resolve reference "docker.io/library/${c.image}": docker.io/library/${c.image}: not found`);
        this.event(p, 'Warning', 'Failed', 'Error: ErrImagePull');
        this.event(p, 'Normal', 'BackOff', `Back-off pulling image "${c.image}"`);
      } else if (!e.pullErr && !evs.some((x) => x.reason === 'Pulled' && x.message.includes(`"${c.image}"`)) && e.reason !== 'CreateContainerConfigError') {
        this.event(p, 'Normal', 'Pulled', `Container image "${c.image}" already present on machine`);
        this.event(p, 'Normal', 'Created', `Created container: ${c.name}`);
        this.event(p, 'Normal', 'Started', `Started container ${c.name}`);
        if (e.probeFail) this.event(p, 'Warning', 'Unhealthy', `${e.probeFail} probe failed: ${c.livenessProbe || c.readinessProbe ? 'Get "http://' + (p._ip || '') + ':' + (((c.livenessProbe || c.readinessProbe || c.startupProbe || {}).httpGet || {}).port || '') + '/": dial tcp: connect: connection refused' : 'probe failed'}`);
        if (e.reason === 'CrashLoopBackOff') this.event(p, 'Warning', 'BackOff', `Back-off restarting failed container ${c.name} in pod ${p.metadata.name}_${ns}(${p.metadata.uid})`);
      } else if (e.reason === 'CreateContainerConfigError' && !evs.some((x) => x.message.includes(e.message))) {
        this.event(p, 'Warning', 'Failed', `Error: ${e.message}`);
      }
    }
    p.status = st;
  }

  deploymentStatus(d) {
    const rss = this.ownedBy('ReplicaSet', d);
    const cur = rss.find((r) => (r.metadata.annotations || {})['deployment.kubernetes.io/revision'] === d.metadata.annotations['deployment.kubernetes.io/revision']);
    const pods = rss.flatMap((r) => this.ownedBy('Pod', r));
    const ready = pods.filter(isReady).length;
    const updated = cur ? this.ownedBy('Pod', cur).length : 0;
    d.status = { observedGeneration: 1, replicas: pods.length, updatedReplicas: updated, readyReplicas: ready, availableReplicas: ready, ...(pods.length - ready > 0 ? { unavailableReplicas: pods.length - ready } : {}),
      conditions: [{ type: 'Available', status: ready >= Math.max(0, (d.spec.replicas ?? 1) - pct((d.spec.strategy || {}).rollingUpdate && d.spec.strategy.rollingUpdate.maxUnavailable, d.spec.replicas ?? 1, false, 0.25)) ? 'True' : 'False', reason: 'MinimumReplicasAvailable' }, { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable' }] };
    if (!d.status.readyReplicas) delete d.status.readyReplicas;
    if (!d.status.availableReplicas) delete d.status.availableReplicas;
  }
  rsStatus(rs) {
    const pods = this.ownedBy('Pod', rs);
    rs.status = { replicas: pods.length, readyReplicas: pods.filter(isReady).length, availableReplicas: pods.filter(isReady).length, fullyLabeledReplicas: pods.length };
  }
  dsStatus(ds) {
    const pods = this.ownedBy('Pod', ds);
    const desired = this.list('Node').filter((n) => this.nodeFits(n, (ds.spec.template || {}).spec || {}, { daemon: true }).ok).length;
    ds.status = { desiredNumberScheduled: desired, currentNumberScheduled: pods.length, numberReady: pods.filter(isReady).length, updatedNumberScheduled: pods.length, numberAvailable: pods.filter(isReady).length };
  }
  stsStatus(s) {
    const pods = this.ownedBy('Pod', s);
    s.status = { replicas: pods.length, readyReplicas: pods.filter(isReady).length, currentReplicas: pods.length };
  }
  jobStatus(j) {
    const pods = this.ownedBy('Pod', j);
    const succeeded = pods.filter((p) => p.status && p.status.phase === 'Succeeded').length;
    const failed = pods.filter((p) => p.status && p.status.phase === 'Failed').length;
    const active = pods.length - succeeded - failed;
    const comp = j.spec.completions ?? 1;
    j.status = { startTime: j.metadata.creationTimestamp, ...(active ? { active } : {}), ...(succeeded ? { succeeded } : {}), ...(failed ? { failed } : {}) };
    if (succeeded >= comp) { j.status.completionTime = this.ts(); j.status.conditions = [{ type: 'Complete', status: 'True' }]; }
    else if (failed > (j.spec.backoffLimit ?? 6)) j.status.conditions = [{ type: 'Failed', status: 'True', reason: 'BackoffLimitExceeded' }];
  }

  // ── 서비스 ──
  assignClusterIP(svc) {
    if (svc.spec.clusterIP === 'None') return;
    if (!svc.spec.clusterIP) svc.spec.clusterIP = `10.${96 + (this.svcSeq % 12)}.${(this.svcSeq * 37) % 250}.${(this.svcSeq++ * 53) % 250 + 2}`;
    svc.spec.clusterIPs = [svc.spec.clusterIP];
    svc.spec.type = svc.spec.type || 'ClusterIP';
    for (const p of svc.spec.ports || []) {
      p.protocol = p.protocol || 'TCP';
      if (p.targetPort === undefined) p.targetPort = p.port;
      if ((svc.spec.type === 'NodePort' || svc.spec.type === 'LoadBalancer') && !p.nodePort) p.nodePort = this.nodePortSeq++;
    }
    if (svc.spec.type === 'LoadBalancer') svc.status = { loadBalancer: {} };
  }
  /** 서비스 포트 하나가 가리키는 실제 파드:포트 목록 */
  svcTargets(svc, port) {
    const out = [];
    if (!svc.spec.selector) return out;
    for (const p of this.list('Pod', svc.metadata.namespace)) {
      if (!isReady(p) || !matchSelector(svc.spec.selector, p.metadata.labels || {})) continue;
      let tp = port.targetPort ?? port.port;
      if (typeof tp === 'string' && !/^\d+$/.test(tp)) {
        const named = p.spec.containers.flatMap((c) => c.ports || []).find((x) => x.name === tp);
        if (!named) continue;
        tp = named.containerPort;
      }
      out.push({ pod: p, ip: p._ip || (p.status || {}).podIP, port: Number(tp) });
    }
    return out;
  }
  syncEndpoints() {
    for (const svc of this.list('Service')) {
      if (!svc.spec.selector) continue;
      const subsets = [];
      const addrs = new Map();
      for (const port of svc.spec.ports || []) {
        for (const t of this.svcTargets(svc, port)) {
          const k = t.port;
          if (!addrs.has(k)) addrs.set(k, { addresses: [], ports: [] });
          const s = addrs.get(k);
          if (!s.addresses.some((a) => a.ip === t.ip)) s.addresses.push({ ip: t.ip, nodeName: t.pod.spec.nodeName, targetRef: { kind: 'Pod', name: t.pod.metadata.name, namespace: t.pod.metadata.namespace } });
          if (!s.ports.some((x) => x.name === port.name && x.port === t.port)) s.ports.push({ ...(port.name ? { name: port.name } : {}), port: t.port, protocol: port.protocol || 'TCP' });
        }
      }
      for (const s of addrs.values()) subsets.push(s);
      const ep = this.get('Endpoints', svc.metadata.namespace, svc.metadata.name) || this.stamp({ apiVersion: 'v1', kind: 'Endpoints', metadata: { name: svc.metadata.name, namespace: svc.metadata.namespace, creationTimestamp: svc.metadata.creationTimestamp } });
      ep.metadata.labels = clone(svc.metadata.labels || {});
      if (subsets.length) ep.subsets = subsets; else delete ep.subsets;
      this.put(ep);
    }
    for (const ep of this.list('Endpoints')) {
      const svc = this.get('Service', ep.metadata.namespace, ep.metadata.name);
      if (!svc || (!svc.spec.selector && !ep._manual)) { if (!svc) this.remove(ep); }
    }
  }

  syncGateways() {
    for (const g of this.list('Gateway')) {
      const gc = this.get('GatewayClass', '', (g.spec || {}).gatewayClassName);
      g.status = { addresses: gc ? [{ type: 'IPAddress', value: '172.30.1.2' }] : [], conditions: [{ type: 'Accepted', status: gc ? 'True' : 'False' }, { type: 'Programmed', status: gc ? 'True' : 'False' }] };
    }
    for (const gc of this.list('GatewayClass')) gc.status = { conditions: [{ type: 'Accepted', status: 'True' }] };
  }

  // ── 네트워크 판정 ──
  /** NetworkPolicy 를 따져 from 파드 → to 파드:port 통신이 허용되는가 */
  netAllowed(from, to, port, proto = 'TCP') {
    const nsLabels = (ns) => ((this.get('Namespace', '', ns) || {}).metadata || {}).labels || {};
    const peerMatch = (peer, pod, polNs) => {
      if (peer.ipBlock) {
        const ip = pod._ip || '';
        return cidrHas(peer.ipBlock.cidr, ip) && !(peer.ipBlock.except || []).some((c) => cidrHas(c, ip));
      }
      const nsOk = peer.namespaceSelector ? matchLabelSelectorAllowEmpty(peer.namespaceSelector, nsLabels(pod.metadata.namespace)) : pod.metadata.namespace === polNs;
      const podOk = peer.podSelector ? matchLabelSelectorAllowEmpty(peer.podSelector, pod.metadata.labels || {}) : true;
      return nsOk && podOk;
    };
    const portMatch = (ports, pod) => !ports || !ports.length || ports.some((p) => {
      if ((p.protocol || 'TCP') !== proto) return false;
      if (p.port === undefined) return true;
      let n = p.port;
      if (typeof n === 'string' && !/^\d+$/.test(n)) n = (pod.spec.containers.flatMap((c) => c.ports || []).find((x) => x.name === n) || {}).containerPort;
      const end = p.endPort || Number(n);
      return port >= Number(n) && port <= end;
    });
    const types = (pol) => pol.spec.policyTypes || (pol.spec.egress ? ['Ingress', 'Egress'] : ['Ingress']);
    // 수신 측
    const inPols = this.list('NetworkPolicy', to.metadata.namespace).filter((p) => types(p).includes('Ingress') && matchLabelSelectorAllowEmpty(p.spec.podSelector, to.metadata.labels || {}));
    if (inPols.length && !inPols.some((pol) => (pol.spec.ingress || []).some((r) => (!r.from || !r.from.length || r.from.some((peer) => peerMatch(peer, from, pol.metadata.namespace))) && portMatch(r.ports, to)))) return { ok: false, side: 'ingress', pols: inPols };
    // 송신 측
    if (from) {
      const outPols = this.list('NetworkPolicy', from.metadata.namespace).filter((p) => types(p).includes('Egress') && matchLabelSelectorAllowEmpty(p.spec.podSelector, from.metadata.labels || {}));
      if (outPols.length && !outPols.some((pol) => (pol.spec.egress || []).some((r) => (!r.to || !r.to.length || r.to.some((peer) => peerMatch(peer, to, pol.metadata.namespace))) && portMatch(r.ports, to)))) return { ok: false, side: 'egress', pols: outPols };
    }
    return { ok: true };
  }

  /** 파드 안에서 host:port 로 접속했을 때의 결과 — { ok, body, err } */
  connect(fromPod, host, port) {
    const ns = fromPod.metadata.namespace;
    host = String(host).replace(/\.$/, '');
    // DNS 가 필요한 이름인가
    let target = null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const svc = this.list('Service').find((s) => s.spec.clusterIP === host);
      if (svc) target = { svc };
      else {
        const pod = this.list('Pod').find((p) => p._ip === host);
        if (pod) target = { pod };
        else return { ok: false, err: `connect to ${host} port ${port} failed: No route to host` };
      }
    } else {
      const dns = this.resolveDNS(fromPod, host);
      if (!dns.ok) return { ok: false, err: dns.err, dnsFail: true };
      target = dns.target;
    }
    let pods = [];
    let tport = port;
    if (target.svc) {
      const sp = (target.svc.spec.ports || []).find((p) => Number(p.port) === Number(port));
      if (!sp) return { ok: false, err: `connect to ${host} port ${port} failed: Connection timed out`, timeout: true };
      const ts = this.svcTargets(target.svc, sp);
      if (!ts.length) return { ok: false, err: `connect to ${host} port ${port} failed: Connection refused`, noEndpoints: true };
      pods = ts;
    } else {
      pods = [{ pod: target.pod, port: Number(port) }];
    }
    const t = pods[0];
    const net = this.netAllowed(fromPod, t.pod, t.port);
    if (!net.ok) return { ok: false, err: `connect to ${host} port ${port} failed: Connection timed out`, timeout: true, blocked: net };
    const evals = t.pod._evals || [];
    const listen = evals.some((e) => e.listening && e.listening.some((l) => l.port === t.port));
    if (!listen) return { ok: false, err: `connect to ${host} port ${port} failed: Connection refused`, refused: true };
    const c = t.pod.spec.containers.find((cc, i) => evals[i] && evals[i].listening.some((l) => l.port === t.port)) || t.pod.spec.containers[0];
    const info = parseImage(c.image).info || {};
    const cmdBody = [].concat(c.args || []).join(' ').match(/-text=(.*)/);
    const body = (cmdBody ? cmdBody[1].replace(/^["']|["']$/g, '') : info.body || 'OK').replace('{pod}', t.pod.metadata.name).replace('{ip}', t.pod._ip || '');
    tport = t.port;
    return { ok: true, body, pod: t.pod, port: tport };
  }
  resolveDNS(fromPod, host) {
    const ns = fromPod.metadata.namespace;
    const coredns = this.list('Pod', 'kube-system').filter((p) => (p.metadata.labels || {})['k8s-app'] === 'kube-dns' && isReady(p));
    if (!coredns.length) return { ok: false, err: `Could not resolve host: ${host}`, why: 'coredns' };
    const dnsSvc = this.get('Service', 'kube-system', 'kube-dns');
    const net = this.netAllowed(fromPod, coredns[0], 53, 'UDP');
    if (!dnsSvc || !net.ok) return { ok: false, err: `Could not resolve host: ${host}`, why: 'egress' };
    const parts = host.split('.');
    let svcName = parts[0], svcNs = ns;
    if (parts.length >= 2 && parts[1] !== 'svc') svcNs = parts[1];
    if (parts.length > 2 && parts[2] !== 'svc' && !host.endsWith('.cluster.local')) return { ok: false, err: `Could not resolve host: ${host}` };
    // pod DNS: 10-244-1-5.ns.pod.cluster.local
    if (parts[2] === 'pod') {
      const ip = parts[0].replace(/-/g, '.');
      const pod = this.list('Pod').find((p) => p._ip === ip);
      return pod ? { ok: true, target: { pod }, ip } : { ok: false, err: `Could not resolve host: ${host}` };
    }
    const svc = this.get('Service', svcNs, svcName);
    if (svc) {
      if (svc.spec.clusterIP === 'None') {
        const ep = this.svcTargets(svc, (svc.spec.ports || [{ port: 80 }])[0]);
        if (!ep.length) return { ok: false, err: `Could not resolve host: ${host}` };
        return { ok: true, target: { pod: ep[0].pod }, ip: ep[0].ip, headless: ep.map((e) => e.ip) };
      }
      return { ok: true, target: { svc }, ip: svc.spec.clusterIP, fqdn: `${svc.metadata.name}.${svcNs}.svc.cluster.local` };
    }
    // StatefulSet 파드: web-0.nginx(.ns)
    if (parts.length >= 2) {
      const pod = this.get('Pod', parts.length > 2 && parts[2] !== 'svc' ? parts[2] : ns, parts[0]);
      if (pod && pod.spec.subdomain === parts[1]) return { ok: true, target: { pod }, ip: pod._ip };
      const hs = this.get('Service', parts.length >= 3 && parts[2] !== 'svc' ? parts[2] : ns, parts[1]);
      if (hs && hs.spec.clusterIP === 'None') {
        const p2 = this.get('Pod', hs.metadata.namespace, parts[0]);
        if (p2) return { ok: true, target: { pod: p2 }, ip: p2._ip };
      }
    }
    return { ok: false, err: `Could not resolve host: ${host}`, nx: true };
  }

  // ── RBAC 판정 (kubectl auth can-i --as) ──
  canI(subject, verb, resource, ns, name, group) {
    // subject: { user, groups, sa: {ns,name} }
    const subjMatch = (s, bindingNs) => {
      if (s.kind === 'User') return subject.user && s.name === subject.user;
      if (s.kind === 'Group') return (subject.groups || []).includes(s.name);
      if (s.kind === 'ServiceAccount') return subject.sa && s.name === subject.sa.name && (s.namespace || bindingNs) === subject.sa.ns;
      return false;
    };
    const ruleOk = (rules) => (rules || []).some((r) => {
      if (!r.verbs || !(r.verbs.includes('*') || r.verbs.includes(verb))) return false;
      if (!r.resources) return false;
      const res = r.resources;
      const [base, sub] = resource.split('/');
      if (!(res.includes('*') || res.includes(resource) || (!sub && res.includes(base)))) return false;
      const gr = r.apiGroups || [''];
      if (!(gr.includes('*') || gr.includes(group))) return false;
      if (r.resourceNames && r.resourceNames.length && !(name && r.resourceNames.includes(name))) return false;
      return true;
    });
    const roleRules = (ref, bns) => ref.kind === 'ClusterRole' ? (this.get('ClusterRole', '', ref.name) || {}).rules : (this.get('Role', bns, ref.name) || {}).rules;
    for (const b of this.list('ClusterRoleBinding')) {
      if ((b.subjects || []).some((s) => subjMatch(s, '')) && ruleOk(roleRules(b.roleRef, ''))) return true;
    }
    if (ns) {
      for (const b of this.list('RoleBinding', ns)) {
        if ((b.subjects || []).some((s) => subjMatch(s, ns)) && ruleOk(roleRules(b.roleRef, ns))) return true;
      }
    }
    return false;
  }
}

// ─── 도우미 ───────────────────────────────────────────────────────────────
export function isReady(p) {
  return !!(p && p.status && (p.status.conditions || []).some((c) => c.type === 'Ready' && c.status === 'True'));
}
export function b64d(s) {
  try { return typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); } catch { return ''; }
}
export function b64e(s) {
  return typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64');
}
function pct(v, total, up, def) {
  if (v === undefined || v === null) v = `${def * 100}%`;
  if (typeof v === 'string' && v.endsWith('%')) {
    const f = (parseFloat(v) / 100) * total;
    return up ? Math.ceil(f) : Math.floor(f);
  }
  return Number(v);
}
function tolerates(tol, taint) {
  if (tol.effect && tol.effect !== taint.effect) return false;
  if (tol.operator === 'Exists') return !tol.key || tol.key === taint.key;
  return tol.key === taint.key && String(tol.value ?? '') === String(taint.value ?? '');
}
export function podResources(spec) {
  const out = { raw: {} };
  const cs = (spec && spec.containers) || [];
  let missingReqCpu = false, missingReqMem = false, missingLimCpu = false, missingLimMem = false;
  for (const k of ['req.cpu', 'req.memory', 'lim.cpu', 'lim.memory']) out[k] = 0;
  for (const c of cs) {
    const r = (c.resources || {}).requests || {};
    const l = (c.resources || {}).limits || {};
    const rc = r.cpu ?? l.cpu, rm = r.memory ?? l.memory;
    if (rc === undefined) missingReqCpu = true; else out['req.cpu'] += parseCpu(rc);
    if (rm === undefined) missingReqMem = true; else out['req.memory'] += parseMem(rm);
    if (l.cpu === undefined) missingLimCpu = true; else out['lim.cpu'] += parseCpu(l.cpu);
    if (l.memory === undefined) missingLimMem = true; else out['lim.memory'] += parseMem(l.memory);
    out.raw['req.cpu'] = rc; out.raw['req.memory'] = rm; out.raw['lim.cpu'] = l.cpu; out.raw['lim.memory'] = l.memory;
  }
  if (missingReqCpu) out['req.cpu'] = out['req.cpu'] || null;
  if (missingReqMem) out['req.memory'] = out['req.memory'] || null;
  if (missingLimCpu) out['lim.cpu'] = null;
  if (missingLimMem) out['lim.memory'] = null;
  if (out['req.cpu'] === null && !cs.length) out['req.cpu'] = 0;
  return out;
}
function qosOf(spec) {
  const cs = (spec && spec.containers) || [];
  const any = cs.some((c) => c.resources && (Object.keys(c.resources.requests || {}).length || Object.keys(c.resources.limits || {}).length));
  if (!any) return 'BestEffort';
  const g = cs.every((c) => { const r = (c.resources || {}).requests || {}; const l = (c.resources || {}).limits || {}; return l.cpu && l.memory && (!r.cpu || r.cpu === l.cpu) && (!r.memory || r.memory === l.memory); });
  return g ? 'Guaranteed' : 'Burstable';
}
function ctrStatus(c, e, created) {
  const s = { name: c.name, image: c.image, imageID: '', ready: !!(e.state === 'running' && e.ready), restartCount: e.restarts || 0, started: e.state === 'running' };
  if (e.state === 'running') s.state = { running: { startedAt: created } };
  else if (e.state === 'terminated') s.state = { terminated: { exitCode: e.exitCode, reason: e.reason, startedAt: created, finishedAt: created } };
  else s.state = { waiting: { reason: e.reason, ...(e.message ? { message: e.message } : {}) } };
  if (e.lastReason) s.lastState = { terminated: { exitCode: e.exitCode || 1, reason: e.lastReason, startedAt: created, finishedAt: created } };
  return s;
}
function cidrHas(cidr, ip) {
  if (!cidr || !ip) return false;
  const [base, bits] = cidr.split('/');
  const toN = (s) => s.split('.').reduce((a, b) => (a << 8) + Number(b), 0) >>> 0;
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return ((toN(base) & mask) >>> 0) === ((toN(ip) & mask) >>> 0);
}

/** 파드 STATUS 칸(kubectl get pods) */
export function podStatusText(p) {
  if (p.metadata.deletionTimestamp) return 'Terminating';
  const st = p.status || {};
  if (st.reason === 'NodeLost') return 'Unknown';
  if (st.initReason) return st.initReason;
  const cs = st.containerStatuses || [];
  for (const c of cs) {
    if (c.state && c.state.waiting && c.state.waiting.reason && c.state.waiting.reason !== 'PodInitializing') return c.state.waiting.reason;
  }
  if (st.phase === 'Succeeded') return 'Completed';
  if (st.phase === 'Failed') {
    const t = cs.find((c) => c.state && c.state.terminated);
    return t ? t.state.terminated.reason || 'Error' : 'Error';
  }
  if (st.phase === 'Pending' && cs.some((c) => c.state && c.state.waiting && c.state.waiting.reason === 'ContainerCreating')) return 'ContainerCreating';
  return st.phase || 'Pending';
}
