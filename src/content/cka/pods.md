---
title: 파드 — 가장 작은 실행 단위
part: 2
order: 1
domain: workloads
minutes: 25
summary: 컨테이너를 감싸는 파드, command 와 args, 환경변수, 여러 컨테이너(사이드카·init), 재시작 정책과 파드 상태.
goals:
  - 파드 매니페스트의 핵심 필드(containers · command · args · env · ports)를 쓸 수 있다
  - 멀티 컨테이너 파드와 공유 볼륨, init 컨테이너·사이드카를 구성할 수 있다
  - 파드 STATUS 값(Pending·ContainerCreating·CrashLoopBackOff 등)의 뜻을 안다
labs: [w5, b3]
quiz:
  - q: 컨테이너 이미지의 ENTRYPOINT 를 덮어쓰는 파드 필드는?
    options: ["args", "command", "entrypoint", "exec"]
    answer: 1
    explain: command 는 ENTRYPOINT 를, args 는 CMD 를 덮어쓴다. kubectl run x --image=busybox -- sleep 10 은 args 를, --command -- sleep 10 은 command 를 채운다.
  - q: 같은 파드 안의 두 컨테이너가 파일을 주고받으려면?
    options: ["각자 hostPath 를 쓴다", "같은 볼륨(emptyDir 등)을 둘 다 마운트한다", "서비스를 만든다", "불가능하다"]
    answer: 1
    explain: 파드의 볼륨은 파드 단위로 정의되고 여러 컨테이너가 함께 마운트할 수 있다. emptyDir 은 파드가 사는 동안만 있는 임시 공유 공간이다.
  - q: init 컨테이너의 특징은?
    options: ["메인 컨테이너와 동시에 계속 돈다", "메인 컨테이너보다 먼저, 순서대로 실행되고 끝나야 한다", "노드마다 하나씩 뜬다", "실패해도 무시된다"]
    answer: 1
    explain: init 컨테이너는 순서대로 하나씩 실행되어 성공적으로 끝나야 메인 컨테이너가 시작된다. 실패하면 파드는 Init:Error / Init:CrashLoopBackOff 가 된다.
  - q: "busybox 이미지로 명령 없이 파드를 만들면 STATUS 가 CrashLoopBackOff 가 되는 이유는?"
    options: ["이미지가 없어서", "기본 명령(sh)이 바로 끝나는데 restartPolicy 가 Always 라 계속 재시작하므로", "메모리 부족", "포트 충돌"]
    answer: 1
    explain: busybox 기본 명령은 할 일이 없어 즉시 끝난다. 파드의 기본 재시작 정책은 Always 라 끝난 컨테이너를 계속 다시 띄우고, 반복되면 백오프가 걸린다. sleep 3600 같은 명령을 준다.
---

## 파드는 컨테이너의 포장지

쿠버네티스는 컨테이너를 직접 다루지 않고 **파드**를 다룹니다. 파드 하나에는 컨테이너가 하나 이상 들어가고, 같은 파드의 컨테이너들은

- **같은 네트워크**(같은 IP, `localhost` 로 서로 접근),
- **같은 볼륨**(파드에 정의한 볼륨을 함께 마운트)

을 씁니다. 그리고 항상 **같은 노드**에서 함께 뜨고 함께 사라집니다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
spec:
  containers:
  - name: web
    image: nginx:1.27
    ports:
    - containerPort: 80        # 정보 표시용(없어도 통신은 된다)
    env:
    - name: MODE
      value: prod
```

## command 와 args

| 파드 필드 | 덮어쓰는 것(Dockerfile) | kubectl run |
|---|---|---|
| `command` | ENTRYPOINT | `--command -- sleep 3600` |
| `args` | CMD | `-- sleep 3600` |

```yaml
command: ["sh", "-c", "echo start; sleep 3600"]
# 또는
command: ["sleep"]
args: ["3600"]
```

셸 문법(`;`, `&&`, `$(date)`, 반복문)을 쓰려면 반드시 `sh -c "…"` 로 감쌉니다.

## 여러 컨테이너: 사이드카와 init 컨테이너

**사이드카**는 메인 컨테이너 옆에서 함께 도는 보조 컨테이너입니다. 로그 수집, 프록시, 설정 동기화 등. 공유 볼륨이 핵심입니다.

```yaml
spec:
  containers:
  - name: app
    image: busybox:1.37
    command: ["sh", "-c", "while true; do date >> /var/log/app.log; sleep 5; done"]
    volumeMounts:
    - name: logs
      mountPath: /var/log
  - name: sidecar
    image: busybox:1.37
    command: ["sh", "-c", "tail -f /var/log/app.log"]
    volumeMounts:
    - name: logs
      mountPath: /var/log
  volumes:
  - name: logs
    emptyDir: {}
```

```bash
kubectl logs web -c sidecar      # 컨테이너가 여럿이면 -c 로 지정
```

**init 컨테이너**는 메인 컨테이너보다 **먼저, 순서대로** 실행되어 **끝나야** 합니다. "DB 가 준비될 때까지 기다리기", "설정 파일 내려받기" 같은 준비 작업에 씁니다.

```yaml
spec:
  initContainers:
  - name: wait-db
    image: busybox:1.37
    command: ["sh", "-c", "until nslookup db-svc; do sleep 2; done"]
  containers:
  - name: app
    image: nginx:1.27
```

> 쿠버네티스 1.29 부터는 **네이티브 사이드카**도 있습니다. `initContainers` 에 `restartPolicy: Always` 를 준 컨테이너는 끝나지 않고 메인 컨테이너와 함께 돌며, 메인보다 먼저 시작하고 나중에 종료됩니다. 교과과정의 "sidecar" 문제는 두 방식 모두 가능하니 지시문이 요구하는 방식을 따르세요.

## 재시작 정책

`spec.restartPolicy`: `Always`(기본) · `OnFailure` · `Never`. 파드 전체에 적용됩니다.

- 계속 돌아야 하는 서버 → `Always`
- 한 번 실행하고 끝나는 작업(Job) → `Never` 또는 `OnFailure`

## 파드 상태 읽기

| STATUS | 뜻 | 먼저 볼 곳 |
|---|---|---|
| `Pending` | 아직 노드에 배정되지 않음 | `describe` → FailedScheduling 이유 |
| `ContainerCreating` | 노드는 정해짐, 컨테이너 준비 중 | 볼륨 마운트, CNI |
| `Running` | 컨테이너 실행 중 | READY 가 `0/1` 이면 준비성 검사 실패 |
| `Completed` | 정상 종료(종료 코드 0) | 정상(Job 등) |
| `Error` | 비정상 종료 | `logs` |
| `CrashLoopBackOff` | 계속 죽고 다시 뜨는 중 | `logs --previous`, `describe` 의 Last State |
| `ErrImagePull` / `ImagePullBackOff` | 이미지를 못 받음 | 이미지 이름·태그 오타, 레지스트리 인증 |
| `CreateContainerConfigError` | 참조한 ConfigMap·Secret·키가 없음 | `describe` 의 Events |
| `OOMKilled`(Last State) | 메모리 제한 초과로 죽음 | `resources.limits.memory` |
| `Init:…` | init 컨테이너 단계에서 멈춤 | `logs 파드 -c init이름` |

## 파드는 대부분 못 고친다

실행 중인 파드에서 바꿀 수 있는 것은 **이미지, activeDeadlineSeconds, tolerations 추가** 정도입니다. 환경변수·볼륨·명령·리소스를 바꾸려면 다시 만들어야 합니다.

```bash
kubectl get pod web -o yaml > web.yaml
vi web.yaml
kubectl replace --force -f web.yaml     # 지우고 다시 만든다
```

`kubectl edit pod` 로 못 바꾸는 필드를 고치면 거절되고, 수정본이 `/tmp/kubectl-edit-….yaml` 에 저장됩니다. 그 파일로 `replace --force` 하면 됩니다.
