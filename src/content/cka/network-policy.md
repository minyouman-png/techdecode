---
title: NetworkPolicy — 파드 방화벽
part: 4
order: 3
domain: network
minutes: 30
summary: 기본은 모두 허용. 정책이 파드를 '선택'하는 순간 그 방향은 허용 목록제가 된다. podSelector · namespaceSelector · ipBlock, AND 와 OR 의 함정, DNS egress.
goals:
  - 정책이 적용되는 파드(podSelector)와 허용할 상대(from/to)를 구분해 쓸 수 있다
  - 기본 차단(default deny) 정책과 DNS 허용 정책을 만들 수 있다
  - namespaceSelector 와 podSelector 의 AND/OR 차이를 설명할 수 있다
labs: [n3, n4, n5]
quiz:
  - q: 네임스페이스에 NetworkPolicy 가 하나도 없으면?
    options: ["모든 통신이 막힌다", "모든 통신이 허용된다", "같은 네임스페이스끼리만 허용", "DNS 만 허용"]
    answer: 1
    explain: 쿠버네티스 기본은 전부 허용이다. 파드가 어떤 정책에 '선택'되면 그 방향(Ingress/Egress)이 허용 목록제로 바뀐다.
  - q: "from 에 '- namespaceSelector: …' 와 '- podSelector: …' 를 각각 다른 항목으로 쓰면?"
    options: ["두 조건 모두 만족(AND)", "둘 중 하나만 만족(OR)", "오류", "podSelector 만 적용"]
    answer: 1
    explain: 서로 다른 목록 항목(- 두 개)은 OR 이다. 같은 항목 안에 namespaceSelector 와 podSelector 를 함께 쓰면 AND(그 네임스페이스의 그 파드)다.
  - q: egress 를 모두 막는 정책을 걸었더니 서비스 이름으로 접속이 안 된다. 먼저 확인할 것은?
    options: ["CoreDNS 로 가는 UDP/TCP 53 egress 가 허용됐는지", "kube-proxy", "노드 방화벽", "etcd"]
    answer: 0
    explain: 이름 해석도 파드의 egress 트래픽이다. 53번을 열어 주지 않으면 IP 로는 되는데 이름으로는 안 되는 증상이 난다.
  - q: "podSelector: {} 의 뜻은?"
    options: ["아무 파드도 선택하지 않음", "그 네임스페이스의 모든 파드", "클러스터의 모든 파드", "오류"]
    answer: 1
    explain: 빈 셀렉터는 '전부'다. 정책의 spec.podSelector 에 쓰면 네임스페이스의 모든 파드가 대상이 된다.
---

## 기본 원리 세 가지

1. **정책이 없으면 전부 허용.**
2. 어떤 파드가 **Ingress 정책에 선택되면**, 그 파드로 들어오는 트래픽은 **어느 정책이든 허용한 것만** 들어온다(Egress 도 같음).
3. 정책은 **허용만** 한다. 여러 정책은 **합집합**이다. "거부 규칙"은 없다.

> NetworkPolicy 를 실제로 강제하는 것은 **CNI** 입니다. Calico·Cilium 은 지원하지만 Flannel 은 지원하지 않아서, 정책을 만들어도 아무 효과가 없습니다.

## 구조

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-allow-api
  namespace: secure
spec:
  podSelector:              # ① 누구를 보호하나(이 네임스페이스의 app=db 파드)
    matchLabels:
      app: db
  policyTypes:              # ② 어느 방향을 통제하나
  - Ingress
  ingress:                  # ③ 무엇을 허용하나
  - from:
    - podSelector:
        matchLabels:
          app: api          # 같은 네임스페이스의 app=api 파드에서
    ports:
    - protocol: TCP
      port: 6379            # 6379 로만
```

## from / to 에 쓸 수 있는 것

| 항목 | 뜻 |
|---|---|
| `podSelector` | **정책과 같은 네임스페이스**의 그 레이블 파드 |
| `namespaceSelector` | 그 레이블을 가진 네임스페이스의 **모든** 파드 |
| `namespaceSelector` + `podSelector` (**같은 항목**) | 그 네임스페이스들의 그 파드(AND) |
| `ipBlock` | IP 대역(`cidr`, `except`) — 보통 클러스터 밖 |

### ★ AND 와 OR — 가장 많이 틀리는 곳

```yaml
# (가) AND: team=frontend 네임스페이스 안의 app=ui 파드만
ingress:
- from:
  - namespaceSelector:
      matchLabels: {team: frontend}
    podSelector:                  # ← 앞에 '-' 없음 = 같은 항목
      matchLabels: {app: ui}

# (나) OR: team=frontend 네임스페이스의 모든 파드 + 같은 네임스페이스의 app=ui 파드
ingress:
- from:
  - namespaceSelector:
      matchLabels: {team: frontend}
  - podSelector:                  # ← '-' 있음 = 다른 항목
      matchLabels: {app: ui}
```

`-` 하나 차이로 뜻이 완전히 달라집니다.

네임스페이스는 이름이 아니라 **레이블**로 고릅니다. 모든 네임스페이스에는 자동으로 `kubernetes.io/metadata.name=<이름>` 레이블이 붙어 있어서, 이름으로 고르고 싶으면 이것을 씁니다.

```bash
kubectl get ns --show-labels
kubectl label ns web-ui team=frontend
```

## 자주 쓰는 틀

```yaml
# 네임스페이스 전체 ingress 차단
spec:
  podSelector: {}
  policyTypes: [Ingress]

# 네임스페이스 전체 ingress·egress 차단
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]

# DNS 만 나가게 (egress 차단과 함께 쓴다)
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53

# 같은 네임스페이스 안끼리는 모두 허용
spec:
  podSelector: {}
  ingress:
  - from:
    - podSelector: {}
```

> **egress 를 막으면 DNS 도 막힙니다.** IP 로는 되는데 이름으로 안 되면 53번 egress 를 열었는지 확인하세요.

## 확인하기

```bash
kubectl get netpol -n secure
kubectl describe netpol db-allow-api -n secure

# 허용돼야 하는 쪽: 레이블을 흉내 낸 임시 파드로
kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n secure --labels=app=api -- nc -zv -w2 <db파드IP> 6379
# 막혀야 하는 쪽
kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n secure --labels=app=other -- nc -zv -w2 <db파드IP> 6379
```

막힌 연결은 **거부(refused)가 아니라 시간 초과(timed out)** 로 끝납니다. 이 차이로 "정책이 막았다"와 "포트에 아무도 없다"를 구분합니다.
