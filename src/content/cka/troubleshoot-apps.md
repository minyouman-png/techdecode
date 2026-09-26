---
title: 트러블슈팅 ① 애플리케이션
part: 6
order: 1
domain: trouble
minutes: 30
summary: 파드 STATUS 별 원인표와 조사 순서. get → describe(Events) → logs(--previous) → 고치기 → 확인. 디플로이먼트라면 ReplicaSet 이벤트까지.
goals:
  - 파드 상태만 보고 조사할 곳을 바로 고를 수 있다
  - describe 의 Events 와 logs --previous 로 원인을 찾을 수 있다
  - 불변 필드 때문에 파드를 다시 만들어야 하는 경우를 처리할 수 있다
labs: [t1, t2, t3, t10, t13]
quiz:
  - q: CrashLoopBackOff 인 파드의 '죽기 직전' 로그를 보는 명령은?
    options: ["kubectl logs pod", "kubectl logs pod --previous", "kubectl describe pod", "kubectl get events"]
    answer: 1
    explain: 재시작 뒤의 새 컨테이너는 로그가 거의 없을 수 있다. --previous(-p)는 직전에 죽은 컨테이너의 로그를 보여 준다.
  - q: 디플로이먼트의 레플리카는 3인데 파드가 하나도 없다. 파드가 없으니 describe pod 도 못 한다. 어디를 보나?
    options: ["노드", "ReplicaSet 의 describe(Events 의 FailedCreate)", "서비스", "kube-proxy"]
    answer: 1
    explain: 파드 생성이 거부되면(쿼터, 없는 ServiceAccount, PriorityClass 등) 이유가 ReplicaSet 이벤트에 남는다.
  - q: "Last State: Terminated, Reason: OOMKilled, Exit Code: 137 의 해결은?"
    options: ["이미지 교체", "메모리 limit 을 늘리거나 앱의 메모리 사용을 줄인다", "CPU limit 을 늘린다", "노드를 재부팅한다"]
    answer: 1
    explain: 137 = 128 + 9(SIGKILL). 메모리 한도 초과로 커널이 죽인 것이다.
  - q: 파드 STATUS 가 Pending 이고 describe 에 'didn't match Pod's node affinity/selector' 가 있다. 원인은?
    options: ["이미지 오타", "nodeSelector/affinity 에 맞는 노드가 없다(레이블 오타 등)", "메모리 부족", "DNS 장애"]
    answer: 1
    explain: 파드가 요구하는 노드 레이블과 실제 노드 레이블을 비교한다(kubectl get nodes --show-labels).
---

## 조사 순서 — 매번 같은 순서로

```bash
kubectl get pods -n <ns> -o wide              # ① 상태·재시작 수·노드
kubectl describe pod <파드> -n <ns>            # ② 맨 아래 Events ★
kubectl logs <파드> -n <ns> [-c 컨테이너]       # ③ 앱이 한 말
kubectl logs <파드> -n <ns> --previous         #    죽기 직전 로그(CrashLoop)
kubectl get events -n <ns> --sort-by=.lastTimestamp   # 전체 흐름
```

디플로이먼트라면 한 층 위도 봅니다.

```bash
kubectl describe deploy <이름>     # Conditions, 새·옛 ReplicaSet
kubectl describe rs <이름>         # FailedCreate — 파드가 아예 안 생기는 이유
kubectl rollout history deploy <이름>
```

## 상태별 원인표

| 증상 | 대표 원인 | 확인 | 해결 |
|---|---|---|---|
| **Pending**(노드 없음) | 자원 부족, nodeSelector·affinity 불일치, taint, PVC 미바인딩, cordon | Events 의 `FailedScheduling` 문장 | 요청량 줄이기, 레이블·toleration 고치기, PVC 고치기 |
| **Pending**(Events 없음) | 스케줄러 죽음 | `kubectl get pods -n kube-system` | [클러스터 트러블슈팅](/academy/cka/troubleshoot-cluster/) |
| **ContainerCreating** 오래 | 볼륨 마운트 실패(ConfigMap·Secret·PVC 없음), CNI 문제 | Events 의 `FailedMount` | 없는 것 만들기 |
| **ErrImagePull / ImagePullBackOff** | 이미지 이름·태그 오타, 비공개 레지스트리 인증 | Events 의 `Failed to pull image` | `kubectl set image`, imagePullSecrets |
| **CreateContainerConfigError** | env 로 참조한 ConfigMap·Secret·키 없음 | Events 의 `Error: configmap "…" not found` | 참조 대상 만들기 |
| **CrashLoopBackOff** | 앱 오류, 필수 설정(환경변수) 누락, 잘못된 command, liveness 실패 | `logs --previous`, describe 의 Last State | 원인 수정 |
| **OOMKilled**(Last State) | 메모리 limit 초과 | `Exit Code: 137` | limit 늘리기 |
| **Running 인데 READY 0/1** | readinessProbe 실패 | Events 의 `Readiness probe failed` | 프로브(포트·경로) 수정 |
| **Completed** 반복 | 할 일 없이 끝나는 명령(busybox) + restartPolicy Always | command 확인 | `sleep` 등 장기 실행 명령 |
| 파드가 **아예 없음** | 쿼터 초과, 없는 ServiceAccount·PriorityClass, 컨트롤러 매니저 장애 | `describe rs` | 원인 수정 |

## 고치는 방법 고르기

- **디플로이먼트의 템플릿** 문제 → 디플로이먼트를 고칩니다(`set image`, `set resources`, `edit`, `patch`). 파드는 롤아웃으로 알아서 바뀝니다.
- **혼자 있는 파드** 문제 → 대부분 필드는 못 고칩니다.

```bash
kubectl get pod mysql -o yaml > mysql.yaml     # (또는 edit 이 거절될 때 남긴 /tmp/kubectl-edit-….yaml)
vi mysql.yaml                                   # status·uid 등은 그대로 둬도 된다
kubectl replace --force -f mysql.yaml           # 지우고 다시 만든다
```

- **참조 대상이 없는** 문제(ConfigMap·Secret·PVC) → 문제에서 "파드 정의는 수정하지 말라"고 하면 **없는 것을 만들어** 줍니다. kubelet 이 곧 다시 시도합니다.

## 로그 다루기

```bash
kubectl logs web --tail=20
kubectl logs web -f                              # 따라가기(Ctrl+C)
kubectl logs web --since=10m
kubectl logs deploy/web                          # 디플로이먼트의 파드 하나
kubectl logs -l app=web --prefix                 # 레이블로 여러 파드
kubectl logs web --all-containers
kubectl logs web | grep ERROR > /opt/errors.log  # 문제에서 자주 요구
```

## 확인 없이 끝내지 않기

고친 뒤에는 **문제가 요구한 최종 상태**를 직접 확인합니다. 파드 `Running` 만 보지 말고 `READY 1/1`, 레플리카 수, 서비스 엔드포인트, 실제 응답(`wget`)까지. 채점은 최종 상태로 합니다.
