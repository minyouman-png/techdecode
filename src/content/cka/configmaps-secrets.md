---
title: ConfigMap 과 Secret
part: 2
order: 3
domain: workloads
minutes: 20
summary: 설정을 이미지 밖으로 — 환경변수로 주입하기, 파일로 마운트하기, Secret 의 base64 는 암호화가 아니라는 사실.
goals:
  - ConfigMap · Secret 을 명령형으로 만들 수 있다
  - 값을 환경변수(env · envFrom)와 볼륨 파일로 주입할 수 있다
  - Secret 값을 꺼내 디코드할 수 있고, base64 가 암호화가 아님을 안다
labs: [w4, t13]
quiz:
  - q: Secret 의 data 필드 값에 대해 맞는 것은?
    options: ["AES 로 암호화되어 있다", "base64 로 인코딩되어 있을 뿐이다", "해시값이라 되돌릴 수 없다", "평문이다"]
    answer: 1
    explain: Secret 의 data 는 base64 인코딩이다. 누구나 base64 -d 로 되돌린다. 보호는 RBAC 과 etcd 저장 시 암호화(EncryptionConfiguration)로 한다.
  - q: ConfigMap 의 모든 키를 한꺼번에 환경변수로 넣는 필드는?
    options: ["env", "envFrom", "valueFrom", "volumeMounts"]
    answer: 1
    explain: envFrom 의 configMapRef(또는 secretRef)는 모든 키를 같은 이름의 환경변수로 넣는다. 키 하나만 원하면 env + valueFrom.configMapKeyRef.
  - q: 파드가 참조하는 ConfigMap 이 없을 때(env 로 참조) 파드 상태는?
    options: ["Running", "CreateContainerConfigError", "ImagePullBackOff", "Completed"]
    answer: 1
    explain: 환경변수로 참조한 ConfigMap·Secret 이나 키가 없으면 컨테이너를 만들지 못해 CreateContainerConfigError 가 된다. 볼륨으로 참조했다면 ContainerCreating 에서 멈추고 FailedMount 이벤트가 생긴다.
  - q: 볼륨으로 마운트한 ConfigMap 을 수정하면?
    options: ["파드가 바로 재시작된다", "잠시 뒤 파일 내용이 갱신된다(환경변수는 갱신 안 됨)", "아무것도 바뀌지 않는다", "오류가 난다"]
    answer: 1
    explain: 볼륨 파일은 kubelet 이 주기적으로 갱신한다(subPath 제외). 환경변수는 컨테이너 시작 때 한 번 정해지므로 파드를 다시 띄워야 바뀐다.
---

## 만들기

```bash
# ConfigMap
kubectl create configmap app-config --from-literal=APP_MODE=prod --from-literal=LOG=info
kubectl create configmap nginx-conf --from-file=nginx.conf          # 키 = 파일 이름
kubectl create configmap nginx-conf --from-file=main.conf=nginx.conf   # 키 이름 지정
kubectl create configmap env-cfg --from-env-file=app.env            # KEY=VALUE 줄들

# Secret
kubectl create secret generic db-cred --from-literal=user=admin --from-literal=password='S3cr3t!'
kubectl create secret tls web-tls --cert=tls.crt --key=tls.key
kubectl create secret docker-registry regcred --docker-server=… --docker-username=… --docker-password=…
```

> 셸에서 `!` · `$` 같은 특수문자가 든 값은 **작은따옴표**로 감쌉니다.

## Secret 값 보기

```bash
kubectl get secret db-cred -o yaml
kubectl get secret db-cred -o jsonpath='{.data.password}' | base64 -d
```

**base64 는 암호화가 아닙니다.** 인코딩일 뿐이라 누구나 되돌립니다. Secret 을 지키는 것은 ① RBAC(누가 `get secrets` 를 할 수 있나)와 ② etcd 저장 시 암호화 설정입니다. YAML 로 직접 쓸 때는 `stringData:` 를 쓰면 평문으로 적어도 저장할 때 base64 로 바뀝니다.

## 주입 방법 1 — 환경변수

```yaml
spec:
  containers:
  - name: app
    image: busybox:1.37
    command: ["sleep", "3600"]
    env:
    - name: APP_MODE                  # 키 하나씩
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_MODE
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-cred
          key: password
    envFrom:                          # 전부 한꺼번에
    - configMapRef:
        name: app-config
    - secretRef:
        name: db-cred
      prefix: DB_                     # 이름 앞에 붙일 접두어(선택)
```

## 주입 방법 2 — 볼륨(파일)

```yaml
spec:
  containers:
  - name: web
    image: nginx:1.27
    volumeMounts:
    - name: cfg
      mountPath: /etc/app            # 키마다 파일 하나: /etc/app/APP_MODE
      readOnly: true
    - name: conf
      mountPath: /etc/nginx/conf.d/main.conf
      subPath: main.conf             # 폴더를 덮지 않고 파일 하나만 끼워 넣기
  volumes:
  - name: cfg
    configMap:
      name: app-config
  - name: conf
    configMap:
      name: nginx-conf
      items:                         # 원하는 키만, 원하는 파일 이름으로
      - key: main.conf
        path: main.conf
  - name: secret-vol
    secret:
      secretName: db-cred            # ⚠️ Secret 은 name 이 아니라 secretName
```

> **Secret 볼륨은 `secretName`, ConfigMap 볼륨은 `name`** — 시험장 단골 오타입니다.

## 확인

```bash
kubectl exec app -- env | grep APP_MODE
kubectl exec app -- cat /etc/app/APP_MODE
kubectl exec app -- ls /etc/app
```

## 갱신과 불변 설정

- 볼륨으로 마운트한 값은 ConfigMap 을 고치면 **잠시 뒤 파일이 바뀝니다**(subPath 로 마운트한 파일은 제외).
- 환경변수는 **컨테이너가 시작될 때 한 번** 읽습니다. 바꾸려면 `kubectl rollout restart deployment …`.
- `immutable: true` 를 주면 내용을 바꿀 수 없습니다(실수 방지·성능). 바꾸려면 지우고 새로 만듭니다.
- 참조하는 ConfigMap 이 없으면: 환경변수 참조 → `CreateContainerConfigError`, 볼륨 참조 → `ContainerCreating` + FailedMount. 없는 것을 만들어 주면 kubelet 이 곧 다시 시도합니다.
