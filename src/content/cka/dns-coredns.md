---
title: 클러스터 DNS 와 CoreDNS
part: 4
order: 2
domain: network
minutes: 20
summary: 서비스·파드의 DNS 이름 규칙, 파드의 resolv.conf, CoreDNS 의 배치와 Corefile, 이름 해석이 안 될 때 확인 순서.
goals:
  - 서비스 FQDN 과 짧은 이름이 어떻게 해석되는지 설명할 수 있다
  - CoreDNS 디플로이먼트·서비스·ConfigMap 을 찾아 상태를 확인할 수 있다
  - DNS 장애의 흔한 원인을 좁힐 수 있다
labs: [n8, t9]
quiz:
  - q: 네임스페이스 data 의 서비스 db-svc 의 FQDN 은?
    options: ["db-svc.data", "db-svc.data.svc.cluster.local", "data.db-svc.cluster.local", "db-svc.cluster.local"]
    answer: 1
    explain: <서비스>.<네임스페이스>.svc.<클러스터 도메인>. 기본 클러스터 도메인은 cluster.local 이다.
  - q: 같은 네임스페이스의 파드에서 서비스 이름만(db-svc) 으로 접속되는 이유는?
    options: ["hosts 파일 때문", "resolv.conf 의 search 도메인에 <네임스페이스>.svc.cluster.local 이 있어서", "kube-proxy 가 이름을 바꿔서", "우연"]
    answer: 1
    explain: kubelet 이 파드의 /etc/resolv.conf 에 search 목록을 넣는다. 다른 네임스페이스는 db-svc.data 처럼 네임스페이스를 붙여야 한다.
  - q: CoreDNS 설정(Corefile)이 저장된 곳은?
    options: ["/etc/coredns/Corefile (노드)", "kube-system 의 ConfigMap coredns", "etcd 의 dns 키", "kubelet 설정"]
    answer: 1
    explain: kubectl -n kube-system get cm coredns -o yaml 로 본다. 고친 뒤에는 reload 플러그인이 알아서 다시 읽거나 rollout restart 로 반영한다.
  - q: 모든 파드에서 이름 해석이 안 된다. kube-dns 서비스의 엔드포인트가 비어 있다. 원인은?
    options: ["CoreDNS 파드가 없거나 Ready 가 아니다", "노드가 너무 많다", "서비스 타입이 틀렸다", "etcd 백업이 없다"]
    answer: 0
    explain: kube-dns 서비스 뒤의 CoreDNS 파드가 없으면(레플리카 0, 크래시, 스케줄 실패) DNS 서버가 없는 것이다.
---

## 이름 규칙

| 대상 | DNS 이름 |
|---|---|
| 서비스 | `<서비스>.<네임스페이스>.svc.cluster.local` |
| Headless 서비스 뒤의 StatefulSet 파드 | `<파드>.<서비스>.<네임스페이스>.svc.cluster.local` (예. `web-0.nginx.default.svc.cluster.local`) |
| 파드(IP 기반) | `10-244-1-5.<네임스페이스>.pod.cluster.local` |

같은 네임스페이스면 `db-svc`, 다른 네임스페이스면 `db-svc.data` 만 써도 됩니다. 파드의 `/etc/resolv.conf` 를 보면 이유가 나옵니다.

```bash
kubectl exec web -- cat /etc/resolv.conf
# search default.svc.cluster.local svc.cluster.local cluster.local
# nameserver 10.96.0.10          ← kube-dns 서비스 IP
# options ndots:5
```

`search` 목록을 차례로 붙여 조회하기 때문에 짧은 이름이 됩니다. `nameserver` 는 `kube-system` 의 **kube-dns 서비스** IP 이고, 그 뒤에 **CoreDNS 파드**가 있습니다.

## CoreDNS 구성 요소

```bash
kubectl get deploy coredns -n kube-system        # 보통 레플리카 2
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get svc kube-dns -n kube-system           # 10.96.0.10, 53/UDP 53/TCP
kubectl get ep kube-dns -n kube-system            # CoreDNS 파드 IP 가 있어야 한다
kubectl get cm coredns -n kube-system -o yaml     # Corefile
```

```
.:53 {
    errors
    health
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {   ← 클러스터 도메인
       pods insecure
       fallthrough in-addr.arpa ip6.arpa
    }
    forward . /etc/resolv.conf                         ← 바깥 이름은 노드의 DNS 로
    cache 30
    loop
    reload
}
```

## 확인하는 법

```bash
kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- nslookup kubernetes.default
kubectl run tmp --rm -it --image=busybox:1.37 --restart=Never -- nslookup db-svc.data.svc.cluster.local
```

정상이면 `Name: … Address: 10.96.x.x`, 실패하면 두 가지 중 하나입니다.

| 출력 | 뜻 |
|---|---|
| `** server can't find …: NXDOMAIN` | DNS 서버는 응답했지만 그런 이름이 없다 → 서비스 이름·네임스페이스 오타 |
| `;; connection timed out; no servers could be reached` | DNS 서버에 닿지 못했다 → CoreDNS 가 죽었거나, NetworkPolicy 가 53 번 egress 를 막았다 |

## DNS 장애 점검 순서

1. CoreDNS 파드가 Running·Ready 인가? (레플리카 0, CrashLoop, 이미지 오타, Pending)
2. `kube-dns` 서비스의 엔드포인트가 채워져 있나?
3. CoreDNS 로그: `kubectl logs -n kube-system -l k8s-app=kube-dns`
4. Corefile 을 누가 고쳤나? (`cluster.local` 오타, `forward` 대상)
5. 그 파드에 **egress NetworkPolicy** 가 있다면 UDP·TCP 53 을 허용했나?
6. 파드의 `dnsPolicy` 가 `Default` 로 되어 있지 않나?(그러면 클러스터 DNS 를 안 씀. 기본값은 `ClusterFirst`)
