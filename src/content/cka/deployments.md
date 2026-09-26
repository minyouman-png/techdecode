---
title: 디플로이먼트 — 롤링 업데이트와 롤백
part: 2
order: 2
domain: workloads
minutes: 25
summary: Deployment → ReplicaSet → Pod 의 사슬. 스케일, 이미지 업데이트, 롤아웃 상태·이력·롤백, 전략(RollingUpdate·Recreate).
goals:
  - Deployment 를 만들고 스케일·이미지 업데이트를 할 수 있다
  - 롤아웃 상태·이력을 읽고 특정 리비전으로 롤백할 수 있다
  - maxSurge · maxUnavailable 이 업데이트에 어떤 영향을 주는지 안다
labs: [w1, w2, w3]
quiz:
  - q: 디플로이먼트의 이미지를 바꾸면 내부에서 일어나는 일은?
    options: ["기존 파드의 이미지가 제자리에서 바뀐다", "새 ReplicaSet 이 생기고 점진적으로 새 파드로 교체된다", "디플로이먼트가 지워지고 다시 만들어진다", "아무 일도 없다"]
    answer: 1
    explain: 파드 템플릿이 바뀌면 새 ReplicaSet 이 만들어진다. RollingUpdate 전략은 새 RS 를 늘리고 옛 RS 를 줄여 가며 교체한다. 옛 RS 는 롤백을 위해 0개로 남는다.
  - q: 직전 리비전으로 되돌리는 명령은?
    options: ["kubectl rollout undo deployment web", "kubectl rollback web", "kubectl rollout restart deployment web", "kubectl apply --previous"]
    answer: 0
    explain: rollout undo 는 직전 리비전으로, --to-revision=N 은 특정 리비전으로 되돌린다. restart 는 같은 템플릿으로 파드만 새로 만든다.
  - q: 레플리카 4, maxSurge 25%, maxUnavailable 25% 일 때 업데이트 중 파드 수 범위는?
    options: ["3~5개", "4개 고정", "0~8개", "2~6개"]
    answer: 0
    explain: maxSurge 25%(=1) 이므로 최대 5개까지, maxUnavailable 25%(=1) 이므로 최소 3개는 사용 가능해야 한다.
  - q: 모든 파드를 한꺼번에 내리고 새로 올리는 전략은?
    options: ["RollingUpdate", "Recreate", "BlueGreen", "Canary"]
    answer: 1
    explain: strategy.type Recreate 는 옛 파드를 모두 지운 뒤 새 파드를 만든다. 잠깐 중단이 생기지만 두 버전이 동시에 뜨면 안 되는 앱에 쓴다. BlueGreen·Canary 는 쿠버네티스 내장 전략이 아니다.
---

## 사슬 구조

```
Deployment  web            (원하는 상태: 템플릿 + 레플리카 3)
  └─ ReplicaSet web-7c9f8d6b4   (이 템플릿으로 파드 3개 유지)
       ├─ Pod web-7c9f8d6b4-2xk8q
       ├─ Pod web-7c9f8d6b4-9mzp5
       └─ Pod web-7c9f8d6b4-tq4lw
```

파드를 직접 만들지 않고 Deployment 를 쓰는 이유는 **자가 치유**와 **무중단 업데이트** 때문입니다. 파드를 지우면 ReplicaSet 이 곧 새로 만들고, 노드가 죽으면 다른 노드에 다시 만듭니다.

```bash
kubectl create deployment web --image=nginx:1.26 --replicas=3
kubectl get deploy,rs,pods -l app=web
kubectl scale deployment web --replicas=5
```

## 이미지 업데이트와 롤아웃

```bash
kubectl set image deployment/web nginx=nginx:1.27     # 컨테이너이름=새이미지
kubectl rollout status deployment web                 # 끝날 때까지 지켜보기
kubectl rollout history deployment web                # 리비전 목록
kubectl rollout history deployment web --revision=2   # 그 리비전의 템플릿
```

컨테이너 이름을 모르면 `kubectl get deploy web -o jsonpath='{.spec.template.spec.containers[*].name}'`. `kubectl create deployment` 로 만들었다면 이미지 이름(`nginx`)이 컨테이너 이름입니다.

### 변경 사유(CHANGE-CAUSE) 남기기

`rollout history` 의 CHANGE-CAUSE 는 **`kubernetes.io/change-cause` 어노테이션**에서 옵니다.

```bash
kubectl annotate deployment web kubernetes.io/change-cause="upgrade to 1.27"
```

`--record` 플래그로도 남길 수 있었지만 폐지 예정(deprecated)이니 어노테이션 방식을 쓰세요.

## 롤백

새 이미지에 오타가 있으면 새 파드가 `ImagePullBackOff` 에 걸리고, 롤링 업데이트는 **중간에서 멈춥니다**(옛 파드는 대부분 살아 있음 — 이것이 RollingUpdate 의 안전장치).

```bash
kubectl rollout status deployment web
# Waiting for deployment "web" rollout to finish: 1 out of 3 new replicas have been updated...
kubectl rollout undo deployment web                    # 직전으로
kubectl rollout undo deployment web --to-revision=1    # 특정 리비전으로
```

> 롤백하면 옛 템플릿이 **새 리비전 번호**를 받습니다. 리비전 1, 2 에서 1 로 롤백하면 이력은 2, 3 이 되고 현재는 3 입니다. "현재 리비전을 적어라" 같은 문제에서 자주 틀립니다.

## 업데이트 전략

```yaml
spec:
  strategy:
    type: RollingUpdate          # 기본
    rollingUpdate:
      maxSurge: 25%              # 원하는 개수보다 최대 몇 개 더(올림)
      maxUnavailable: 25%        # 원하는 개수보다 최대 몇 개 모자라게(내림)
  # 또는
  strategy:
    type: Recreate               # 전부 내리고 새로 올린다
```

- `maxSurge: 0, maxUnavailable: 1` → 하나씩 내리고 올린다(자원이 빠듯할 때)
- `maxSurge: 1, maxUnavailable: 0` → 하나 더 띄운 뒤 하나 내린다(무중단 우선)

## 그 밖의 조작

```bash
kubectl rollout restart deployment web    # 템플릿 그대로, 파드만 새로(설정 다시 읽기 등)
kubectl rollout pause deployment web      # 여러 변경을 모아서 한 번에 롤아웃
kubectl rollout resume deployment web
```

## ReplicaSet · StatefulSet · DaemonSet 차이

| 종류 | 용도 |
|---|---|
| Deployment | 상태 없는 앱. 파드는 서로 바꿔 써도 됨 |
| StatefulSet | 순서·고정 이름(web-0, web-1)·파드마다 고유 볼륨이 필요한 DB 등 |
| DaemonSet | **노드마다 하나씩**(로그 수집기, 모니터링 에이전트, CNI) — [스케줄링](/academy/cka/scheduling/) 강의 |
| Job / CronJob | 한 번 / 주기적으로 실행하고 끝나는 작업 — [오토스케일링·Job](/academy/cka/autoscaling-jobs/) 강의 |
