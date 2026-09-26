---
title: Ingress 와 Gateway API
part: 4
order: 4
domain: network
minutes: 25
summary: HTTP 를 호스트·경로별로 서비스에 나눠 주는 두 방법. IngressClass 와 컨트롤러, pathType, 그리고 새 표준 Gateway API(GatewayClass · Gateway · HTTPRoute).
goals:
  - Ingress 리소스를 명령형·선언형으로 만들 수 있다
  - Ingress 가 동작하려면 컨트롤러가 필요하다는 것을 안다
  - Gateway · HTTPRoute 로 같은 라우팅을 구성할 수 있다
labs: [n6, n7]
quiz:
  - q: Ingress 리소스를 만들었는데 아무 일도 일어나지 않는다. 가장 근본적인 원인은?
    options: ["서비스가 NodePort 가 아니라서", "Ingress 컨트롤러가 없거나 ingressClassName 이 맞지 않아서", "DNS 가 없어서", "파드가 너무 많아서"]
    answer: 1
    explain: Ingress 는 설정일 뿐이다. ingress-nginx 같은 컨트롤러가 그것을 읽어 실제 프록시를 구성한다. 클래스 이름도 컨트롤러와 맞아야 한다.
  - q: "pathType: Prefix, path: /api 가 매칭하지 않는 것은?"
    options: ["/api", "/api/v1", "/apiv2", "/api/"]
    answer: 2
    explain: Prefix 는 / 로 나뉜 경로 요소 단위로 비교한다. /apiv2 는 /api 의 하위 경로가 아니다.
  - q: Gateway API 에서 '어떤 컨트롤러가 처리하는가'를 정하는 리소스는?
    options: ["HTTPRoute", "Gateway", "GatewayClass", "IngressClass"]
    answer: 2
    explain: GatewayClass(보통 인프라 제공자가 설치) → Gateway(리스너, 클러스터 운영자) → HTTPRoute(라우팅 규칙, 앱 팀) 으로 역할이 나뉜다.
  - q: HTTPRoute 가 어느 Gateway 에 붙는지 정하는 필드는?
    options: ["gatewayRef", "parentRefs", "backendRefs", "listeners"]
    answer: 1
    explain: parentRefs 로 Gateway 를 가리키고, backendRefs 로 트래픽을 보낼 서비스를 가리킨다.
---

## Ingress — HTTP 라우팅 규칙

서비스마다 LoadBalancer 를 만들면 비싸고 번거롭습니다. **Ingress** 는 하나의 입구에서 **호스트 이름·URL 경로**에 따라 여러 서비스로 나눠 줍니다.

```
shop.example.com/api  →  api-svc:8080
shop.example.com/     →  web-svc:80
```

Ingress 리소스는 **규칙표**일 뿐이고, 실제로 트래픽을 받는 것은 **Ingress 컨트롤러**(ingress-nginx, Traefik …)입니다. 컨트롤러는 설치해야 하고, 어떤 Ingress 를 자기가 처리할지 **IngressClass** 로 구분합니다.

```bash
kubectl get ingressclass                  # NAME: nginx, CONTROLLER: k8s.io/ingress-nginx
kubectl get pods -n ingress-nginx
```

### 명령형

```bash
kubectl create ingress shop-ing --class=nginx \
  --rule="shop.example.com/api*=api-svc:8080" \
  --rule="shop.example.com/*=web-svc:80"
# 경로 끝의 * → pathType Prefix, 없으면 Exact
# TLS: --rule="shop.example.com/*=web-svc:80,tls=shop-tls"
```

### 선언형

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ing
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /     # (컨트롤러 전용 설정 — 필요할 때만)
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-svc
            port:
              number: 80
```

| pathType | 매칭 |
|---|---|
| `Exact` | 정확히 그 경로만 |
| `Prefix` | `/` 로 나눈 **경로 요소 단위** 접두어(`/api` 는 `/api`, `/api/x` 는 매칭, `/apix` 는 아님) |
| `ImplementationSpecific` | 컨트롤러 마음대로 |

```bash
kubectl describe ingress shop-ing       # Rules · Backends 확인(백엔드 서비스가 없으면 error 표시)
curl -H "Host: shop.example.com" http://<노드IP>:<ingress 컨트롤러 NodePort>/api
```

## Gateway API — Ingress 의 후계자

Gateway API 는 Ingress 의 한계(컨트롤러별 어노테이션 난립, 역할 구분 없음, HTTP 외 프로토콜)를 풀려고 만든 **새 표준**입니다. 2025년 교과과정에 "Use the Gateway API to manage Ingress traffic" 으로 들어왔습니다. CRD 로 설치됩니다.

| 리소스 | 누가 | 무엇 |
|---|---|---|
| **GatewayClass** | 인프라 제공자 | 어떤 컨트롤러 구현을 쓸지(IngressClass 에 해당) |
| **Gateway** | 클러스터 운영자 | 입구: 리스너(프로토콜·포트·호스트), 주소 |
| **HTTPRoute** | 앱 개발자 | 호스트·경로·헤더 → 서비스 라우팅 규칙 |

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: web-gw
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    protocol: HTTP
    port: 80
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route
spec:
  parentRefs:                 # 어느 Gateway 에 붙을지
  - name: web-gw
  hostnames:
  - web.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix      # Exact · PathPrefix · RegularExpression
        value: /
    backendRefs:              # 어느 서비스로
    - name: web
      port: 80
      weight: 100             # 여러 백엔드에 비율로 나누기(카나리)도 가능
```

```bash
kubectl get gatewayclass
kubectl get gateway,httproute
kubectl describe gateway web-gw        # Programmed 조건, 주소
```

명령형 생성기가 없으므로 **공식 문서(gateway-api.sigs.k8s.io)의 예제**를 가져와 이름만 바꾸는 방식이 가장 빠릅니다.

### Ingress 를 Gateway API 로 옮기기

| Ingress | Gateway API |
|---|---|
| `ingressClassName` | Gateway 의 `gatewayClassName` |
| `rules[].host` | HTTPRoute `hostnames` |
| `paths[].path` + `pathType: Prefix` | `matches[].path` `type: PathPrefix` |
| `backend.service.name/port.number` | `backendRefs[].name/port` |
| `tls.secretName` | Gateway 리스너의 `tls.certificateRefs` (프로토콜 HTTPS) |
