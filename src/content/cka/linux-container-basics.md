---
title: 리눅스와 컨테이너 기초
part: 1
order: 1
domain: basics
minutes: 25
summary: 쿠버네티스가 실제로 다루는 것 — 프로세스, 컨테이너 이미지, 런타임, systemd. 시험장 셸에서 길을 잃지 않기 위한 최소한.
goals:
  - 컨테이너가 '격리된 리눅스 프로세스'라는 것을 설명할 수 있다
  - 이미지·레지스트리·태그의 관계와 이미지 오타가 어떤 오류가 되는지 안다
  - systemctl · journalctl · vi 의 기본 사용법을 안다
quiz:
  - q: 컨테이너를 가장 정확하게 설명한 것은?
    options: ["작은 가상머신", "네임스페이스와 cgroup 으로 격리·제한된 리눅스 프로세스", "도커 전용 파일 형식", "쿠버네티스가 만든 가상 CPU"]
    answer: 1
    explain: 컨테이너는 커널을 공유하는 일반 프로세스다. 리눅스 네임스페이스로 보이는 범위를 나누고 cgroup 으로 CPU·메모리를 제한한다.
  - q: "`nginx:1.27` 에서 `1.27` 은?"
    options: ["레지스트리 주소", "태그", "네임스페이스", "포트"]
    answer: 1
    explain: "이미지 이름은 [레지스트리/]저장소[:태그] 이다. 태그를 생략하면 latest 가 쓰인다."
  - q: 현재 쿠버네티스 노드에서 컨테이너를 실제로 실행하는 것은 보통 무엇인가?
    options: ["dockershim", "containerd 같은 CRI 런타임", "kube-proxy", "etcd"]
    answer: 1
    explain: 쿠버네티스 1.24 부터 dockershim 이 제거됐다. kubelet 은 CRI 로 containerd·CRI-O 같은 런타임에 요청한다. 노드에서 컨테이너를 직접 볼 때는 crictl 을 쓴다.
  - q: kubelet 이 왜 멈췄는지 로그를 볼 때 쓰는 명령은?
    options: ["kubectl logs kubelet", "journalctl -u kubelet", "cat /var/log/kube.log", "crictl logs kubelet"]
    answer: 1
    explain: kubelet 은 파드가 아니라 systemd 서비스다. 서비스 로그는 journalctl -u 서비스이름 으로 본다.
---

## 컨테이너 = 격리된 프로세스

가상머신은 운영체제 전체를 하나 더 띄웁니다. 컨테이너는 그렇지 않습니다. **호스트의 커널을 그대로 쓰는 평범한 리눅스 프로세스**인데, 두 가지 장치로 격리합니다.

- **네임스페이스(namespace)** — 프로세스가 **볼 수 있는 범위**를 나눕니다. PID(자기만의 1번 프로세스), 네트워크(자기만의 IP·포트), 마운트(자기만의 파일시스템) 등.
- **cgroup** — 프로세스가 **쓸 수 있는 양**을 제한합니다. CPU, 메모리. 쿠버네티스의 `resources.limits` 가 결국 cgroup 설정이 됩니다. 메모리 제한을 넘으면 커널이 프로세스를 죽이는데, 이것이 **OOMKilled**(종료 코드 137)입니다.

> 쿠버네티스의 "네임스페이스"(`kubectl get ns`)는 리눅스 네임스페이스와 이름만 같고 **전혀 다른 것**입니다. 쿠버네티스 네임스페이스는 리소스 이름을 묶는 논리적인 칸입니다.

## 이미지 · 레지스트리 · 태그

컨테이너는 **이미지**에서 시작합니다. 이미지 이름은 다음 구조입니다.

```
registry.k8s.io/kube-apiserver:v1.35.2
└── 레지스트리 ─┘└─── 저장소 ──┘└ 태그 ┘

nginx:1.27        → docker.io/library/nginx:1.27 (레지스트리 생략 = Docker Hub)
nginx             → nginx:latest (태그 생략 = latest)
```

이미지 이름이나 태그에 오타가 있으면 노드가 이미지를 받지 못해 파드가 **`ErrImagePull` → `ImagePullBackOff`** 상태가 됩니다. 트러블슈팅 문제에서 가장 흔한 원인 중 하나입니다.

## 컨테이너 런타임과 CRI

노드에서 실제로 컨테이너를 띄우는 프로그램이 **컨테이너 런타임**입니다. 요즘은 대부분 **containerd**(또는 CRI-O)입니다. kubelet 은 **CRI(Container Runtime Interface)** 라는 약속된 방식으로 런타임에 "이 파드를 띄워 줘"라고 요청합니다.

노드에서 컨테이너를 직접 볼 때는 `docker` 가 아니라 **`crictl`** 을 씁니다.

```bash
crictl ps            # 실행 중인 컨테이너
crictl ps -a         # 죽은 것까지 — 컨트롤 플레인 장애 때 핵심
crictl logs <ID>     # 컨테이너 로그(API 서버가 죽어서 kubectl 이 안 될 때)
crictl pods          # 파드 샌드박스
```

## systemd — 노드의 서비스 관리자

kubelet 과 containerd 는 파드가 아니라 **리눅스 서비스**입니다. systemd 가 관리합니다.

```bash
systemctl status kubelet        # 상태: active(running)? inactive? failed?
systemctl start|stop|restart kubelet
systemctl enable kubelet        # 부팅할 때 자동 시작
systemctl enable --now kubelet  # 자동 시작 등록 + 지금 시작
systemctl daemon-reload         # 서비스 설정 파일을 고친 뒤 '다시 읽기'
journalctl -u kubelet           # 서비스 로그
journalctl -u kubelet -n 50 --no-pager   # 마지막 50줄
```

> **daemon-reload 를 잊지 마세요.** `/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf` 같은 서비스 설정 파일을 고쳤다면, `systemctl daemon-reload` 를 해야 systemd 가 새 내용을 읽습니다. 안 하고 restart 만 하면 **옛 설정으로 다시 뜹니다.**

## 시험장에서 꼭 필요한 셸 기술

```bash
ssh node01                  # 다른 노드로 이동 — 끝나면 exit 로 돌아오기
sudo -i                     # root 로 전환(시험장에서 자주 필요)
cat 파일 | grep -i error     # 찾기
kubectl get pods > /opt/out.txt   # 결과를 파일로(문제에서 자주 요구)
echo "값" > 파일              # 덮어쓰기
echo "값" >> 파일             # 이어 쓰기
```

**vi(vim) 최소 사용법** — 시험장 편집기는 vi 입니다.

| 할 일 | 키 |
|---|---|
| 입력 시작 / 끝 | `i` / `Esc` |
| 저장하고 나가기 | `:wq` (또는 `ZZ`) |
| 저장 안 하고 나가기 | `:q!` |
| 한 줄 삭제 · 복사 · 붙여넣기 | `dd` · `yy` · `p` |
| 찾기 | `/단어` 후 `n` |
| 되돌리기 | `u` |

YAML 은 들여쓰기가 생명이라 붙여넣을 때 들여쓰기가 계단처럼 밀릴 수 있습니다. 시험 시작하자마자 `~/.vimrc` 에 다음 한 줄을 넣어 두는 사람이 많습니다.

```vim
set expandtab tabstop=2 shiftwidth=2
```

붙여넣기 전에 `:set paste` 를 하면 자동 들여쓰기가 꺼집니다.
