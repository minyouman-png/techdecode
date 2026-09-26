---
title: etcd 백업과 복구
part: 3
order: 3
domain: arch
minutes: 25
summary: 클러스터 전체가 etcd 한곳에 있다. 인증서 경로를 매니페스트에서 찾아 스냅샷을 찍고, 새 데이터 디렉터리로 복구해 etcd 를 갈아 끼운다.
goals:
  - etcd 매니페스트에서 엔드포인트·인증서 경로를 찾을 수 있다
  - etcdctl 로 스냅샷을 저장하고 etcdutl 로 상태를 확인할 수 있다
  - 스냅샷을 새 데이터 디렉터리로 복구하고 etcd 가 그것을 쓰게 할 수 있다
labs: [a3, a4]
quiz:
  - q: etcdctl snapshot save 에 필요한 인증 정보가 아닌 것은?
    options: ["--cacert", "--cert", "--key", "--token"]
    answer: 3
    explain: etcd 는 상호 TLS 로 인증한다. CA 인증서(--cacert), 클라이언트 인증서(--cert), 그 키(--key)와 엔드포인트가 필요하다.
  - q: 스냅샷 복구(restore) 명령이 하는 일은?
    options: ["실행 중인 etcd 에 데이터를 밀어 넣는다", "스냅샷으로 새 데이터 디렉터리를 만든다(서버 접속 불필요)", "API 서버를 재설치한다", "모든 노드를 재부팅한다"]
    answer: 1
    explain: restore 는 파일만 다룬다. 새 디렉터리에 데이터를 풀어 놓을 뿐이라, etcd 가 그 디렉터리를 쓰도록 매니페스트를 바꿔야 복구가 끝난다.
  - q: 복구 후 etcd 가 새 데이터를 쓰게 하려면 etcd.yaml 에서 무엇을 바꾸나?
    options: ["image", "etcd-data 볼륨의 hostPath.path (또는 --data-dir 과 함께)", "--listen-client-urls", "--name"]
    answer: 1
    explain: 컨테이너 안의 /var/lib/etcd 가 호스트의 어느 디렉터리와 연결되는지를 hostPath 가 정한다. hostPath 를 새 디렉터리로 바꾸는 것이 가장 간단하다.
  - q: 최신 etcd(3.5 이후)에서 스냅샷 상태 확인·복구에 권장되는 도구는?
    options: ["etcdctl", "etcdutl", "kubectl", "kubeadm"]
    answer: 1
    explain: etcdctl 의 snapshot status·restore 는 폐지 예정(deprecated)이고 etcdutl 로 옮겨졌다. 저장(save)은 서버에 접속해야 하므로 여전히 etcdctl 이다.
---

## 왜 etcd 인가

쿠버네티스의 모든 오브젝트(디플로이먼트, 시크릿, RBAC …)는 **etcd 한곳**에 저장됩니다. etcd 스냅샷 하나가 곧 클러스터 설정 전체의 백업입니다(볼륨 안의 데이터는 제외).

## 1. 필요한 값 찾기 — 매니페스트에 다 있다

외우지 마세요. etcd 가 static pod 이니 매니페스트를 봅니다.

```bash
grep -E "listen-client-urls|cert-file|key-file|trusted-ca-file" /etc/kubernetes/manifests/etcd.yaml
#    - --cert-file=/etc/kubernetes/pki/etcd/server.crt
#    - --key-file=/etc/kubernetes/pki/etcd/server.key
#    - --listen-client-urls=https://127.0.0.1:2379,https://172.30.1.2:2379
#    - --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
```

| etcdctl 옵션 | 매니페스트의 값 |
|---|---|
| `--endpoints` | `--listen-client-urls` 중 하나(`https://127.0.0.1:2379`) |
| `--cacert` | `--trusted-ca-file` |
| `--cert` | `--cert-file` |
| `--key` | `--key-file` |

## 2. 백업(스냅샷 저장)

```bash
ETCDCTL_API=3 etcdctl snapshot save /opt/etcd-backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

etcdutl snapshot status /opt/etcd-backup.db -w table     # 확인
```

- `ETCDCTL_API=3` 은 최신 etcdctl 에서는 기본값이라 생략해도 되지만, 붙여서 손해 볼 것은 없습니다.
- 인증서를 빼먹으면 오류가 **`context deadline exceeded`** 로만 나옵니다. "시간 초과"처럼 보이지만 실제로는 인증 실패인 경우가 대부분입니다.
- etcd 는 보통 **컨트롤 플레인 노드**에서만 접근됩니다(127.0.0.1). 다른 노드에 있다면 `ssh` 로 이동하세요.

## 3. 복구

복구는 세 단계입니다: **새 디렉터리에 풀기 → etcd 가 그 디렉터리를 쓰게 하기 → 확인.**

```bash
# ① 스냅샷을 새 데이터 디렉터리로 (서버 접속 불필요 → 인증서 필요 없음)
etcdutl snapshot restore /opt/backup/etcd-snapshot.db --data-dir /var/lib/etcd-restore

# ② etcd 매니페스트의 데이터 볼륨을 새 디렉터리로
vi /etc/kubernetes/manifests/etcd.yaml
```

```yaml
  volumes:
  - hostPath:
      path: /var/lib/etcd-restore     # ← /var/lib/etcd 에서 변경
      type: DirectoryOrCreate
    name: etcd-data
```

```bash
# ③ kubelet 이 etcd(와 API 서버)를 다시 띄울 때까지 1~2분 기다린 뒤
kubectl get pods -n kube-system
kubectl get deploy -A          # 스냅샷 시점의 상태인지
```

> 컨테이너 안의 경로(`--data-dir=/var/lib/etcd`, `mountPath: /var/lib/etcd`)는 그대로 두고 **호스트 경로(hostPath)만** 바꾸는 것이 가장 간단하고 실수가 적습니다. `--data-dir` 까지 바꾸려면 mountPath 도 같이 바꿔야 합니다.

기다리는 동안 `kubectl` 이 안 되는 것은 정상입니다. 오래 걸리면 `crictl ps -a | grep etcd`, `crictl logs <ID>` 로 확인합니다. 이미 있는 디렉터리로 restore 하면 `data-dir … not empty` 오류가 나니 **새 이름**을 쓰세요.

## 요약 카드

```bash
# 백업
etcdctl snapshot save <파일> --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key
# 확인
etcdutl snapshot status <파일> -w table
# 복구
etcdutl snapshot restore <파일> --data-dir <새 디렉터리>
vi /etc/kubernetes/manifests/etcd.yaml     # etcd-data hostPath → 새 디렉터리
```
