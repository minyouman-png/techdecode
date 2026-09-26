---
title: 리소스 · 프로브 · 쿼터 — 자가 치유하는 앱
part: 2
order: 4
domain: workloads
minutes: 25
summary: requests 와 limits, QoS, LimitRange 와 ResourceQuota, 그리고 livenessProbe · readinessProbe · startupProbe 로 스스로 회복하는 앱 만들기.
goals:
  - requests 와 limits 의 차이와 각각이 스케줄링·실행에 미치는 영향을 안다
  - ResourceQuota · LimitRange 가 걸린 네임스페이스에서 파드를 만들 수 있다
  - 세 종류의 프로브를 구분해 설정할 수 있다
labs: [w6, t8, t10]
quiz:
  - q: 스케줄러가 노드를 고를 때 보는 값은?
    options: ["limits", "requests", "실제 사용량", "노드의 빈 디스크"]
    answer: 1
    explain: 스케줄러는 requests 의 합이 노드의 allocatable 을 넘지 않는 노드를 고른다. 실제 사용량은 보지 않는다.
  - q: 컨테이너가 메모리 limit 을 넘으면?
    options: ["느려진다", "OOMKilled 로 종료된다", "다른 노드로 옮겨진다", "limit 이 자동으로 늘어난다"]
    answer: 1
    explain: 메모리는 압축할 수 없는 자원이라 한도를 넘으면 커널이 프로세스를 죽인다(종료 코드 137). CPU 는 한도를 넘으면 스로틀링(느려짐)될 뿐이다.
  - q: readinessProbe 가 실패하면?
    options: ["컨테이너를 재시작한다", "서비스 엔드포인트에서 빠진다(트래픽을 안 받음)", "파드를 지운다", "노드를 NotReady 로 만든다"]
    answer: 1
    explain: 준비성 검사가 실패하면 READY 0/1 이 되고 서비스 엔드포인트에서 제외된다. 재시작하는 것은 livenessProbe 다.
  - q: "ResourceQuota 에 requests.cpu 가 걸린 네임스페이스에서 resources 없이 파드를 만들면?"
    options: ["기본값으로 만들어진다", "must specify requests.cpu 오류로 거절된다", "Pending 이 된다", "다른 네임스페이스에 만들어진다"]
    answer: 1
    explain: 쿼터가 cpu 요청을 제한하면 모든 파드가 그 값을 명시해야 한다. LimitRange 로 기본값을 주면 자동으로 채워진다.
---

## requests 와 limits

```yaml
resources:
  requests:        # 최소 보장 — 스케줄러가 보는 값
    cpu: 100m      # 0.1 코어 (1000m = 1코어)
    memory: 128Mi
  limits:          # 최대 한도 — 실행 중에 강제
    cpu: 200m
    memory: 256Mi
```

| | requests | limits |
|---|---|---|
| 누가 쓰나 | 스케줄러(배치 결정) | kubelet/커널(실행 중 제한) |
| 넘으면 | — | CPU: 느려짐(스로틀) / 메모리: **OOMKilled** |
| 없으면 | 0 으로 보고 어디든 배치 | 무제한 |

노드에 자리가 없으면(요청 합계 초과) 파드는 `Pending` 이 되고 describe 에 `Insufficient cpu` / `Insufficient memory` 가 뜹니다. `kubectl describe node` 의 **Allocated resources** 로 남은 양을 봅니다.

```bash
kubectl set resources deployment web --requests=cpu=100m,memory=128Mi --limits=cpu=200m,memory=256Mi
```

### QoS 클래스

| 클래스 | 조건 | 노드가 메모리 부족할 때 |
|---|---|---|
| Guaranteed | 모든 컨테이너가 cpu·memory 모두 requests = limits | 가장 늦게 쫓겨남 |
| Burstable | 일부만 설정 | 중간 |
| BestEffort | 아무것도 설정 안 함 | 가장 먼저 쫓겨남 |

## 네임스페이스 단위 제한: ResourceQuota · LimitRange

**ResourceQuota** — 네임스페이스 전체의 합계를 제한합니다.

```bash
kubectl create quota compute --hard=requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi,pods=10 -n dev
kubectl describe quota -n dev        # 사용량/한도
```

쿼터가 `requests.cpu` 나 `limits.memory` 를 제한하면, 그 네임스페이스의 **모든 파드가 해당 값을 반드시 적어야** 합니다. 안 적으면 `must specify limits.cpu…` 로 거절됩니다. 디플로이먼트라면 파드가 안 생기고 **ReplicaSet 의 이벤트**(`kubectl describe rs`)에 `FailedCreate` 가 남습니다 — 디플로이먼트만 보면 이유를 못 찾습니다.

**LimitRange** — 컨테이너 하나의 기본값·최소·최대를 정합니다. 기본값이 있으면 resources 를 안 적은 파드에도 자동으로 채워져 쿼터를 통과합니다.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: defaults
  namespace: dev
spec:
  limits:
  - type: Container
    default:           # limits 기본값
      cpu: 500m
      memory: 256Mi
    defaultRequest:    # requests 기본값
      cpu: 100m
      memory: 128Mi
    max:
      memory: 1Gi
```

## 프로브 — 쿠버네티스가 앱 상태를 묻는 방법

| 프로브 | 질문 | 실패하면 |
|---|---|---|
| **livenessProbe** | 살아 있나? | 컨테이너 **재시작** |
| **readinessProbe** | 트래픽 받을 준비됐나? | 서비스 엔드포인트에서 **제외**(READY 0/1) |
| **startupProbe** | 다 떴나?(느리게 시작하는 앱) | 성공할 때까지 나머지 프로브 보류, 끝내 실패하면 재시작 |

```yaml
containers:
- name: web
  image: nginx:1.27
  ports:
  - containerPort: 80
  readinessProbe:
    httpGet:
      path: /
      port: 80
    initialDelaySeconds: 3
    periodSeconds: 5
  livenessProbe:
    tcpSocket:
      port: 80
    periodSeconds: 10
    failureThreshold: 3
  startupProbe:
    exec:
      command: ["cat", "/tmp/started"]
    failureThreshold: 30
    periodSeconds: 5
```

검사 방식은 세 가지 — `httpGet`(200~399 이면 성공), `tcpSocket`(포트 열림), `exec`(종료 코드 0). gRPC 도 있습니다.

> **흔한 고장**: 프로브의 **포트가 틀림**. 앱은 80 에서 듣는데 프로브가 8080 을 두드리면, readiness 는 영원히 준비 안 됨(서비스가 비어 있음), liveness 는 무한 재시작입니다. `describe` 의 `Readiness probe failed: … connection refused` 를 보면 바로 압니다.

## OOMKilled 진단

```bash
kubectl get pods                         # RESTARTS 가 늘고 CrashLoopBackOff
kubectl describe pod memhog | grep -A4 "Last State"
#    Last State:     Terminated
#      Reason:       OOMKilled
#      Exit Code:    137
kubectl set resources deployment memhog --limits=memory=256Mi
```
