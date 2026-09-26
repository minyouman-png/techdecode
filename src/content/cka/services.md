---
title: 서비스 — 파드 앞의 고정 주소
part: 4
order: 1
domain: network
minutes: 25
summary: ClusterIP · NodePort · LoadBalancer · Headless, 셀렉터와 엔드포인트, port · targetPort · nodePort 의 관계.
goals:
  - 서비스 타입별 용도와 접근 경로를 설명할 수 있다
  - port · targetPort · nodePort 를 정확히 구분해 쓸 수 있다
  - 엔드포인트가 비어 있을 때 원인을 찾을 수 있다
labs: [n1, n2]
quiz:
  - q: 서비스 port 80, targetPort 8080 이면?
    options: ["서비스 IP:8080 으로 접속하면 파드 80 으로 간다", "서비스 IP:80 으로 접속하면 파드의 8080 으로 간다", "노드의 80 이 열린다", "둘 다 80 이다"]
    answer: 1
    explain: port 는 서비스가 받는 포트, targetPort 는 파드(컨테이너)가 실제로 듣는 포트다.
  - q: 서비스를 만들었는데 kubectl get endpoints 가 <none> 이다. 가장 먼저 볼 것은?
    options: ["kube-proxy 로그", "서비스 selector 와 파드 레이블이 일치하는지, 파드가 Ready 인지", "노드 방화벽", "CoreDNS"]
    answer: 1
    explain: 엔드포인트는 셀렉터에 맞고 Ready 인 파드의 IP 로 채워진다. 레이블 오타나 준비성 실패가 가장 흔하다.
  - q: NodePort 로 허용되는 기본 포트 범위는?
    options: ["1-1024", "8000-9000", "30000-32767", "아무 포트"]
    answer: 2
    explain: 기본 --service-node-port-range 는 30000-32767 이다.
  - q: "clusterIP: None 인 서비스(Headless)의 특징은?"
    options: ["외부에서만 접근 가능", "가상 IP 없이 DNS 가 파드 IP 들을 바로 돌려준다", "로드밸런서가 생긴다", "사용할 수 없다"]
    answer: 1
    explain: Headless 서비스는 가상 IP 를 만들지 않고 DNS 조회에 파드 IP 목록을 준다. StatefulSet 파드마다 고정 DNS 이름(web-0.svc…)을 줄 때 쓴다.
---

## 왜 서비스가 필요한가

파드 IP 는 파드가 다시 만들어질 때마다 바뀝니다. **서비스**는 레이블 셀렉터로 파드 묶음을 가리키는 **고정된 가상 IP(ClusterIP)와 DNS 이름**을 줍니다. 요청은 준비된(Ready) 파드들에 나뉘어 갑니다.

```
클라이언트 → web-svc(10.96.12.34:80) ─┬→ 10.244.1.5:8080 (app=web, Ready)
             (kube-proxy 규칙)         └→ 10.244.2.7:8080 (app=web, Ready)
```

## 타입

| 타입 | 접근 | 쓰임 |
|---|---|---|
| **ClusterIP**(기본) | 클러스터 안에서만 `서비스IP:port` | 내부 통신 |
| **NodePort** | + 모든 노드의 `노드IP:nodePort` | 간단한 외부 공개, 테스트 |
| **LoadBalancer** | + 클라우드 로드밸런서의 외부 IP | 클라우드 외부 공개(온프레미스는 MetalLB 등이 필요, 없으면 EXTERNAL-IP `<pending>`) |
| **ExternalName** | DNS CNAME | 외부 도메인에 내부 이름 붙이기 |
| Headless(`clusterIP: None`) | 가상 IP 없음, DNS 가 파드 IP 들을 반환 | StatefulSet |

## 세 가지 포트

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  type: NodePort
  selector:
    app: web             # ← 이 레이블을 가진 파드로
  ports:
  - name: http
    port: 80             # 서비스가 받는 포트(서비스IP:80)
    targetPort: 8080     # 파드가 듣는 포트 (이름도 가능: targetPort: http)
    nodePort: 30100      # 노드가 여는 포트(NodePort/LoadBalancer, 생략하면 자동)
    protocol: TCP
```

포트가 둘 이상이면 각 포트에 **name 이 필수**입니다.

## 명령형으로 만들기

```bash
kubectl expose deployment web --name=web-svc --port=80 --target-port=8080
kubectl expose deployment web --type=NodePort --port=80                 # nodePort 는 무작위
kubectl expose pod db --port=6379                                        # 파드 레이블을 셀렉터로
kubectl create service clusterip web --tcp=80:8080                       # ⚠ 셀렉터가 app=web 으로 고정
kubectl create service nodeport web --tcp=80:8080 --node-port=30100
```

`expose` 는 대상(디플로이먼트·파드)의 레이블을 **자동으로 셀렉터로** 씁니다. `create service` 는 셀렉터를 `app=<이름>` 으로 가정하니 레이블이 다르면 엔드포인트가 비어 있게 됩니다. nodePort 를 특정 값으로 정하려면 `--dry-run=client -o yaml` 로 뽑아 `nodePort:` 를 넣습니다.

## 엔드포인트 — 서비스가 실제로 가리키는 곳

```bash
kubectl get endpoints web-svc          # ENDPOINTS: 10.244.1.5:8080,10.244.2.7:8080
kubectl get endpointslices -l kubernetes.io/service-name=web-svc
kubectl describe svc web-svc           # Selector, TargetPort, Endpoints 를 한눈에
```

> 최근 버전은 엔드포인트를 **EndpointSlice** 로 관리하고, 옛 Endpoints API 는 폐지 예정 경고를 냅니다. 어느 쪽으로 보든 들어 있는 정보(파드 IP:포트)는 같습니다.

### 엔드포인트가 비어 있거나 접속이 안 될 때

1. **셀렉터 ↔ 파드 레이블** — `kubectl get pods --show-labels` vs `describe svc` 의 Selector. 오타 한 글자면 비어 있습니다.
2. **파드가 Ready 인가** — Ready 아닌 파드(readinessProbe 실패)는 엔드포인트에서 빠집니다.
3. **targetPort 가 컨테이너가 듣는 포트인가** — 엔드포인트는 있는데 `connection refused` 면 대개 이것.
4. **네임스페이스** — 서비스와 파드는 같은 네임스페이스여야 셀렉터가 닿습니다.
5. **NetworkPolicy** — 연결이 거부가 아니라 **시간 초과**로 끝나면 정책이 막고 있을 가능성.

## 접속 확인

노드 셸에서는 파드 네트워크에 직접 닿지 않을 수 있으니 **클러스터 안의 임시 파드**로 확인합니다.

```bash
kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- wget -qO- -T2 web-svc
kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- wget -qO- -T2 web-svc.shop.svc.cluster.local
kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- nc -zv -w2 db-svc 6379
curl http://<노드IP>:30100            # NodePort 는 노드에서 바로
```

busybox 에는 `curl` 이 없고 `wget` 과 `nc` 가 있습니다. `curl` 이 필요하면 `curlimages/curl` 이미지를 씁니다.
