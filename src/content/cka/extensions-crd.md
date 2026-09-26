---
title: 확장 인터페이스와 CRD · 오퍼레이터
part: 3
order: 6
domain: arch
minutes: 20
summary: CRI · CNI · CSI 가 각각 무엇을 꽂는 자리인지, CRD 로 새 리소스 종류를 추가하고 오퍼레이터가 그것을 다루는 방식.
goals:
  - CRI · CNI · CSI 의 역할을 구분할 수 있다
  - CRD 를 조회하고, explain 으로 스키마를 보고, 커스텀 리소스를 만들 수 있다
  - 오퍼레이터가 무엇인지 설명할 수 있다
labs: [a10]
quiz:
  - q: 파드에 IP 를 주고 노드 간 파드 통신을 연결하는 인터페이스는?
    options: ["CRI", "CNI", "CSI", "CRD"]
    answer: 1
    explain: CNI(Container Network Interface). Calico·Cilium·Flannel 이 CNI 플러그인이다.
  - q: 클라우드 디스크나 NFS 같은 저장소를 쿠버네티스에 연결하는 표준 인터페이스는?
    options: ["CRI", "CNI", "CSI", "CEL"]
    answer: 2
    explain: CSI(Container Storage Interface). StorageClass 의 provisioner 가 CSI 드라이버 이름인 경우가 많다(예. ebs.csi.aws.com).
  - q: CRD 를 설치하면 생기는 것은?
    options: ["새 노드", "새 리소스 종류(kind)를 다루는 API", "새 네임스페이스", "새 컨트롤 플레인"]
    answer: 1
    explain: CRD 는 API 서버에 새 리소스 종류를 등록한다. kubectl get/apply 로 다룰 수 있지만, 그것을 보고 실제 일을 하는 것은 별도의 컨트롤러(오퍼레이터)다.
  - q: 커스텀 리소스 Backup(그룹 stable.example.com, 버전 v1)의 apiVersion 은?
    options: ["v1", "stable.example.com/v1", "backups/v1", "apiextensions.k8s.io/v1"]
    answer: 1
    explain: apiVersion 은 <그룹>/<버전>. apiextensions.k8s.io/v1 은 CRD 자신의 apiVersion 이다.
---

## 세 개의 플러그 자리: CRI · CNI · CSI

쿠버네티스는 컨테이너 실행, 네트워크, 저장소를 **직접 구현하지 않고** 표준 인터페이스로 외부 플러그인에 맡깁니다.

| 인터페이스 | 무엇을 | 누가 부르나 | 대표 구현 |
|---|---|---|---|
| **CRI** (Container Runtime Interface) | 컨테이너 실행 | kubelet | containerd, CRI-O |
| **CNI** (Container Network Interface) | 파드 IP · 노드 간 파드 네트워크 · (정책) | kubelet(런타임 경유) | Calico, Cilium, Flannel |
| **CSI** (Container Storage Interface) | 볼륨 생성·연결·마운트 | 컨트롤러·kubelet | AWS EBS CSI, Ceph, NFS CSI, local-path |

확인할 곳:

```bash
kubectl get nodes -o wide                          # CONTAINER-RUNTIME 열
cat /var/lib/kubelet/config.yaml | grep -i containerRuntimeEndpoint
ls /etc/cni/net.d/                                 # 설치된 CNI 설정
kubectl get pods -n kube-system                    # calico-node, cilium … DaemonSet
kubectl get csidrivers                             # 설치된 CSI 드라이버
kubectl get storageclass                           # PROVISIONER 열
```

## CRD — 새 리소스 종류 추가하기

**CRD(CustomResourceDefinition)** 를 설치하면 API 서버에 새 `kind` 가 생깁니다. Gateway API, cert-manager 의 `Certificate`, Argo CD 의 `Application` 이 모두 CRD 입니다.

```bash
kubectl get crd
kubectl get crd | grep gateway
kubectl api-resources --api-group=stable.example.com
kubectl explain backup.spec                # CRD 에 스키마가 있으면 필드 설명이 나온다
kubectl get backups -A
```

CRD 의 핵심 부분:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: backups.stable.example.com       # <복수형>.<그룹>
spec:
  group: stable.example.com
  scope: Namespaced                      # 또는 Cluster
  names:
    kind: Backup
    plural: backups
    singular: backup
    shortNames: [bk]
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: [schedule]
            properties:
              schedule: {type: string}
              retention: {type: integer}
```

커스텀 리소스 만들기:

```yaml
apiVersion: stable.example.com/v1        # <그룹>/<버전>
kind: Backup
metadata:
  name: nightly
spec:
  schedule: "0 2 * * *"
  retention: 7
```

## 오퍼레이터

CRD 는 **데이터 모양**만 정합니다. `Backup` 을 만들어도 저절로 백업이 되지는 않습니다. 그 리소스를 지켜보다가 실제 일을 하는 **컨트롤러**가 있어야 하고, 특정 소프트웨어의 운영 지식을 담은 이런 컨트롤러를 **오퍼레이터(operator)** 라고 부릅니다.

```
kubectl apply  Backup/nightly  →  API 서버(etcd 에 저장)
                                     ↑ 지켜보기(watch)
                                 백업 오퍼레이터(보통 디플로이먼트로 도는 파드)
                                     → 크론 설정, 스냅샷 실행, status 갱신
```

Deployment 컨트롤러가 Deployment 를 보고 ReplicaSet 을 만드는 것과 **같은 원리(조정 루프)** 입니다. 오퍼레이터는 Helm 차트나 매니페스트로 설치하는 경우가 많고, 설치하면 CRD + 컨트롤러 디플로이먼트 + RBAC 가 함께 들어옵니다.

시험에서는 "설치된 CRD 목록을 파일로", "특정 CRD 의 필드를 확인해 커스텀 리소스 만들기", "오퍼레이터를 Helm 으로 설치" 같은 형태로 나올 수 있습니다.
