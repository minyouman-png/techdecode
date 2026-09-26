---
title: 실습환경 만들기
part: 0
order: 2
domain: intro
minutes: 30
summary: 브라우저 실습 터미널, 내 컴퓨터의 kind, 가상머신에 kubeadm 으로 진짜 클러스터 — 세 가지 환경과 각각의 쓰임.
goals:
  - 이 사이트의 실습 터미널로 과제를 풀고 채점받을 수 있다
  - kind 로 내 컴퓨터에 여러 노드 클러스터를 띄울 수 있다
  - kubeadm 으로 가상머신 두 대에 실제 클러스터를 설치하는 흐름을 안다
labs: [b1]
quiz:
  - q: kind 가 노드 역할을 하는 데 쓰는 것은?
    options: ["가상머신", "도커(컨테이너) 하나하나", "클라우드 인스턴스", "라즈베리파이"]
    answer: 1
    explain: kind(Kubernetes IN Docker)는 도커 컨테이너 하나를 노드 하나로 쓴다. 가볍지만 노드에 ssh 해서 systemctl 을 만지는 연습은 한계가 있다.
  - q: kubelet · systemd · 노드 업그레이드 같은 '노드 관리' 연습에 가장 알맞은 환경은?
    options: ["minikube 단일 노드", "가상머신에 kubeadm 으로 설치한 클러스터", "관리형 클라우드 쿠버네티스(EKS·GKE)", "어느 것이든 같다"]
    answer: 1
    explain: 관리형 클라우드는 컨트롤 플레인을 숨기고, kind·minikube 는 노드가 컨테이너다. 시험처럼 노드에 들어가 kubelet 과 static pod 을 만지려면 가상머신 + kubeadm 이 가장 가깝다.
  - q: kubeadm 설치 전에 노드에서 꺼야 하는 것은?
    options: ["방화벽 전부", "swap(또는 kubelet 이 swap 을 허용하도록 설정)", "SSH", "DNS"]
    answer: 1
    explain: kubelet 은 기본 설정에서 swap 이 켜져 있으면 시작하지 않는다. 실습용으로는 `swapoff -a` 후 /etc/fstab 에서도 지우는 것이 가장 간단하다.
---

## 환경은 세 가지를 섞어 쓴다

| 환경 | 좋은 점 | 한계 | 언제 |
|---|---|---|---|
| **이 사이트의 실습 터미널** | 설치 없음, 과제·자동 채점, 망가진 클러스터를 버튼 하나로 재현 | 동작을 흉내 낸 시뮬레이터 | 매일의 반복 연습, 트러블슈팅 감각 |
| **kind (내 컴퓨터)** | 진짜 쿠버네티스, 1분 만에 생성·삭제 | 노드가 컨테이너라 systemd·업그레이드 연습이 어색함 | 워크로드·네트워킹·스토리지 |
| **가상머신 + kubeadm** | 시험장과 가장 비슷 | 준비가 번거로움 | 설치·업그레이드·etcd·노드 장애 |

그리고 시험을 사면 딸려 오는 **killer.sh 시뮬레이터 2회**는 시험 2주 전쯤 아껴 두었다가 씁니다. 실제 시험보다 어렵게 만들어져 있어서 거기서 60% 가 나오면 본 시험은 대체로 넉넉합니다.

## 1. 이 사이트의 실습 터미널

[실습 터미널](/academy/cka/lab/)을 열면 왼쪽에 과제, 오른쪽에 터미널이 있습니다.

- 클러스터 구성: `controlplane`(컨트롤 플레인), `node01`, `node02` 세 노드. 버전은 v1.35.
- `kubectl`(별칭 `k`), `helm`, `etcdctl`/`etcdutl`, `kubeadm`, `systemctl`, `journalctl`, `crictl`, `ssh`, `vi` 를 쓸 수 있습니다. `help` 를 치면 전체 목록이 나옵니다.
- `vi 파일` 을 치면 편집기 창이 열립니다(저장 `Ctrl+S`, 닫기 `Esc`). `kubectl edit` 도 같은 창을 씁니다.
- **채점하기**를 누르면 항목별로 통과·미통과가 나옵니다. 막히면 힌트를 한 단계씩 열고, 마지막에는 모범 답안을 볼 수 있습니다.
- **다시 시작**은 과제의 처음 상태로 클러스터를 되돌립니다.

첫 과제로 연습해 봅시다. 아래 과제 버튼을 누르세요.

## 2. kind 로 내 컴퓨터에 클러스터 만들기

도커(Docker Desktop 또는 Linux 의 docker)가 있으면 됩니다.

```bash
# macOS
brew install kind kubectl
# Linux (x86_64) — 최신 버전 번호는 kind 공식 문서에서 확인
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind
```

노드 3개(컨트롤 플레인 1 + 워커 2)짜리 설정 파일을 만듭니다.

```yaml
# kind-cka.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
```

```bash
kind create cluster --name cka --config kind-cka.yaml
kubectl get nodes
kind delete cluster --name cka      # 다 쓰면 지운다
```

> **kind 의 기본 CNI(kindnet)는 NetworkPolicy 를 강제하지 않습니다.** 네트워크 정책을 실제로 확인하려면 `networking.disableDefaultCNI: true` 로 만든 뒤 Calico 나 Cilium 을 설치하세요.

## 3. 가상머신 두 대에 kubeadm 으로 설치하기

시험장과 가장 비슷한 환경입니다. 가상머신은 Multipass, VirtualBox, UTM, 클라우드 VM 무엇이든 됩니다. Ubuntu 24.04, 각 2 vCPU · 4GB 메모리를 권장합니다. 여기서는 흐름만 잡고, 명령 하나하나의 의미는 **[kubeadm 으로 클러스터 만들기](/academy/cka/kubeadm-install/)** 강의에서 자세히 다룹니다.

```bash
# (Multipass 예시) 가상머신 두 대
multipass launch 24.04 --name cp  --cpus 2 --memory 4G --disk 20G
multipass launch 24.04 --name w1  --cpus 2 --memory 4G --disk 20G
multipass shell cp
```

두 노드 **모두**에서:

```bash
# 1) swap 끄기
sudo swapoff -a && sudo sed -i '/ swap / s/^/#/' /etc/fstab
# 2) 커널 모듈과 네트워크 설정
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay && sudo modprobe br_netfilter
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system
# 3) 컨테이너 런타임(containerd) — systemd cgroup 드라이버 사용
sudo apt-get update && sudo apt-get install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml >/dev/null
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
# 4) kubeadm·kubelet·kubectl — pkgs.k8s.io 저장소는 '마이너 버전마다' 따로 있다
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update && sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

> containerd 설정 파일의 모양은 버전에 따라 조금씩 다릅니다(containerd 2.x 는 경로와 섹션 이름이 바뀌었음). `SystemdCgroup` 줄이 없으면 공식 문서 "Container Runtimes" 의 해당 버전 안내를 따르세요.

컨트롤 플레인(cp)에서만:

```bash
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
mkdir -p $HOME/.kube && sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config && sudo chown $(id -u):$(id -g) $HOME/.kube/config
# CNI 설치(Calico 예시 — 최신 매니페스트 주소는 Calico 문서에서 확인)
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.30.3/manifests/calico.yaml
kubeadm token create --print-join-command     # 출력된 명령을 워커에서 sudo 로 실행
```

`kubectl get nodes` 에서 두 노드가 `Ready` 가 되면 완성입니다. 이 클러스터에서 **업그레이드, etcd 백업·복구, kubelet 고장 내고 고치기**를 한 번씩은 꼭 직접 해 보세요. 가상머신 스냅샷을 찍어 두면 망가뜨려도 되돌릴 수 있습니다.

## 4. 무료 온라인 실습장

설치가 부담스러우면 브라우저에서 진짜 클러스터를 잠깐 빌려 주는 서비스도 있습니다. [Killercoda](https://killercoda.com/) 의 쿠버네티스 놀이터는 무료로 노드 두 대짜리 클러스터를 한 시간 정도 줍니다. 시험을 사면 받는 [killer.sh](https://killer.sh/) 시뮬레이터는 실제 시험과 가장 비슷한 환경입니다.
