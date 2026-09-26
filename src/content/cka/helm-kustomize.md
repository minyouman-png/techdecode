---
title: Helm 과 Kustomize
part: 3
order: 5
domain: arch
minutes: 25
summary: 2025 개정으로 들어온 패키지·구성 관리 도구. Helm 저장소·설치·값 덮어쓰기·template, Kustomize 의 namespace·images·replicas·patches.
goals:
  - Helm 저장소를 추가하고 차트를 버전·값을 지정해 설치·업그레이드·제거할 수 있다
  - helm template 으로 매니페스트만 뽑을 수 있다
  - kustomization.yaml 로 네임스페이스·이미지·레플리카를 바꿔 apply -k 할 수 있다
labs: [a7, a8, a9]
quiz:
  - q: 차트를 클러스터에 설치하지 않고 결과 YAML 만 보려면?
    options: ["helm install --dry-run 만 가능", "helm template", "helm show chart", "helm get manifest"]
    answer: 1
    explain: helm template 은 로컬에서 렌더링만 한다. helm install --dry-run 도 비슷하지만 template 이 가장 단순하다. get manifest 는 이미 설치된 릴리스의 것이다.
  - q: 설치할 때 값을 바꾸는 방법이 아닌 것은?
    options: ["--set key=value", "-f values.yaml", "--values values.yaml", "--config key=value"]
    answer: 3
    explain: 값은 --set(여러 번 가능)이나 -f/--values 파일로 준다. 차트의 기본값은 helm show values 로 본다.
  - q: Kustomize 로 적용하는 kubectl 명령은?
    options: ["kubectl apply -f dir/", "kubectl apply -k dir/", "kubectl kustomize apply", "kubectl create -k"]
    answer: 1
    explain: -k(--kustomize) 는 디렉터리의 kustomization.yaml 을 빌드해 적용한다. 결과만 보려면 kubectl kustomize dir/.
  - q: 특정 네임스페이스에 설치하면서 그 네임스페이스가 없으면 만들게 하는 Helm 옵션은?
    options: ["--namespace-create", "--create-namespace", "--new-namespace", "자동으로 만들어진다"]
    answer: 1
    explain: -n 이름 --create-namespace. 없으면 namespaces not found 로 실패한다.
---

## Helm — 쿠버네티스의 패키지 관리자

**차트**(chart) = 템플릿 묶음, **값**(values) = 템플릿에 넣을 설정, **릴리스**(release) = 차트를 클러스터에 설치한 한 번의 인스턴스.

```bash
# 저장소
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm repo list
helm search repo bitnami/nginx --versions     # 버전 목록

# 차트 살펴보기
helm show values bitnami/nginx | less          # 바꿀 수 있는 값
helm show chart bitnami/nginx

# 설치
helm install web bitnami/nginx \
  --version 21.1.2 \
  -n web --create-namespace \
  --set replicaCount=2 \
  --set service.type=ClusterIP
# 또는 값 파일로: -f my-values.yaml

# 관리
helm list -A
helm status web -n web
helm get values web -n web                    # 내가 준 값
helm upgrade web bitnami/nginx -n web --set replicaCount=3
helm upgrade --install web bitnami/nginx -n web   # 없으면 설치, 있으면 업그레이드
helm rollback web 1 -n web
helm uninstall web -n web
```

> **릴리스는 네임스페이스에 속합니다.** `helm list` 에 안 보이면 `-n` 이나 `-A` 를 빼먹은 것입니다.

### helm template — 매니페스트만 뽑기

```bash
helm template argocd argo/argo-cd --version 8.3.0 -n argocd \
  --set crds.install=false > /opt/argo.yaml
```

- 클러스터에 아무것도 설치하지 않습니다. 결과를 검토하거나 `kubectl apply -f` 로 직접 넣을 때 씁니다.
- **CRD 빼기**: `--skip-crds` 는 차트의 `crds/` 폴더에 든 CRD 만 뺍니다. 차트가 CRD 를 **템플릿으로** 넣는 경우(argo-cd 가 그렇다)에는 차트 값(`crds.install=false`)으로 꺼야 합니다. 차트마다 다르니 **`helm show values` 로 확인**하는 것이 정석입니다.

## Kustomize — 템플릿 없이 덧씌우기

Kustomize 는 원본 YAML 을 건드리지 않고, `kustomization.yaml` 에 적은 변경을 **덧씌워** 결과를 만듭니다. kubectl 에 내장되어 있습니다.

```
app/
├── deployment.yaml
├── service.yaml
└── kustomization.yaml
```

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: staging              # 모든 리소스의 네임스페이스
namePrefix: stg-                # 이름 앞에
labels:                         # (commonLabels 의 후속)
- pairs:
    env: staging
  includeSelectors: false
resources:
- deployment.yaml
- service.yaml
images:                         # 이미지 태그·이름 바꾸기
- name: nginx
  newTag: "1.27"
replicas:                       # 레플리카 바꾸기
- name: portal
  count: 3
configMapGenerator:             # ConfigMap 생성(내용 해시가 이름에 붙는다)
- name: app-config
  literals:
  - MODE=staging
patches:                        # 부분 수정
- target:
    kind: Deployment
    name: portal
  patch: |-
    - op: add
      path: /spec/template/spec/containers/0/env
      value: [{name: TIER, value: web}]
```

```bash
kubectl kustomize app/          # 결과 미리 보기 ★ 적용 전에 꼭
kubectl apply -k app/           # 적용
kubectl delete -k app/          # 삭제
```

### base 와 overlay

환경별 차이만 overlay 에 둡니다.

```
base/        (deployment.yaml, service.yaml, kustomization.yaml)
overlays/
  dev/kustomization.yaml       → resources: [../../base], namespace: dev
  prod/kustomization.yaml      → resources: [../../base], replicas: 5, images: …
```

## 무엇을 언제 쓰나

| | Helm | Kustomize |
|---|---|---|
| 방식 | 템플릿 + 값 | 원본 + 덧씌우기 |
| 남이 만든 소프트웨어 설치 | ◎ (차트 생태계) | △ |
| 내 앱의 환경별 배포 | ○ | ◎ |
| 설치 이력·롤백 | 릴리스 단위로 관리 | 없음(git 으로) |

교과과정 표현은 "Use Helm and Kustomize to install cluster components" 입니다. 시험에서는 **저장소 추가 → 버전 지정 설치 → 값 지정**, **template 으로 뽑기**, **kustomization 고쳐서 apply -k** 가 핵심입니다.
