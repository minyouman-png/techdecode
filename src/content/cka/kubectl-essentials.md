---
title: kubectl 손에 익히기
part: 1
order: 4
domain: basics
minutes: 30
summary: 시험 시간의 절반은 kubectl 타이핑이다. 조회·출력 형식·컨텍스트·명령형 생성의 핵심과 시간을 줄이는 습관.
goals:
  - get · describe · logs · exec 로 상태를 빠르게 조사할 수 있다
  - -o wide · yaml · jsonpath · custom-columns 로 원하는 값만 뽑을 수 있다
  - 컨텍스트와 네임스페이스를 정확히 바꿀 수 있다
  - 명령형 생성(run · create · expose)을 쓸 수 있다
labs: [b1, b2]
quiz:
  - q: 모든 네임스페이스의 파드를 보는 옵션은?
    options: ["-n all", "-A (--all-namespaces)", "--everything", "-a"]
    answer: 1
    explain: -A 또는 --all-namespaces. 출력 맨 앞에 NAMESPACE 열이 붙는다.
  - q: 파드가 어느 노드에 있는지, IP 는 무엇인지 한 번에 보려면?
    options: ["kubectl get pods -o wide", "kubectl get pods --show-labels", "kubectl top pods", "kubectl get nodes"]
    answer: 0
    explain: -o wide 는 IP·NODE 열을 더해 준다.
  - q: 현재 컨텍스트의 기본 네임스페이스를 dev 로 바꾸는 명령은?
    options: ["kubectl use-namespace dev", "kubectl config set-context --current --namespace=dev", "kubectl ns dev", "export NAMESPACE=dev"]
    answer: 1
    explain: kubectl config set-context --current --namespace=dev. 시험에서는 문제마다 -n 을 명시하는 편이 더 안전하다.
  - q: "`kubectl get pods -o jsonpath='{.items[*].metadata.name}'` 의 결과는?"
    options: ["파드 전체 YAML", "파드 이름들이 공백으로 구분되어 한 줄로", "파드 개수", "오류"]
    answer: 1
    explain: items[*] 로 모든 항목을 돌며 metadata.name 을 꺼낸다. 한 줄에 하나씩 원하면 range … end 와 "\n" 을 쓴다.
---

## 시작 30초: 시험장 세팅

시험 터미널은 대개 `k` 별칭과 자동완성이 이미 되어 있습니다. 안 되어 있으면:

```bash
alias k=kubectl
source <(kubectl completion bash)
complete -o default -F __start_kubectl k
export do="--dry-run=client -o yaml"      # k run x --image=nginx $do
export now="--force --grace-period=0"     # k delete pod x $now (즉시 삭제)
```

## 조회의 네 가지 도구

```bash
kubectl get pods                         # 목록
kubectl get pods -o wide                 # + IP, NODE
kubectl get pods -n kube-system          # 다른 네임스페이스
kubectl get pods -A                      # 전체 네임스페이스
kubectl get pods --show-labels           # 레이블까지
kubectl get pods -l app=web              # 레이블로 거르기
kubectl get pods --field-selector status.phase=Running
kubectl get deploy,svc,pods              # 여러 종류 한꺼번에
kubectl get all -n shop                  # 자주 쓰는 종류 묶음

kubectl describe pod web                 # 상세 + 맨 아래 Events ★
kubectl logs web                         # 로그
kubectl logs web -c sidecar              # 컨테이너 지정
kubectl logs web --previous              # 재시작 전 컨테이너 로그 ★ CrashLoop 때
kubectl exec web -- env                  # 컨테이너 안에서 명령
kubectl exec -it web -- sh               # 셸(실습 터미널은 한 줄 명령만)
```

> **describe 의 Events 를 가장 먼저 봅니다.** Pending, ImagePullBackOff, 볼륨 문제, 프로브 실패 — 거의 모든 원인이 Events 마지막 몇 줄에 적혀 있습니다.

## 출력 형식 — 문제에서 "파일에 저장"을 요구할 때

```bash
kubectl get pod web -o yaml              # 전체 YAML
kubectl get pod web -o jsonpath='{.status.podIP}'
kubectl get pods -o jsonpath='{.items[*].metadata.name}'          # 한 줄
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'   # 한 줄에 하나
kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'
kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName
kubectl get pods --sort-by=.metadata.creationTimestamp
kubectl get pv --sort-by=.spec.capacity.storage
kubectl get pods -o name                 # pod/web 형식
kubectl get pods --no-headers | wc -l    # 개수
```

jsonpath 를 외우기 어려우면 먼저 `-o yaml` 로 구조를 보고, 원하는 값까지 경로를 점(.)으로 이으면 됩니다. 목록이면 `[*]`, 조건이면 `[?(@.키=="값")]`.

## 컨텍스트와 네임스페이스

시험에는 클러스터가 여러 개 있고, 문제마다 **어느 클러스터(컨텍스트) 또는 어느 호스트**에서 하라고 맨 위에 적혀 있습니다. **그 명령부터 실행하는 습관**이 제일 중요합니다. 엉뚱한 클러스터에 정답을 만들면 0점입니다.

```bash
kubectl config get-contexts
kubectl config current-context
kubectl config use-context k8s-prod
kubectl config set-context --current --namespace=dev    # 기본 네임스페이스 변경
```

## 명령형 생성 — 뼈대는 명령으로

```bash
kubectl run web --image=nginx:1.27 --port=80 --labels=app=web,tier=fe
kubectl run tmp --image=busybox:1.37 --restart=Never --rm -it -- wget -qO- -T2 web   # 일회용 점검 파드
kubectl create deployment web --image=nginx:1.27 --replicas=3
kubectl expose deployment web --port=80 --target-port=8080 --type=NodePort
kubectl create configmap cfg --from-literal=MODE=prod --from-file=app.conf
kubectl create secret generic db --from-literal=password=pass
kubectl create serviceaccount deployer
kubectl create role r --verb=get,list --resource=pods
kubectl create rolebinding rb --role=r --serviceaccount=dev:deployer
kubectl create job once --image=busybox -- echo hi
kubectl create cronjob tick --image=busybox --schedule="*/5 * * * *" -- date
kubectl create ingress web --class=nginx --rule="a.com/*=web:80"
```

조금이라도 복잡한 옵션(볼륨, 프로브, affinity)이 필요하면 `--dry-run=client -o yaml > 파일` 로 뽑아서 편집합니다.

## 수정하는 방법들

```bash
kubectl edit deploy web                               # 편집기로 바로
kubectl set image deploy/web nginx=nginx:1.27          # 이미지
kubectl scale deploy web --replicas=5                  # 개수
kubectl label pod web env=prod                         # 레이블 추가
kubectl label pod web env-                             # 레이블 삭제
kubectl label pod web env=dev --overwrite              # 덮어쓰기
kubectl annotate deploy web kubernetes.io/change-cause="v2"
kubectl patch deploy web -p '{"spec":{"replicas":2}}'
```

## 시간을 아끼는 습관

- 이름은 **복사해서** 쓰고(`Ctrl+Shift+C/V` — 시험 터미널), 문제의 이름·네임스페이스를 **그대로** 씁니다. `web-app` 과 `webapp` 은 다른 이름입니다.
- 만든 뒤에는 **반드시 확인**합니다(`get`, `describe`). 확인에 10초, 틀린 채 넘어가면 배점 전부를 잃습니다.
- `kubectl explain pod.spec.containers.livenessProbe` — 필드 이름이 생각나지 않을 때.
- 삭제를 기다리기 싫으면 `--force --grace-period=0`(파드). 시험장에서는 시간이 곧 점수입니다.
