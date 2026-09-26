---
title: 트러블슈팅 ③ 서비스 · 네트워크 · 모니터링
part: 6
order: 3
domain: trouble
minutes: 25
summary: '"서비스로 접속이 안 된다"를 다섯 단계로 쪼개기, 연결 거부와 시간 초과의 차이, kubectl top 과 로그로 자원·출력 감시하기.'
goals:
  - 서비스 장애를 DNS → 서비스 → 엔드포인트 → 파드 → 정책 순으로 좁힐 수 있다
  - refused / timed out / NXDOMAIN 이 각각 무엇을 뜻하는지 안다
  - kubectl top 과 logs 로 자원 사용과 컨테이너 출력을 조사해 파일로 남길 수 있다
labs: [t8, t9, t11, t12, n2]
quiz:
  - q: "wget 결과가 'Connection refused' 다. 가장 그럴듯한 원인은?"
    options: ["NetworkPolicy 가 막았다", "목적지에 도달했지만 그 포트에서 듣는 프로세스가 없다(targetPort 오류 등)", "DNS 가 없다", "노드가 꺼졌다"]
    answer: 1
    explain: 거부(refused)는 상대가 '없다'고 답한 것이다. 정책으로 막히면 답이 오지 않아 시간 초과(timed out)가 된다.
  - q: 네임스페이스 batch 에서 CPU 를 가장 많이 쓰는 파드를 찾는 명령은?
    options: ["kubectl get pods --sort-by=cpu", "kubectl top pods -n batch --sort-by=cpu", "kubectl describe node", "kubectl logs --cpu"]
    answer: 1
    explain: kubectl top 이 실제 사용량을 보여 준다(metrics-server 필요). --sort-by=cpu 또는 memory.
  - q: 서비스 엔드포인트는 있는데 접속이 시간 초과로 끝난다. 다음으로 볼 것은?
    options: ["이미지 태그", "해당 파드에 걸린 NetworkPolicy", "etcd", "PVC"]
    answer: 1
    explain: 엔드포인트가 있다는 건 셀렉터·Ready 는 정상이라는 뜻. 응답이 없으면 정책(또는 CNI·kube-proxy)을 의심한다.
---

## 다섯 단계로 쪼개기

"프론트에서 백엔드 서비스로 접속이 안 된다"는 한 문장을 이렇게 나눕니다.

```
① 이름 해석     nslookup api-svc                → NXDOMAIN? timed out?
② 서비스 존재   kubectl get svc api-svc -n …      → 포트·셀렉터
③ 엔드포인트    kubectl get ep api-svc -n …       → 비어 있나?
④ 파드 자체     kubectl get pods -l … ; 파드 IP:포트 로 직접 접속
⑤ 정책          kubectl get netpol -A             → 양쪽 파드를 선택하는 정책
```

```bash
kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n front -- nslookup api-svc.back
kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n front -- wget -qO- -T2 api-svc.back:8080
kubectl run t --rm -it --image=busybox:1.37 --restart=Never -n front -- wget -qO- -T2 10.244.1.23:8080   # 파드 IP 직접
```

## 오류 문장이 알려 주는 것

| 결과 | 뜻 | 볼 곳 |
|---|---|---|
| `bad address` / `NXDOMAIN` | 그런 이름이 없음 | 서비스 이름·네임스페이스 |
| `no servers could be reached` | DNS 서버에 못 닿음 | CoreDNS, 53번 egress 정책 |
| `Connection refused` | 닿았지만 아무도 안 들음 | targetPort, 컨테이너 포트, 엔드포인트 없음 |
| `timed out` | 답이 없음 | NetworkPolicy, CNI, kube-proxy |
| 응답은 오는데 엉뚱한 앱 | 셀렉터가 다른 파드를 잡음 | 셀렉터·레이블 |

## kube-proxy 와 CNI

```bash
kubectl get ds -n kube-system                          # kube-proxy, calico-node 등이 노드 수만큼 Ready 인가
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=20
kubectl get pods -n kube-system -o wide | grep -v Running
```

CNI 파드가 특정 노드에서 죽어 있으면 그 노드의 새 파드는 `ContainerCreating` 에서 멈추고, 노드가 NotReady 가 되기도 합니다.

## 모니터링 — 자원 사용량

교과과정: "Monitor cluster and application resource usage".

```bash
kubectl top nodes
kubectl top pods -A --sort-by=memory
kubectl top pods -n batch -l app=worker --sort-by=cpu
kubectl top pods web --containers                  # 컨테이너별
kubectl describe node node01 | grep -A8 "Allocated resources"   # 요청량 기준(스케줄링)
```

- `top` 은 **실제 사용량**, `describe node` 의 Allocated 는 **요청량 합계**입니다. 스케줄링 문제는 후자를, "가장 많이 쓰는 파드" 문제는 전자를 봅니다.
- `Metrics API not available` → metrics-server 파드를 확인.

"가장 CPU 를 많이 쓰는 파드 이름을 파일에"는 이렇게:

```bash
kubectl top pods -n batch -l app=worker --sort-by=cpu --no-headers | head -1 | awk '{print $1}' > /opt/top.txt
cat /opt/top.txt
```

조건(네임스페이스, 레이블)을 빠뜨리면 다른 파드가 1등이 됩니다. **문제의 조건을 전부** 명령에 넣었는지 확인하세요.

## 컨테이너 출력 스트림 관리

교과과정: "Manage and evaluate container output streams". 컨테이너가 **stdout/stderr** 로 쓴 것이 `kubectl logs` 로 보입니다. 파일에만 쓰는 옛날 앱이라면 사이드카가 그 파일을 `tail -f` 해서 stdout 으로 내보내게 합니다([파드 강의](/academy/cka/pods/)의 사이드카 예제).

```bash
kubectl logs legacy-app | grep ERROR > /opt/errors.log
kubectl logs web -c sidecar --tail=50
kubectl logs web --previous
kubectl logs -l app=web --all-containers --prefix --since=1h
```

노드에서는 `/var/log/pods/<네임스페이스>_<파드>_<uid>/<컨테이너>/` 아래에 로그 파일이 있습니다(kubelet 이 관리, 로테이션됨).
