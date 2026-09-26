---
title: YAML 과 쿠버네티스 오브젝트
part: 1
order: 2
domain: basics
minutes: 20
summary: 모든 쿠버네티스 리소스는 같은 네 칸(apiVersion·kind·metadata·spec)으로 되어 있다. 들여쓰기 규칙과 흔한 실수.
goals:
  - YAML 의 맵·목록·들여쓰기 규칙으로 매니페스트를 읽고 쓸 수 있다
  - apiVersion · kind · metadata · spec · status 의 역할을 안다
  - dry-run 으로 YAML 뼈대를 만들고 고쳐서 적용할 수 있다
labs: [b3]
quiz:
  - q: 쿠버네티스 매니페스트에서 '원하는 상태'를 적는 칸은?
    options: ["metadata", "spec", "status", "kind"]
    answer: 1
    explain: spec 에 원하는 상태를 적고, 쿠버네티스가 현재 상태를 status 에 기록한다. 컨트롤러는 둘을 비교해 차이를 메운다.
  - q: YAML 들여쓰기에 쓰면 안 되는 것은?
    options: ["스페이스 2칸", "스페이스 4칸", "탭 문자", "들여쓰기 없음(최상위)"]
    answer: 2
    explain: YAML 은 탭 문자를 들여쓰기로 허용하지 않는다. 같은 깊이는 같은 개수의 스페이스로 맞춘다.
  - q: Deployment 의 apiVersion 은?
    options: ["v1", "apps/v1", "extensions/v1beta1", "deployments/v1"]
    answer: 1
    explain: Deployment·ReplicaSet·DaemonSet·StatefulSet 은 apps 그룹이라 apps/v1 이다. Pod·Service·ConfigMap 은 core 그룹이라 v1 이다. 헷갈리면 kubectl api-resources 로 확인한다.
  - q: YAML 을 손으로 처음부터 쓰는 대신 시험에서 권장하는 방법은?
    options: ["인터넷 블로그 복사", "kubectl ... --dry-run=client -o yaml 로 뼈대 생성", "kubectl get all -o yaml", "기억에 의존"]
    answer: 1
    explain: 명령형 생성 명령에 --dry-run=client -o yaml 을 붙이면 문법이 맞는 뼈대가 나온다. 거기에 필요한 필드만 더하면 빠르고 실수가 적다.
---

## YAML 은 세 가지만 알면 된다

```yaml
# 1) 맵(키: 값)
name: web
replicas: 3

# 2) 목록(- 로 시작)
ports:
- 80
- 443

# 3) 들여쓰기로 소속을 나타낸다(스페이스만, 탭 금지)
metadata:
  name: web          # metadata 안의 name
  labels:
    app: web         # labels 안의 app
```

목록 안에 맵이 들어가는 모양이 가장 자주 나옵니다. 컨테이너 목록이 대표적입니다.

```yaml
containers:
- name: web          # 목록의 첫 항목(맵)이 시작
  image: nginx:1.27  # 같은 항목의 다른 키 — '- ' 다음 글자와 줄을 맞춘다
- name: sidecar      # 두 번째 항목
  image: busybox:1.37
```

> `kubectl -o yaml` 출력은 목록을 부모 키와 **같은 칸**에서 시작합니다(`containers:` 바로 아래 `- name`). 문서 예제는 두 칸 들여 쓰기도 합니다. **둘 다 맞습니다.** 한 파일 안에서 일관되기만 하면 됩니다.

문자열은 대부분 따옴표가 필요 없지만, **숫자·참/거짓처럼 보이는 문자열**은 따옴표로 감쌉니다. `"1.27"`, `"true"`, `"0 2 * * *"`(`*` 로 시작하면 YAML 기호로 읽힌다).

## 모든 리소스의 공통 모양

```yaml
apiVersion: apps/v1      # 어느 API 그룹/버전인가
kind: Deployment         # 무슨 종류인가
metadata:                # 이름표
  name: web
  namespace: shop
  labels:
    app: web
spec:                    # 원하는 상태 — 내가 쓴다
  replicas: 3
  ...
status:                  # 현재 상태 — 쿠버네티스가 쓴다(적용할 때는 무시됨)
  readyReplicas: 3
```

**선언형(declarative)** 이 핵심입니다. "파드 세 개를 만들어라"는 명령을 내리는 게 아니라 "파드는 세 개여야 한다"는 상태를 적어 두면, 컨트롤러가 계속 현재 상태를 원하는 상태로 맞춥니다. 파드 하나를 지워도 곧 다시 생기는 이유입니다.

어떤 리소스가 어느 apiVersion 인지 헷갈리면:

```bash
kubectl api-resources | grep -i deploy
kubectl explain deployment             # 최상위 필드
kubectl explain deployment.spec.strategy --recursive   # 하위 필드 전부
```

`kubectl explain` 은 인터넷 없이 쓰는 문서입니다. 필드 이름 철자가 기억나지 않을 때 가장 빠릅니다.

## dry-run 으로 뼈대 만들기

시험에서 YAML 을 빈 화면부터 쓰는 사람은 거의 없습니다. **명령형으로 뼈대를 뽑고, 필요한 것만 더합니다.**

```bash
kubectl run web --image=nginx:1.27 --dry-run=client -o yaml > web.yaml
kubectl create deployment web --image=nginx:1.27 --replicas=3 --dry-run=client -o yaml > deploy.yaml
kubectl create service clusterip web --tcp=80:8080 --dry-run=client -o yaml
kubectl create configmap cfg --from-literal=A=1 --dry-run=client -o yaml
```

`--dry-run=client` 는 "실제로 만들지 말고 만들 내용만 보여 줘"입니다. 시험 시작하자마자 이렇게 줄여 두면 편합니다.

```bash
export do="--dry-run=client -o yaml"
kubectl run web --image=nginx $do > web.yaml
```

## 적용하기: create · apply · replace

| 명령 | 동작 |
|---|---|
| `kubectl create -f x.yaml` | 새로 만든다. 이미 있으면 오류 |
| `kubectl apply -f x.yaml` | 없으면 만들고, 있으면 바뀐 부분을 반영 |
| `kubectl replace -f x.yaml` | 통째로 바꾼다 |
| `kubectl replace --force -f x.yaml` | 지우고 다시 만든다 — **바꿀 수 없는 필드**를 고칠 때 |

파드의 대부분 필드(환경변수, 볼륨, 명령 등)는 **만든 뒤에 못 바꿉니다.** 이미지 정도만 바뀝니다. 파드 설정을 고쳐야 하면 `kubectl get pod x -o yaml > x.yaml` 로 뽑아 고친 뒤 `kubectl replace --force -f x.yaml` 합니다.

## 흔한 실수

- **탭 문자** → `error converting YAML to JSON`. 편집기 설정을 스페이스로.
- **필드 이름 오타**(`imagee`, `contianers`) → 서버가 `strict decoding error: unknown field` 로 거절합니다. 오류 메시지가 오타 위치를 정확히 알려 줍니다.
- **숫자 자리에 문자열**(`replicas: "3"`) → `cannot unmarshal string into … of type int32`.
- **selector 와 템플릿 레이블 불일치**(Deployment) → `` `selector` does not match template `labels` ``.
- **apiVersion 틀림**(Deployment 에 `v1`) → `no matches for kind "Deployment" in version "v1"`.

실습 터미널은 이 오류들을 실제 문구 그대로 냅니다. 일부러 틀려 보고 메시지를 읽는 연습을 해 두면 시험장에서 당황하지 않습니다.
