---
title: 볼륨 · PV · PVC · StorageClass
part: 5
order: 1
domain: storage
minutes: 30
summary: 파드의 수명을 넘는 저장소. PV 와 PVC 가 묶이는 조건, 접근 모드, 반환 정책, StorageClass 와 동적 프로비저닝, 볼륨 확장.
goals:
  - emptyDir · hostPath · PVC 볼륨의 차이를 안다
  - PV 와 PVC 를 만들어 묶고 파드에 마운트할 수 있다
  - 접근 모드와 반환 정책을 설명할 수 있다
  - StorageClass 를 만들고 기본값을 바꾸고, PVC 를 확장할 수 있다
labs: [s1, s2, s3, s4]
quiz:
  - q: PVC 가 PV 에 묶이는(Bound) 조건이 아닌 것은?
    options: ["storageClassName 이 같다", "PV 의 접근 모드가 PVC 가 요청한 모드를 포함한다", "PV 용량이 요청 이상이다", "PV 와 PVC 가 같은 네임스페이스다"]
    answer: 3
    explain: PV 는 클러스터 범위 리소스라 네임스페이스가 없다. PVC 만 네임스페이스에 속한다.
  - q: "reclaimPolicy: Retain 인 PV 에서 PVC 를 지우면?"
    options: ["PV 와 데이터가 함께 지워진다", "PV 는 Released 상태로 남고 데이터도 남는다", "PV 가 곧바로 다른 PVC 에 묶인다", "오류가 난다"]
    answer: 1
    explain: Retain 은 관리자가 직접 정리할 때까지 남긴다. Released 상태의 PV 는 claimRef 를 지우기 전까지 새 PVC 에 묶이지 않는다. Delete 면 PV(와 실제 디스크)가 지워진다.
  - q: "volumeBindingMode: WaitForFirstConsumer 인 StorageClass 로 PVC 만 만들면 상태는?"
    options: ["Bound", "Pending (파드가 쓸 때까지 기다림)", "Lost", "오류"]
    answer: 1
    explain: 파드가 스케줄되어 어느 노드인지 정해진 뒤 그 노드에 맞게 볼륨을 만든다. 로컬 디스크처럼 노드에 묶인 저장소에 필요하다.
  - q: ReadWriteOnce 의 정확한 뜻은?
    options: ["한 파드만 쓸 수 있다", "한 노드에서만 읽기·쓰기로 마운트할 수 있다(같은 노드의 파드들은 공유 가능)", "한 번만 쓸 수 있다", "읽기 전용"]
    answer: 1
    explain: RWO 는 노드 단위다. 파드 하나로 제한하려면 ReadWriteOncePod(RWOP)를 쓴다.
---

## 볼륨의 세 부류

| 볼륨 | 수명 | 쓰임 |
|---|---|---|
| `emptyDir` | 파드와 같이 사라짐 | 컨테이너 간 공유, 임시 파일 |
| `hostPath` | 노드에 남음(노드에 묶임) | 노드 파일 접근, 실습용 PV |
| `configMap`·`secret`·`projected` | — | 설정 주입 |
| `persistentVolumeClaim` | 파드와 무관하게 남음 | **데이터 보존** |

## PV · PVC · StorageClass

```
관리자가 준비            사용자가 요청              파드가 사용
PersistentVolume  ←묶임→  PersistentVolumeClaim  ←  volumes.persistentVolumeClaim
(클러스터 범위)            (네임스페이스)
       ↑ 없으면 StorageClass 가 자동으로 만든다(동적 프로비저닝)
```

### 정적 프로비저닝 — PV 를 직접 만들기

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 1Gi
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /mnt/data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-data
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: manual
  resources:
    requests:
      storage: 500Mi
---
apiVersion: v1
kind: Pod
metadata:
  name: data-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: pvc-data
```

```bash
kubectl get pv,pvc          # STATUS Bound 인지, CLAIM 열에 default/pvc-data
```

### 묶이는 조건

1. **storageClassName 이 같다**(둘 다 비어 있어도 같다고 본다. 단, PVC 에서 이 필드를 아예 생략하면 **기본 StorageClass** 가 들어간다)
2. PV 의 **accessModes 가 요청 모드를 포함**
3. PV **용량 ≥ 요청**(남는 조건 중 가장 작은 PV 를 고른다)
4. (선택) `selector`, `volumeName` 으로 특정 PV 지정

하나라도 어긋나면 PVC 는 `Pending` 이고, 그 PVC 를 쓰는 파드도 `Pending` 입니다. `kubectl describe pvc` 의 이벤트를 보세요.

> PVC 의 spec 은 만든 뒤 **거의 못 바꿉니다**(용량 늘리기만 예외). 접근 모드·클래스가 틀렸으면 지우고 다시 만듭니다. 파드가 쓰고 있으면 PVC 삭제가 끝나지 않으니(보호 장치) 파드도 함께 다시 만듭니다.

## 접근 모드

| 모드 | 약자 | 뜻 |
|---|---|---|
| ReadWriteOnce | RWO | **한 노드**에서 읽기·쓰기 |
| ReadOnlyMany | ROX | 여러 노드에서 읽기 |
| ReadWriteMany | RWX | 여러 노드에서 읽기·쓰기(NFS·CephFS 등 필요) |
| ReadWriteOncePod | RWOP | **한 파드**에서만 읽기·쓰기 |

## 반환 정책(reclaimPolicy)

PVC 를 지웠을 때 PV 를 어떻게 할지.

| 정책 | 결과 |
|---|---|
| `Retain` | PV 가 `Released` 로 남음, 데이터 보존. 재사용하려면 관리자가 정리(claimRef 제거) |
| `Delete` | PV 와 실제 저장소 삭제(동적 프로비저닝 기본값) |

```bash
kubectl patch pv pv-data -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
```

## StorageClass — 동적 프로비저닝

PVC 를 만들면 **provisioner** 가 알맞은 PV 를 자동으로 만들어 줍니다.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"   # 기본 클래스로
provisioner: rancher.io/local-path       # CSI 드라이버 이름 등
reclaimPolicy: Retain                    # 기본 Delete
volumeBindingMode: WaitForFirstConsumer  # 기본 Immediate
allowVolumeExpansion: true
parameters: {}                           # 드라이버별 옵션
```

| volumeBindingMode | 동작 |
|---|---|
| `Immediate` | PVC 를 만들자마자 PV 를 만들고 묶는다 |
| `WaitForFirstConsumer` | 파드가 스케줄될 때까지 기다린다(노드에 묶인 저장소에 필수) |

**기본 클래스는 하나만** 두세요. 새 클래스를 기본으로 만들 때는 옛 기본값의 어노테이션을 `"false"` 로 바꿉니다.

```bash
kubectl get sc                            # NAME 옆에 (default)
kubectl patch sc local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
```

## 볼륨 확장

StorageClass 가 `allowVolumeExpansion: true` 면 PVC 의 요청 용량을 **늘릴 수** 있습니다(줄이기는 불가).

```bash
kubectl patch pvc grow-pvc -p '{"spec":{"resources":{"requests":{"storage":"2Gi"}}}}'
kubectl get pvc grow-pvc
```

파일시스템 확장이 파드 재시작 뒤에 끝나는 드라이버도 있습니다. `kubectl describe pvc` 의 조건(`FileSystemResizePending`)을 봅니다.

## StatefulSet 의 volumeClaimTemplates

StatefulSet 은 파드마다 **자기 PVC** 를 자동으로 만듭니다(`data-web-0`, `data-web-1` …). 파드가 다시 만들어져도 같은 PVC 에 다시 붙습니다.

```yaml
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 1Gi
```
