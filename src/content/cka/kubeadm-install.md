---
title: kubeadm 으로 클러스터 만들기
part: 3
order: 1
domain: arch
minutes: 30
summary: 인프라 준비(swap·커널 모듈·런타임) → kubeadm init → CNI → join. 각 단계가 왜 필요한지와 자주 막히는 곳.
goals:
  - kubeadm 설치 전 노드 준비 항목을 나열할 수 있다
  - kubeadm init · join 의 흐름과 결과물(인증서, kubeconfig, static pod)을 안다
  - 노드 추가용 join 명령을 다시 만들 수 있다
labs: [w12]
quiz:
  - q: kubeadm init 직후 노드가 NotReady 인 가장 흔한 이유는?
    options: ["etcd 가 없어서", "CNI 플러그인을 아직 설치하지 않아서", "kubectl 이 없어서", "워커가 없어서"]
    answer: 1
    explain: 파드 네트워크(CNI)가 없으면 kubelet 이 네트워크 준비 안 됨을 보고해 NotReady 다. Calico·Cilium·Flannel 중 하나를 설치하면 Ready 가 된다. CoreDNS 도 그때까지 Pending.
  - q: 워커 노드를 나중에 추가하려는데 join 명령을 잃어버렸다. 어떻게 하나?
    options: ["클러스터를 다시 설치한다", "kubeadm token create --print-join-command", "kubectl join", "/etc/kubernetes/join.txt 를 본다"]
    answer: 1
    explain: 토큰은 24시간 만료된다. 컨트롤 플레인에서 kubeadm token create --print-join-command 로 새 토큰과 CA 해시가 든 명령을 만든다.
  - q: containerd 와 kubelet 의 cgroup 드라이버에 대해 맞는 것은?
    options: ["서로 달라야 한다", "같아야 하며 systemd 를 쓰는 것이 권장된다", "상관없다", "cgroupfs 만 가능하다"]
    answer: 1
    explain: 둘이 다르면 노드가 불안정해진다. systemd 를 init 으로 쓰는 배포판에서는 systemd 드라이버가 권장된다(kubeadm 기본값도 systemd).
  - q: "`net.ipv4.ip_forward = 1` 을 설정하는 이유는?"
    options: ["SSH 를 위해", "노드가 파드 트래픽을 다른 인터페이스로 전달(라우팅)할 수 있게", "DNS 를 위해", "디스크 성능"]
    answer: 1
    explain: 파드 간·노드 간 통신은 노드가 패킷을 전달해야 한다. 커널의 IP 포워딩이 꺼져 있으면 파드 네트워크가 동작하지 않는다.
---

## 전체 흐름

```
[모든 노드] 준비: swap 끄기 → 커널 모듈·sysctl → 컨테이너 런타임 → kubeadm·kubelet·kubectl 설치
[컨트롤 플레인] kubeadm init → kubeconfig 복사 → CNI 설치
[워커] kubeadm join …
```

실습 명령은 [실습환경 만들기](/academy/cka/lab-setup/)에 모아 두었습니다. 이 강의는 **각 단계가 왜 필요한지**에 집중합니다. 교과과정의 "Prepare underlying infrastructure for installing a Kubernetes cluster" 와 "Create and manage Kubernetes clusters using kubeadm" 항목입니다.

## 1. 노드 준비

| 준비 | 이유 |
|---|---|
| `swapoff -a` + fstab 에서 제거 | kubelet 은 기본 설정에서 swap 이 켜져 있으면 시작을 거부한다(메모리 보장 계산이 틀어지므로) |
| `overlay`, `br_netfilter` 모듈 | 컨테이너 파일시스템(overlay), 브리지 트래픽을 iptables 가 보게(br_netfilter) |
| `net.bridge.bridge-nf-call-iptables=1` | 파드 트래픽에 Service 규칙(iptables)이 적용되게 |
| `net.ipv4.ip_forward=1` | 노드가 파드 패킷을 전달(라우팅)하게 |
| 컨테이너 런타임(containerd) | kubelet 이 CRI 로 컨테이너를 띄울 대상 |
| cgroup 드라이버 `systemd` 로 통일 | 런타임과 kubelet 이 다르면 노드가 불안정 |
| 필요한 포트 열기 | 6443(API), 2379-2380(etcd), 10250(kubelet), 30000-32767(NodePort) |
| 노드마다 고유한 hostname·MAC·product_uuid | 노드 식별 |

## 2. 패키지 저장소는 마이너 버전마다

쿠버네티스 패키지는 `pkgs.k8s.io` 에서 받는데, **저장소 주소에 마이너 버전이 들어갑니다.**

```
deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /
```

v1.36 으로 올리려면 이 줄의 `v1.35` 를 `v1.36` 으로 바꾸고 `apt-get update` 해야 새 버전이 보입니다. 설치 후에는 **`apt-mark hold`** 로 자동 업그레이드를 막습니다.

## 3. kubeadm init

```bash
sudo kubeadm init \
  --pod-network-cidr=192.168.0.0/16 \      # CNI 가 쓸 파드 IP 대역(CNI 문서의 값과 맞춘다)
  --apiserver-advertise-address=10.0.0.10  # (선택) API 서버가 알릴 IP
```

init 이 하는 일:

1. **preflight** 검사(swap, 포트, 런타임 …) — 실패하면 이유를 알려 준다.
2. **인증서** 생성 → `/etc/kubernetes/pki/`
3. **kubeconfig** 생성 → `/etc/kubernetes/admin.conf`, `controller-manager.conf`, `scheduler.conf`, `kubelet.conf`
4. **static pod 매니페스트** 생성 → `/etc/kubernetes/manifests/`(etcd, apiserver, controller-manager, scheduler)
5. kubelet 이 이를 띄우고, 애드온(CoreDNS, kube-proxy)을 설치
6. 워커용 **join 명령** 출력

끝나면 관리자 kubeconfig 를 내 계정으로 복사합니다.

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 4. CNI 설치

init 직후 `kubectl get nodes` 는 **NotReady**, CoreDNS 는 **Pending** 입니다. 파드 네트워크가 없기 때문입니다. CNI 를 설치하면 해결됩니다.

```bash
kubectl apply -f <Calico / Cilium / Flannel 의 매니페스트 주소>
```

- **Calico** — NetworkPolicy 지원, 가장 흔함
- **Cilium** — eBPF 기반, NetworkPolicy·kube-proxy 대체
- **Flannel** — 단순, **NetworkPolicy 미지원**

## 5. 워커 추가

```bash
# 컨트롤 플레인에서 (토큰은 24시간 유효)
kubeadm token create --print-join-command
# 워커에서
sudo kubeadm join 10.0.0.10:6443 --token … --discovery-token-ca-cert-hash sha256:…
```

## 고가용성(HA) 컨트롤 플레인

교과과정에는 "Manage a highly-available Kubernetes cluster" 도 있습니다. 개념만 확실히 해 두세요.

- 컨트롤 플레인 노드를 **3대 이상**(홀수) 두고 앞에 **로드 밸런서**(API 6443)를 둔다. `kubeadm init --control-plane-endpoint=LB주소:6443 --upload-certs`
- 나머지 컨트롤 플레인은 `kubeadm join … --control-plane --certificate-key …`
- etcd 를 컨트롤 플레인과 같이 두면 **stacked etcd**(기본), 따로 두면 **external etcd**.
- etcd 는 과반수(quorum)가 살아 있어야 동작한다 → 3대면 1대, 5대면 2대까지 고장을 견딘다.

## 자주 막히는 곳

| 증상 | 원인 |
|---|---|
| preflight: `swap is enabled` | swap 을 안 껐다 |
| preflight: `container runtime is not running` | containerd 가 안 떴거나 소켓 경로가 다름 |
| init 후 kubelet 이 계속 재시작 | cgroup 드라이버 불일치 — `journalctl -u kubelet` |
| 노드 NotReady, CoreDNS Pending | CNI 미설치 |
| 워커 join: `token has expired` | `kubeadm token create --print-join-command` 로 새로 |
| 망가뜨려서 처음부터 | `sudo kubeadm reset` 후 다시 init |
