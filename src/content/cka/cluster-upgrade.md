---
title: 클러스터 업그레이드
part: 3
order: 2
domain: arch
minutes: 30
summary: 컨트롤 플레인 → 워커 순서, 한 번에 마이너 하나씩. drain → kubeadm → kubeadm upgrade → kubelet → uncordon 을 손에 익힌다.
goals:
  - 업그레이드 순서와 버전 차이 규칙을 설명할 수 있다
  - 컨트롤 플레인 노드를 kubeadm 으로 업그레이드할 수 있다
  - 워커 노드를 업그레이드할 수 있다(kubeadm upgrade node)
labs: [a5, a6]
quiz:
  - q: v1.34 클러스터를 v1.36 으로 올리는 올바른 방법은?
    options: ["바로 v1.36 으로", "v1.35 로 올린 뒤 v1.36 으로", "워커부터 v1.36 으로", "새 클러스터를 만들어야만 한다"]
    answer: 1
    explain: kubeadm 은 마이너 버전을 한 번에 하나씩만 올린다.
  - q: 워커 노드에서 실행하는 kubeadm 명령은?
    options: ["kubeadm upgrade apply v1.36.1", "kubeadm upgrade node", "kubeadm init", "kubeadm join --upgrade"]
    answer: 1
    explain: upgrade apply 는 첫 컨트롤 플레인에서 한 번. 워커(와 추가 컨트롤 플레인)는 upgrade node 로 로컬 kubelet 설정을 갱신한다.
  - q: "apt-get install kubeadm=1.36.1-1.1 이 'Held packages were changed' 로 실패한다. 해결은?"
    options: ["--force", "apt-mark unhold kubeadm 후 설치(또는 --allow-change-held-packages)", "재부팅", "kubeadm 을 삭제"]
    answer: 1
    explain: 설치 때 apt-mark hold 로 잠가 두었기 때문이다. unhold → 설치 → 다시 hold 가 정석이다.
  - q: kubelet 패키지를 새 버전으로 설치한 뒤 반드시 해야 하는 것은?
    options: ["아무것도", "systemctl daemon-reload && systemctl restart kubelet", "kubectl apply", "kubeadm reset"]
    answer: 1
    explain: 패키지를 바꿔도 이미 돌고 있는 kubelet 프로세스는 옛 버전이다. 재시작해야 새 버전이 돈다. kubectl get nodes 의 VERSION 이 바뀌는지 확인한다.
---

## 규칙 세 가지

1. **마이너 버전은 한 번에 하나씩**(1.35 → 1.36 → 1.37). 패치(1.35.1 → 1.35.2)는 건너뛰어도 된다.
2. **컨트롤 플레인 먼저, 워커는 나중에.** kubelet 은 API 서버보다 새 버전이면 안 된다(최대 3 마이너 낮은 것까지 허용).
3. **노드는 하나씩**: 비우고(drain) → 올리고 → 되돌린다(uncordon).

## 컨트롤 플레인 업그레이드

```bash
# 0) 어디까지 올릴지 확인 — 저장소가 새 마이너(v1.36)를 가리키는지
cat /etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-cache madison kubeadm           # 1.36.1-1.1 같은 정확한 버전 문자열

# 1) 노드 비우기 (controlplane 셸에서)
kubectl drain controlplane --ignore-daemonsets

# 2) kubeadm 먼저 올리기
apt-mark unhold kubeadm
apt-get install -y kubeadm='1.36.1-1.1'
apt-mark hold kubeadm
kubeadm version

# 3) 계획 보고 적용
kubeadm upgrade plan
kubeadm upgrade apply v1.36.1       # 확인 질문에 y (또는 -y)

# 4) kubelet · kubectl 올리고 재시작
apt-mark unhold kubelet kubectl
apt-get install -y kubelet='1.36.1-1.1' kubectl='1.36.1-1.1'
apt-mark hold kubelet kubectl
systemctl daemon-reload
systemctl restart kubelet

# 5) 되돌리기
kubectl uncordon controlplane
kubectl get nodes                   # VERSION v1.36.1 확인
```

`kubeadm upgrade apply` 는 static pod 매니페스트의 이미지를 새 버전으로 바꾸고(apiserver, controller-manager, scheduler), kube-proxy·CoreDNS 애드온도 올리고, 인증서도 갱신합니다.

## 워커 업그레이드

```bash
# 컨트롤 플레인 셸에서 비우기
kubectl drain node01 --ignore-daemonsets

# 워커로 이동
ssh node01
apt-get update
apt-mark unhold kubeadm && apt-get install -y kubeadm='1.36.1-1.1' && apt-mark hold kubeadm
kubeadm upgrade node                         # ★ apply 가 아니라 node
apt-mark unhold kubelet && apt-get install -y kubelet='1.36.1-1.1' && apt-mark hold kubelet
systemctl daemon-reload && systemctl restart kubelet
exit

# 다시 컨트롤 플레인에서
kubectl uncordon node01
kubectl get nodes
```

> **어디서 무엇을 하는지** 헷갈리지 마세요. `kubectl drain/uncordon` 은 kubeconfig 가 있는 곳(컨트롤 플레인)에서, `apt`·`kubeadm upgrade node`·`systemctl` 은 **그 노드에서** 합니다.

## 문제가 생기면

| 증상 | 원인 · 해결 |
|---|---|
| `E: Held packages were changed` | `apt-mark unhold` 를 안 했다 |
| `E: Version '1.36.1-1.1' for 'kubeadm' was not found` | 저장소가 옛 마이너를 가리킴 → sources.list 수정 후 `apt-get update` |
| `Specified version … is higher than the kubeadm version` | kubeadm 패키지를 먼저 올리지 않았다 |
| 노드 VERSION 이 그대로 | kubelet 재시작을 안 했다 |
| drain 이 멈춤/거부 | DaemonSet 파드 → `--ignore-daemonsets`, 컨트롤러 없는 파드 → `--force`, emptyDir → `--delete-emptydir-data`, PodDisruptionBudget 이 막는지 확인 |

## 인증서 수명 관리

kubeadm 이 만든 클라이언트·서버 인증서는 **1년** 유효합니다(CA 는 10년). 업그레이드하면 자동 갱신되지만, 수동으로도 봅니다.

```bash
kubeadm certs check-expiration
kubeadm certs renew all        # 그다음 컨트롤 플레인 static pod 들을 재시작해야 반영
```
