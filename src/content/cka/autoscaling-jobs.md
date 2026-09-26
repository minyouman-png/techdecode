---
title: 오토스케일링 · Job · CronJob
part: 2
order: 6
domain: workloads
minutes: 20
summary: HorizontalPodAutoscaler 로 부하에 따라 파드 수 조절, metrics-server, 한 번 도는 Job 과 주기적인 CronJob.
goals:
  - HPA 를 명령형·선언형으로 만들 수 있다
  - HPA 가 동작하려면 무엇(metrics-server, requests)이 필요한지 안다
  - Job 의 completions · parallelism · backoffLimit 과 CronJob 스케줄을 쓸 수 있다
labs: [w7, w11]
quiz:
  - q: HPA 가 CPU 사용률을 계산하는 기준은?
    options: ["limits 대비", "requests 대비", "노드 전체 CPU 대비", "절대값(밀리코어)"]
    answer: 1
    explain: averageUtilization 은 파드 requests 대비 비율이다. requests 가 없으면 사용률을 계산하지 못해 TARGETS 가 <unknown> 이 된다.
  - q: "`kubectl top pods` 가 `Metrics API not available` 을 낸다. 원인은?"
    options: ["kubelet 이 죽었다", "metrics-server 가 없거나 동작하지 않는다", "HPA 가 없다", "네임스페이스가 틀렸다"]
    answer: 1
    explain: kubectl top 과 HPA 의 자원 지표는 metrics-server 가 제공하는 Metrics API 를 쓴다.
  - q: "CronJob 스케줄 `*/15 * * * *` 의 뜻은?"
    options: ["15시에 한 번", "15분마다", "매월 15일", "15초마다"]
    answer: 1
    explain: 크론 형식은 분 시 일 월 요일. 첫 칸의 */15 는 15분마다다.
  - q: Job 의 파드 템플릿에 허용되는 restartPolicy 는?
    options: ["Always", "Never 또는 OnFailure", "아무거나", "Always 만"]
    answer: 1
    explain: Job 은 끝나야 하는 작업이라 Always 는 허용되지 않는다. kubectl create job 은 Never 를 쓴다.
---

## HorizontalPodAutoscaler(HPA)

부하에 따라 **파드 개수**를 자동으로 늘리고 줄입니다.

```bash
kubectl autoscale deployment web --min=2 --max=6 --cpu-percent=70
kubectl get hpa
# NAME  REFERENCE        TARGETS       MINPODS  MAXPODS  REPLICAS
# web   Deployment/web   cpu: 12%/70%  2        6        2
```

선언형(autoscaling/v2):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 6
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:                         # 선택: 줄일 때 천천히
    scaleDown:
      stabilizationWindowSeconds: 300
```

HPA 가 동작하려면 **두 가지**가 필요합니다.

1. **metrics-server** — 노드·파드의 CPU·메모리 사용량을 모아 Metrics API 로 제공. `kubectl top` 도 이것을 씁니다.
2. 대상 파드의 **resources.requests** — 사용률(%)은 requests 대비로 계산합니다. 없으면 TARGETS 가 `<unknown>`.

```bash
kubectl top nodes
kubectl top pods -A --sort-by=cpu
kubectl top pods -n batch -l app=worker --sort-by=memory
```

> 파드 **크기**를 바꾸는 VerticalPodAutoscaler(VPA)는 별도 설치가 필요한 부가 기능입니다. 교과과정의 "workload autoscaling"은 HPA 를 중심으로 준비하면 됩니다.

## Job — 한 번 실행하고 끝나는 작업

```bash
kubectl create job pi --image=perl:5.40 -- perl -Mbignum=bpi -wle 'print bpi(100)'
kubectl get jobs
kubectl logs job/pi
```

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-work
spec:
  completions: 5          # 성공해야 하는 총 횟수
  parallelism: 2          # 동시에 돌 파드 수
  backoffLimit: 4         # 실패 재시도 한도
  activeDeadlineSeconds: 600   # 전체 제한 시간
  ttlSecondsAfterFinished: 3600 # 끝나고 이만큼 뒤 자동 삭제
  template:
    spec:
      restartPolicy: Never      # Never 또는 OnFailure (Always 불가)
      containers:
      - name: work
        image: busybox:1.37
        command: ["sh", "-c", "echo working; sleep 5"]
```

## CronJob — 주기적으로

```bash
kubectl create cronjob backup --image=busybox:1.37 --schedule="*/30 * * * *" -- sh -c "echo backup done"
kubectl create job backup-manual --from=cronjob/backup     # 지금 한 번 실행
```

크론 형식: `분 시 일 월 요일`

| 식 | 뜻 |
|---|---|
| `*/5 * * * *` | 5분마다 |
| `0 2 * * *` | 매일 02:00 |
| `0 9 * * 1-5` | 평일 09:00 |
| `30 0 1 * *` | 매월 1일 00:30 |

명령형 플래그가 없는 필드는 dry-run YAML 에서 넣습니다.

```yaml
spec:
  schedule: "*/30 * * * *"
  successfulJobsHistoryLimit: 2     # 성공한 Job 기록 개수
  failedJobsHistoryLimit: 1
  concurrencyPolicy: Forbid         # 앞 Job 이 안 끝났으면 건너뛰기(Allow·Replace)
  startingDeadlineSeconds: 60
  suspend: false
  timeZone: Asia/Seoul              # 선택
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers: …
```

> 스케줄 문자열은 `*` 로 시작하므로 YAML 에서 **따옴표**로 감싸야 합니다.
