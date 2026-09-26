---
title: 트러블슈팅 ② 클러스터와 노드
part: 6
order: 2
domain: trouble
minutes: 35
summary: kubectl 이 죽었을 때(crictl), 컨트롤 플레인 static pod 고치기, NotReady 노드(kubelet · systemd · 설정 파일), 노드 유지보수(drain).
goals:
  - API 서버가 죽었을 때 crictl 로 원인을 찾을 수 있다
  - 스케줄러·컨트롤러 매니저 장애의 증상을 구분하고 매니페스트를 고칠 수 있다
  - NotReady 노드에서 kubelet 문제를 찾아 고칠 수 있다
  - drain 옵션(ignore-daemonsets · force · delete-emptydir-data)의 뜻을 안다
labs: [t4, t5, t6, t7, t14]
quiz:
  - q: kubectl 이 'connection to the server … was refused' 만 낸다. 무엇으로 조사하나?
    options: ["kubectl describe", "노드에서 crictl ps -a 와 crictl logs", "kubectl logs kube-apiserver", "helm status"]
    answer: 1
    explain: API 서버가 죽으면 kubectl 은 아무것도 못 한다. 런타임에 직접 물어 죽은 apiserver 컨테이너의 로그를 본다. /var/log/pods/ 아래 로그 파일도 볼 수 있다.
  - q: kubelet 드롭인 파일을 고친 뒤 systemctl restart kubelet 만 했더니 여전히 옛 설정으로 뜬다. 빠진 것은?
    options: ["kubeadm reset", "systemctl daemon-reload", "노드 재부팅만 가능", "kubectl uncordon"]
    answer: 1
    explain: systemd 는 유닛 파일을 메모리에 캐시한다. 파일을 고쳤으면 daemon-reload 로 다시 읽게 해야 한다.
  - q: systemctl status kubelet 에 'status=203/EXEC' 가 보인다. 의미는?
    options: ["메모리 부족", "실행 파일을 찾을 수 없다(경로 오류)", "인증서 만료", "네트워크 끊김"]
    answer: 1
    explain: 203/EXEC 는 ExecStart 의 실행 파일을 실행하지 못했다는 뜻이다. 경로 오타가 흔하다(which kubelet 과 비교).
  - q: "drain 이 'cannot delete Pods that declare no controller' 로 멈췄다. 이 파드는?"
    options: ["DaemonSet 파드", "컨트롤러 없이 직접 만든 파드 — --force 로 지우면 다시 생기지 않는다", "static pod", "Job 파드"]
    answer: 1
    explain: 디플로이먼트 등에 속하지 않은 파드는 옮겨지는 게 아니라 사라진다. 그래서 drain 이 확인을 요구하고, --force 로 진행한다.
---

## 증상으로 부품 좁히기

| 증상 | 의심 |
|---|---|
| `kubectl` 전부 `connection refused` | **kube-apiserver**(또는 그 아래 etcd) |
| 새 파드가 **Events 없이** Pending | **kube-scheduler** |
| 레플리카가 안 맞음, 디플로이먼트를 만들어도 RS·파드가 안 생김, 노드 상태가 안 바뀜 | **kube-controller-manager** |
| 특정 노드 `NotReady` | 그 노드의 **kubelet**(또는 런타임, CNI) |
| 서비스로 접속 안 됨(엔드포인트는 정상) | kube-proxy, CNI, NetworkPolicy |
| 이름 해석 안 됨 | CoreDNS([DNS 강의](/academy/cka/dns-coredns/)) |

## 컨트롤 플레인 고치기

```bash
kubectl get pods -n kube-system                         # 살아 있다면 여기서 상태 확인
kubectl logs -n kube-system kube-scheduler-controlplane
kubectl describe pod -n kube-system kube-scheduler-controlplane
```

API 서버가 죽어 kubectl 이 안 되면 **노드에서 런타임에 직접**:

```bash
crictl ps -a | grep -E "apiserver|etcd|scheduler|controller"   # Exited 인 것, ATTEMPT 가 큰 것
crictl logs <컨테이너ID>                                        # 왜 죽었는지
ls /var/log/pods/                                               # 파드별 로그 파일도 있다
```

원인은 거의 항상 **`/etc/kubernetes/manifests/*.yaml` 의 한 줄**입니다.

| 로그 단서 | 흔한 원인 |
|---|---|
| `no such file or directory` | 인증서·kubeconfig 경로 오타(`scheduler.conff`) |
| `unknown flag: --…` | 플래그 이름 오타 |
| `connection refused …:2380` | etcd 주소·포트 오류(클라이언트 포트는 2379) |
| `executable file not found` | command 첫 줄(바이너리 이름) 오타 |
| 컨테이너 자체가 없음 | YAML 문법 오류 → kubelet 이 파일을 못 읽음(`journalctl -u kubelet` 에 나옴) |

고치고 저장하면 kubelet 이 알아서 다시 띄웁니다. 1분쯤 기다렸다가 `kubectl get pods -n kube-system` 으로 확인합니다.

> **매니페스트를 백업하고 고치세요.** `cp kube-apiserver.yaml /root/kube-apiserver.yaml.bak` — 단, 백업을 **같은 폴더에 두면 안 됩니다.** kubelet 이 그것도 static pod 로 띄우려 합니다.

## NotReady 노드

```bash
kubectl get nodes
kubectl describe node node01 | grep -A8 Conditions   # "Kubelet stopped posting node status"
ssh node01
systemctl status kubelet          # inactive? failed? activating(auto-restart)?
journalctl -u kubelet -n 30 --no-pager
```

| 발견 | 해결 |
|---|---|
| `inactive (dead)` | `systemctl enable --now kubelet` (enable 까지 — 재부팅 대비) |
| `status=203/EXEC` | 드롭인의 `ExecStart` 경로 오타 → 고치고 **`daemon-reload`** → restart |
| `unable to load client CA file …` | `/var/lib/kubelet/config.yaml` 의 인증서 경로 오류 |
| `failed to load kubelet config file` | config.yaml 문법 오류 |
| `container runtime is down` | `systemctl status containerd` |
| `swap` 관련 | `swapoff -a` |

kubelet 관련 파일 위치:

```
/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf   ← 서비스 설정(ExecStart, 환경변수)
/var/lib/kubelet/config.yaml                                ← kubelet 설정(staticPodPath, clusterDNS …)
/var/lib/kubelet/kubeadm-flags.env                          ← kubeadm 이 넣은 추가 플래그
/etc/kubernetes/kubelet.conf                                ← API 서버 접속용 kubeconfig
```

> 드롭인 경로는 배포판·설치 방식에 따라 `/etc/systemd/system/kubelet.service.d/` 일 수도 있습니다. `systemctl status kubelet` 의 **Drop-In:** 줄이 실제 위치를 알려 줍니다.

## 노드 유지보수: cordon · drain · uncordon

```bash
kubectl cordon node02                      # 새 파드만 금지
kubectl drain node02 --ignore-daemonsets   # 금지 + 기존 파드 내보내기
kubectl uncordon node02                    # 복구
```

drain 이 거부하는 경우와 옵션:

| 메시지 | 옵션 | 뜻 |
|---|---|---|
| `cannot delete DaemonSet-managed Pods` | `--ignore-daemonsets` | DS 파드는 남겨 둔다(어차피 노드마다 있어야 함) |
| `cannot delete Pods that declare no controller` | `--force` | 컨트롤러 없는 파드는 **영영 사라진다** |
| `cannot delete Pods with local storage` | `--delete-emptydir-data` | emptyDir 데이터가 지워진다 |
| `Cannot evict pod as it would violate the pod's disruption budget` | (기다리거나 PDB 조정) | PodDisruptionBudget 이 막음 |

static pod(mirror pod)는 drain 대상이 아닙니다.
