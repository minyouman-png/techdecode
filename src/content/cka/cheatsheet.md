---
title: 치트시트 — 한 장 요약
part: 7
order: 2
domain: strategy
minutes: 10
summary: 시험 직전에 훑어볼 명령·경로·YAML 조각 모음.
goals:
  - 자주 쓰는 명령을 한눈에 확인한다
labs: []
quiz: []
---

## 준비

```bash
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
k config use-context <문제의 컨텍스트>
```

## 조회

```bash
k get pods -A -o wide --show-labels
k get pods -l app=web --field-selector status.phase!=Running
k describe pod X | tail -20          # Events
k logs X [-c C] [--previous] [--tail=50]
k get events -n NS --sort-by=.lastTimestamp
k get X -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
k get X -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName
k top pods -n NS --sort-by=cpu
k api-resources | grep -i X
k explain pod.spec.containers.resources
```

## 생성

```bash
k run P --image=I [--labels=a=b] [--port=80] [--env=K=V] [--restart=Never] [-- cmd args]
k create deploy D --image=I --replicas=3
k expose deploy D --port=80 --target-port=8080 [--type=NodePort] [--name=S]
k create cm C --from-literal=K=V --from-file=F
k create secret generic S --from-literal=K=V
k create sa A
k create role R --verb=get,list --resource=pods,deployments
k create rolebinding RB --role=R --serviceaccount=NS:A [--user=U]
k create clusterrole CR --verb=get,list,watch --resource=nodes
k create clusterrolebinding CRB --clusterrole=CR --user=U
k create job J --image=I -- cmd
k create cronjob CJ --image=I --schedule="*/5 * * * *" -- cmd
k create job J2 --from=cronjob/CJ
k create ingress IG --class=nginx --rule="host/path*=svc:80"
k create priorityclass PC --value=1000
k create quota Q --hard=pods=10,requests.cpu=2
k autoscale deploy D --min=2 --max=5 --cpu-percent=70
```

## 수정

```bash
k set image deploy/D C=I
k set resources deploy/D --requests=cpu=100m,memory=128Mi --limits=memory=256Mi
k scale deploy D --replicas=5
k rollout status|history|undo [--to-revision=N]|restart deploy/D
k annotate deploy D kubernetes.io/change-cause="msg"
k label node N key=val            # key- 로 삭제, --overwrite 로 덮어쓰기
k taint node N key=val:NoSchedule # 끝에 - 로 해제
k cordon|uncordon N
k drain N --ignore-daemonsets [--force] [--delete-emptydir-data]
k patch X N -p '{"spec":{…}}'  [--type=merge|json]
k replace --force -f F.yaml       # 불변 필드 수정
```

## 노드 · 컨트롤 플레인

```bash
ssh node01 ; exit
systemctl status|restart|enable --now kubelet ; systemctl daemon-reload
journalctl -u kubelet -n 50 --no-pager
crictl ps -a ; crictl logs ID
ls /etc/kubernetes/manifests/            # static pod
grep staticPodPath /var/lib/kubelet/config.yaml
```

## etcd

```bash
ETCDCTL_API=3 etcdctl snapshot save /opt/backup.db --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key
etcdutl snapshot status /opt/backup.db -w table
etcdutl snapshot restore /opt/backup.db --data-dir /var/lib/etcd-restore
# → /etc/kubernetes/manifests/etcd.yaml 의 etcd-data hostPath.path 변경
```

## 업그레이드(노드마다)

```bash
k drain N --ignore-daemonsets                        # 컨트롤 플레인에서
apt-get update && apt-cache madison kubeadm
apt-mark unhold kubeadm && apt-get install -y kubeadm='1.xx.y-1.1' && apt-mark hold kubeadm
kubeadm upgrade plan && kubeadm upgrade apply v1.xx.y   # 첫 컨트롤 플레인
kubeadm upgrade node                                    # 워커
apt-mark unhold kubelet kubectl && apt-get install -y kubelet='1.xx.y-1.1' kubectl='1.xx.y-1.1' && apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet
k uncordon N
```

## Helm · Kustomize

```bash
helm repo add R URL && helm repo update
helm install REL R/CHART --version V -n NS --create-namespace --set k=v [-f values.yaml]
helm upgrade|rollback|uninstall REL -n NS ; helm list -A
helm template REL R/CHART --version V --set k=v > out.yaml
k kustomize DIR ; k apply -k DIR
```

## YAML 조각

```yaml
# 프로브
readinessProbe: {httpGet: {path: /, port: 80}, periodSeconds: 5}
livenessProbe: {tcpSocket: {port: 80}}
# 리소스
resources: {requests: {cpu: 100m, memory: 128Mi}, limits: {cpu: 200m, memory: 256Mi}}
# toleration
tolerations: [{key: k, operator: Equal, value: v, effect: NoSchedule}]
# nodeAffinity
affinity: {nodeAffinity: {requiredDuringSchedulingIgnoredDuringExecution: {nodeSelectorTerms: [{matchExpressions: [{key: disktype, operator: In, values: [ssd]}]}]}}}
# env from
env: [{name: A, valueFrom: {configMapKeyRef: {name: cm, key: A}}}, {name: B, valueFrom: {secretKeyRef: {name: s, key: B}}}]
# 볼륨
volumes: [{name: d, persistentVolumeClaim: {claimName: pvc}}, {name: c, configMap: {name: cm}}, {name: s, secret: {secretName: s}}, {name: t, emptyDir: {}}]
```

## 파일 위치

| 무엇 | 어디 |
|---|---|
| static pod | `/etc/kubernetes/manifests/` |
| 인증서 | `/etc/kubernetes/pki/` (etcd: `pki/etcd/`) |
| kubelet 설정 | `/var/lib/kubelet/config.yaml` |
| kubelet 서비스 | `…/kubelet.service.d/10-kubeadm.conf` (`systemctl status` 의 Drop-In) |
| kubeconfig | `/etc/kubernetes/admin.conf`, `~/.kube/config` |
| CNI 설정 | `/etc/cni/net.d/` |
| 파드 로그 | `/var/log/pods/` |
