---
title: RBAC — 누가 무엇을 할 수 있나
part: 3
order: 4
domain: arch
minutes: 25
summary: Role · ClusterRole · RoleBinding · ClusterRoleBinding · ServiceAccount 의 조합과 kubectl auth can-i 로 검증하기.
goals:
  - Role 과 ClusterRole, RoleBinding 과 ClusterRoleBinding 의 범위 차이를 설명할 수 있다
  - 사용자와 ServiceAccount 에 최소 권한을 명령형으로 줄 수 있다
  - kubectl auth can-i --as 로 권한을 검증할 수 있다
labs: [a1, a2]
quiz:
  - q: 노드 목록을 볼 권한을 주려면 어떤 조합이 필요한가?
    options: ["Role + RoleBinding", "ClusterRole + ClusterRoleBinding", "Role + ClusterRoleBinding", "ServiceAccount 만"]
    answer: 1
    explain: 노드·PV·네임스페이스 같은 클러스터 범위 리소스는 ClusterRole 로만 정의할 수 있고, 클러스터 전체 적용은 ClusterRoleBinding 이다. ClusterRoleBinding 은 Role 을 참조할 수 없다.
  - q: ClusterRole 을 RoleBinding 으로 묶으면?
    options: ["오류", "그 RoleBinding 의 네임스페이스 안에서만 그 권한이 생긴다", "클러스터 전체 권한이 생긴다", "아무 효과 없음"]
    answer: 1
    explain: 자주 쓰는 패턴이다. 공통 ClusterRole(예. edit)을 만들어 두고 네임스페이스마다 RoleBinding 으로 부분 적용한다.
  - q: "ServiceAccount dev/deployer 로 권한을 확인하는 --as 값은?"
    options: ["--as=deployer", "--as=dev:deployer", "--as=system:serviceaccount:dev:deployer", "--as=sa/deployer"]
    answer: 2
    explain: ServiceAccount 의 사용자 이름은 system:serviceaccount:<네임스페이스>:<이름> 이다. rolebinding 을 만들 때는 --serviceaccount=dev:deployer 형식을 쓴다.
  - q: "Deployment 에 대한 Role 규칙의 apiGroups 는?"
    options: ['[""]', '["apps"]', '["extensions"]', '["deployments"]']
    answer: 1
    explain: Deployment 는 apps 그룹이다. core 그룹(파드·서비스 등)은 빈 문자열 "". kubectl create role --resource=deployments 는 그룹을 알아서 채운다.
---

## 네 가지 오브젝트

```
      규칙(무엇을)                        연결(누구에게)
  Role        (네임스페이스 안)    ←─  RoleBinding        (네임스페이스 안)
  ClusterRole (클러스터 전체)      ←─  ClusterRoleBinding (클러스터 전체)
                                    ↑ RoleBinding 은 ClusterRole 도 참조할 수 있다(그 네임스페이스에만 적용)
```

**누구에게**(subject)는 세 종류입니다.

| 종류 | 예 | `--as` 로 흉내 낼 때 |
|---|---|---|
| User | `jane`, `auditor` | `--as=jane` |
| Group | `developers` | `--as=x --as-group=developers` |
| ServiceAccount | 파드가 쓰는 계정 `dev/deployer` | `--as=system:serviceaccount:dev:deployer` |

> 쿠버네티스에는 "사용자 오브젝트"가 없습니다. 사용자는 인증서의 CN(이름)과 O(그룹) 등 외부 인증으로 결정되고, RBAC 는 그 **이름 문자열**에 권한을 줄 뿐입니다.

## 규칙의 모양

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deploy-manager
  namespace: dev
rules:
- apiGroups: ["apps"]                  # Deployment 는 apps 그룹
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update", "delete"]
- apiGroups: [""]                      # core 그룹(파드·서비스·시크릿 …)
  resources: ["pods", "pods/log"]      # 하위 리소스: pods/log, pods/exec, deployments/scale
  verbs: ["get", "list"]
  resourceNames: ["web-1"]             # (선택) 특정 이름만
```

동사(verbs): `get list watch create update patch delete deletecollection`, 그리고 `*`. 어느 그룹인지 모르면 `kubectl api-resources` 의 APIVERSION 열을 봅니다.

## 명령형으로 빠르게

```bash
# 네임스페이스 권한 — ServiceAccount
kubectl create serviceaccount deployer -n dev
kubectl create role deploy-manager --verb=get,list,create,update,delete --resource=deployments -n dev
kubectl create rolebinding deployer-binding --role=deploy-manager --serviceaccount=dev:deployer -n dev

# 클러스터 권한 — 사용자
kubectl create clusterrole node-pv-reader --verb=get,list,watch --resource=nodes,persistentvolumes
kubectl create clusterrolebinding auditor-binding --clusterrole=node-pv-reader --user=auditor

# 기존 ClusterRole 을 한 네임스페이스에만
kubectl create rolebinding jane-edit --clusterrole=edit --user=jane -n dev
```

## 검증은 반드시 auth can-i

```bash
kubectl auth can-i create deployments --as=system:serviceaccount:dev:deployer -n dev   # yes
kubectl auth can-i delete pods        --as=system:serviceaccount:dev:deployer -n dev   # no
kubectl auth can-i list nodes --as=auditor                                             # yes
kubectl auth can-i '*' '*' --as=jane -n dev
kubectl auth can-i --list --as=jane -n dev       # 가진 권한 전체
```

문제에서 "~만 할 수 있어야 한다"라고 하면 **되는 것과 안 되는 것 둘 다** 확인하세요. 채점도 그렇게 합니다.

## ServiceAccount 를 파드에 연결

```yaml
spec:
  serviceAccountName: deployer
  automountServiceAccountToken: false    # (선택) API 토큰이 필요 없으면 끈다
```

디플로이먼트라면 `kubectl set serviceaccount deployment web deployer`. 파드는 **없는 ServiceAccount 를 지정하면 생성이 거부**됩니다(디플로이먼트라면 ReplicaSet 이벤트에 FailedCreate).

토큰이 필요하면: `kubectl create token deployer -n dev` (유효기간 있는 토큰 발급).

## 자주 틀리는 곳

- ClusterRoleBinding 에 `--role=` 을 쓴다 → ClusterRoleBinding 은 ClusterRole 만.
- Deployment 권한을 `apiGroups: [""]` 로 준다 → `apps`.
- RoleBinding 의 네임스페이스를 빼먹어 default 에 만든다 → 권한이 엉뚱한 곳에 생김.
- `--serviceaccount=deployer`(네임스페이스 빠짐) → `dev:deployer` 형식.
- 바인딩의 roleRef 는 **못 바꿉니다.** 틀렸으면 지우고 다시 만드세요.
