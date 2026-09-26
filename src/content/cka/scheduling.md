---
title: 스케줄링 — 파드를 원하는 노드에
part: 2
order: 5
domain: workloads
minutes: 30
summary: nodeName · nodeSelector · nodeAffinity, taint 와 toleration, 파드 affinity, DaemonSet, static pod, PriorityClass.
goals:
  - nodeSelector 와 nodeAffinity 로 특정 노드에 파드를 배치할 수 있다
  - taint 와 toleration 의 관계("들어갈 수 있다" ≠ "반드시 간다")를 설명할 수 있다
  - DaemonSet 과 static pod 을 만들 수 있다
  - FailedScheduling 메시지를 읽고 원인을 찾을 수 있다
labs: [w8, w9, w10, w12, w13]
quiz:
  - q: 노드에 taint 가 있을 때 toleration 을 가진 파드에 대해 맞는 것은?
    options: ["반드시 그 노드에 배치된다", "그 노드에 배치될 수도 있게 된다(허용)", "그 노드에만 배치되지 않는다", "taint 가 사라진다"]
    answer: 1
    explain: toleration 은 '견딜 수 있다'는 허가일 뿐이다. 특정 노드에 반드시 보내려면 nodeSelector 나 nodeAffinity 를 함께 쓴다.
  - q: "컨트롤 플레인 노드에 일반 파드가 뜨지 않는 이유는?"
    options: ["컨트롤 플레인엔 kubelet 이 없어서", "node-role.kubernetes.io/control-plane:NoSchedule taint 때문", "CPU 가 부족해서", "보안상 불가능해서"]
    answer: 1
    explain: kubeadm 은 컨트롤 플레인 노드에 NoSchedule taint 를 건다. 이를 견디는 toleration 을 가진 파드(예. CNI DaemonSet)만 뜬다.
  - q: taint effect 중 이미 떠 있는 파드까지 쫓아내는 것은?
    options: ["NoSchedule", "PreferNoSchedule", "NoExecute", "Evict"]
    answer: 2
    explain: NoExecute 는 새 파드를 막을 뿐 아니라 toleration 이 없는 기존 파드도 내보낸다.
  - q: 워커 노드 node01 에 static pod 을 만들려면?
    options: ["controlplane 의 /etc/kubernetes/manifests 에 둔다", "node01 에 ssh 해서 kubelet 의 staticPodPath 에 매니페스트를 둔다", "kubectl apply --static", "DaemonSet 을 만든다"]
    answer: 1
    explain: static pod 은 해당 노드의 kubelet 이 자기 staticPodPath 를 읽어 띄운다. 그 노드에 파일이 있어야 한다.
---

## 스케줄러가 노드를 고르는 과정

1. **거르기(Filter)** — 조건에 안 맞는 노드를 뺀다: 자원 부족, nodeSelector 불일치, 견디지 못하는 taint, cordon, 볼륨 제약 …
2. **점수(Score)** — 남은 노드에 점수를 매겨 가장 좋은 곳에 둔다(선호 affinity, 고른 분산 등).

남는 노드가 없으면 파드는 `Pending` 이고 이벤트에 이유가 나옵니다.

```
0/3 nodes are available: 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: },
2 node(s) didn't match Pod's node affinity/selector.
```

이 문장을 **끝까지 읽는 것**이 스케줄링 트러블슈팅의 전부입니다.

## 노드 고르기 네 가지

**① nodeName** — 스케줄러를 건너뛰고 노드를 직접 지정(가장 강제적, 조건 검사 없음).

**② nodeSelector** — 노드 레이블이 일치하는 곳에만.

```bash
kubectl label node node02 disktype=ssd
kubectl get nodes -L disktype          # 레이블을 열로
```
```yaml
spec:
  nodeSelector:
    disktype: ssd
```

**③ nodeAffinity** — 더 풍부한 조건(In, NotIn, Exists, Gt …)과 "꼭"/"되도록".

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:      # 꼭
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype
            operator: In
            values: [ssd, nvme]
      preferredDuringSchedulingIgnoredDuringExecution:     # 되도록
      - weight: 50
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values: [a]
```

문서에서 "Assign Pods to Nodes using Node Affinity" 를 검색하면 이 예제가 그대로 있습니다. **외우지 말고 가져다 고치세요.**

**④ podAffinity / podAntiAffinity** — 다른 **파드**의 위치 기준. "캐시 파드와 같은 노드에", "같은 앱 파드끼리 다른 노드에".

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: web
        topologyKey: kubernetes.io/hostname     # '노드' 단위로 떨어뜨려라
```

## taint 와 toleration

노드 쪽의 **밀어내기**(taint) + 파드 쪽의 **견디기**(toleration).

```bash
kubectl taint node node01 dedicated=gpu:NoSchedule        # 걸기
kubectl taint node node01 dedicated=gpu:NoSchedule-       # 풀기(끝에 -)
kubectl describe node node01 | grep -i taint
```

| effect | 새 파드 | 이미 있는 파드 |
|---|---|---|
| NoSchedule | 못 들어옴 | 그대로 |
| PreferNoSchedule | 되도록 안 들어옴 | 그대로 |
| NoExecute | 못 들어옴 | **쫓겨남** |

```yaml
spec:
  tolerations:
  - key: dedicated
    operator: Equal       # 값까지 일치(기본)
    value: gpu
    effect: NoSchedule
  - key: node-role.kubernetes.io/control-plane
    operator: Exists      # 값 무관
    effect: NoSchedule
```

> **toleration 은 입장권일 뿐 배정표가 아닙니다.** "GPU 노드에서만 돌게 하라"는 문제는 toleration(들어갈 수 있게) + nodeSelector/affinity(거기로 가게) **둘 다** 필요합니다.

## DaemonSet — 노드마다 하나

로그 수집기, 모니터링 에이전트, CNI 처럼 **모든(또는 특정) 노드에 하나씩** 떠야 하는 것.

`kubectl create daemonset` 은 없습니다. 디플로이먼트 뼈대에서 바꿉니다.

```bash
kubectl create deployment agent --image=busybox:1.37 $do > ds.yaml
# kind: Deployment → DaemonSet, replicas · strategy · status 줄 삭제
```

컨트롤 플레인 노드에도 띄우려면 control-plane taint 를 견디는 toleration 을 넣습니다.

## static pod

API 서버가 아니라 **노드의 kubelet 이 직접** 띄우는 파드. 컨트롤 플레인 부품이 이렇게 돕니다([아키텍처](/academy/cka/k8s-architecture/) 강의).

```bash
ssh node01
grep staticPodPath /var/lib/kubelet/config.yaml      # 보통 /etc/kubernetes/manifests
kubectl run static-web --image=nginx:1.27 $do > /etc/kubernetes/manifests/static-web.yaml
exit
kubectl get pods -o wide        # static-web-node01 (이름 뒤에 노드 이름이 붙는다)
```

지우려면 **그 노드에서 파일을 지웁니다.** `kubectl delete pod` 로 지워도 곧 다시 생깁니다.

## cordon · drain

```bash
kubectl cordon node01      # 새 파드 금지(기존 파드는 그대로)
kubectl uncordon node01
kubectl drain node01 --ignore-daemonsets --delete-emptydir-data   # 비우기(유지보수)
```

drain 은 자세히 [노드 유지보수](/academy/cka/troubleshoot-cluster/)에서 다룹니다.

## PriorityClass

자원이 모자랄 때 **누구를 먼저** 배치할지(높은 우선순위는 낮은 것을 밀어낼 수 있음).

```bash
kubectl create priorityclass high-priority --value=100000 --description="중요 서비스"
```
```yaml
spec:
  priorityClassName: high-priority
```
