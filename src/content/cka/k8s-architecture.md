---
title: 쿠버네티스 아키텍처
part: 1
order: 3
domain: basics
minutes: 25
summary: 컨트롤 플레인 네 부품과 노드의 두 부품이 각자 무엇을 하는지. 이걸 알아야 고장 위치를 좁힐 수 있다.
goals:
  - kube-apiserver · etcd · kube-scheduler · kube-controller-manager 의 역할을 설명할 수 있다
  - kubelet · kube-proxy · 컨테이너 런타임의 역할을 설명할 수 있다
  - 파드 하나가 만들어질 때 부품들이 어떤 순서로 움직이는지 안다
  - kubeadm 클러스터에서 컨트롤 플레인이 static pod 로 돈다는 것을 안다
quiz:
  - q: 클러스터의 모든 상태가 저장되는 곳은?
    options: ["kube-apiserver 메모리", "etcd", "각 노드의 kubelet", "kube-scheduler"]
    answer: 1
    explain: etcd 는 키-값 저장소로 클러스터의 모든 오브젝트를 저장한다. 그래서 etcd 백업이 곧 클러스터 백업이다.
  - q: 새 파드가 만들어졌는데 계속 Pending 이고 Events 가 하나도 없다. 가장 먼저 의심할 부품은?
    options: ["kube-proxy", "kube-scheduler", "CoreDNS", "etcd"]
    answer: 1
    explain: 노드 배정은 스케줄러의 일이다. 스케줄러가 죽으면 파드는 nodeName 없이 Pending 으로 남고 FailedScheduling 이벤트조차 생기지 않는다.
  - q: Deployment 의 레플리카를 3으로 했는데 파드가 하나도 안 생긴다. 스케줄러는 정상이다. 의심할 부품은?
    options: ["kube-controller-manager", "kubelet", "kube-proxy", "containerd"]
    answer: 0
    explain: Deployment→ReplicaSet→Pod 를 만드는 것은 컨트롤러 매니저 안의 컨트롤러들이다. 컨트롤러 매니저가 죽으면 파드 오브젝트 자체가 생기지 않는다.
  - q: kubeadm 으로 설치한 클러스터에서 kube-apiserver 설정을 바꾸려면?
    options: ["kubectl edit deployment kube-apiserver -n kube-system", "/etc/kubernetes/manifests/kube-apiserver.yaml 을 고친다", "systemctl edit kube-apiserver", "etcd 를 직접 수정"]
    answer: 1
    explain: kubeadm 은 컨트롤 플레인을 static pod 로 띄운다. kubelet 이 /etc/kubernetes/manifests 를 감시하다가 파일이 바뀌면 파드를 다시 만든다.
  - q: Service 의 가상 IP 로 온 트래픽을 실제 파드로 보내는 규칙을 노드마다 설정하는 것은?
    options: ["kubelet", "kube-proxy(또는 이를 대신하는 CNI)", "CoreDNS", "kube-scheduler"]
    answer: 1
    explain: kube-proxy 가 각 노드에 iptables/IPVS 규칙을 만든다. Cilium 처럼 kube-proxy 역할을 대신하는 CNI 도 있다.
---

## 두 층: 컨트롤 플레인과 노드

```
┌──────────────── 컨트롤 플레인 (controlplane) ────────────────┐
│  kube-apiserver  ←→  etcd                                    │
│        ↑   ↑                                                 │
│  kube-scheduler   kube-controller-manager                    │
└────────┼─────────────────────────────────────────────────────┘
         │ (모든 대화는 API 서버를 거친다)
┌────────┴───────── 워커 노드 (node01, node02 …) ───────────────┐
│  kubelet  →  컨테이너 런타임(containerd)  →  파드(컨테이너)     │
│  kube-proxy (Service 규칙)     CNI 플러그인 (파드 네트워크)       │
└──────────────────────────────────────────────────────────────┘
```

### 컨트롤 플레인

| 부품 | 하는 일 | 죽으면 |
|---|---|---|
| **kube-apiserver** | 모든 요청의 입구. 인증·인가·검증 후 etcd 에 저장 | `kubectl` 전부 실패(`connection refused`) |
| **etcd** | 클러스터 상태 저장소(키-값) | API 서버도 같이 죽는다 |
| **kube-scheduler** | 새 파드를 어느 노드에 둘지 결정 | 새 파드가 **Events 없이** Pending |
| **kube-controller-manager** | 컨트롤러 묶음 — Deployment·ReplicaSet·Node·Job·ServiceAccount 등 | 레플리카가 맞춰지지 않음, 새 파드가 안 생김 |

### 노드

| 부품 | 하는 일 | 죽으면 |
|---|---|---|
| **kubelet** | 이 노드에 배정된 파드를 런타임에 띄우고 상태를 보고 | 노드 `NotReady` |
| **컨테이너 런타임** | 실제 컨테이너 실행(containerd, CRI-O) | 컨테이너 생성 실패 |
| **kube-proxy** | Service 의 가상 IP → 파드 IP 규칙(iptables/IPVS) | 서비스로 접속 안 됨 |
| **CNI 플러그인** | 파드에 IP 를 주고 노드 간 파드 통신 연결(Calico, Cilium, Flannel …) | 파드가 `ContainerCreating` 에서 멈춤, 노드 NotReady |

## 파드 하나가 생기기까지

`kubectl create deployment web --image=nginx --replicas=2` 를 치면:

1. **kubectl** → API 서버에 Deployment 생성 요청.
2. **API 서버** → 인증·인가·검증 후 etcd 에 저장.
3. **Deployment 컨트롤러**(컨트롤러 매니저) → 이를 보고 ReplicaSet 을 만든다.
4. **ReplicaSet 컨트롤러** → 파드 오브젝트 2개를 만든다(아직 노드 없음 = Pending).
5. **스케줄러** → 노드 배정이 안 된 파드를 보고, 조건에 맞는 노드를 골라 `spec.nodeName` 을 적는다.
6. **그 노드의 kubelet** → 자기 노드에 배정된 파드를 보고 런타임에 컨테이너 생성을 요청한다. CNI 가 IP 를 준다.
7. kubelet 이 상태를 API 서버에 보고 → `Running`.

트러블슈팅은 이 사슬 중 **어디서 끊겼는지** 찾는 일입니다. 파드 오브젝트가 아예 없으면 3~4번(컨트롤러), nodeName 이 비어 있으면 5번(스케줄러), 노드는 정해졌는데 컨테이너가 안 뜨면 6번(kubelet·이미지·설정)입니다.

## kubeadm 클러스터의 비밀: static pod

kubeadm 으로 설치한 클러스터에서 컨트롤 플레인 부품들은 **static pod** 로 돕니다.

```bash
ls /etc/kubernetes/manifests/
# etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml
```

kubelet 은 설정(`/var/lib/kubelet/config.yaml` 의 `staticPodPath`)에 적힌 이 폴더를 감시하다가, **파일이 생기면 파드를 띄우고, 바뀌면 다시 띄우고, 지우면 내립니다.** API 서버 없이도 kubelet 혼자 합니다. 그래서 API 서버 자체도 파드로 띄울 수 있습니다.

- `kubectl get pods -n kube-system` 에 보이는 `kube-apiserver-controlplane` 은 **거울 파드(mirror pod)** 입니다. 여기서 지워도 파일이 있는 한 다시 생깁니다.
- 컨트롤 플레인 설정을 바꾸려면 **이 YAML 파일을 고칩니다.** 저장하면 kubelet 이 알아서 다시 띄웁니다(1분쯤 걸릴 수 있음).
- 파일을 고쳤는데 부품이 안 살아나면? API 서버가 죽었다면 `kubectl` 이 안 되므로 **`crictl ps -a` 와 `crictl logs`** 로 봅니다.

```bash
cat /var/lib/kubelet/config.yaml | grep staticPodPath
# staticPodPath: /etc/kubernetes/manifests
```

## 중요한 파일 위치

| 경로 | 내용 |
|---|---|
| `/etc/kubernetes/manifests/` | 컨트롤 플레인 static pod |
| `/etc/kubernetes/pki/` | 클러스터 인증서(`etcd/` 아래는 etcd 용) |
| `/etc/kubernetes/admin.conf` | 관리자 kubeconfig |
| `/var/lib/kubelet/config.yaml` | kubelet 설정 |
| `/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf` | kubelet 서비스 설정(drop-in) |
| `/var/lib/etcd/` | etcd 데이터 |
| `~/.kube/config` | kubectl 이 쓰는 kubeconfig |
