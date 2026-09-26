// 자격증 학원 · CKA 과정 레지스트리(한국어 전용 — 학습 코너 `learn.ts` 와 같은 이유로 5개 언어로 뿌리지 않는다).
//
// ⚠️강의 본문은 src/content/cka/*.md, 실습 과제는 src/scripts/kubesim/tasks.js 에 있다.
//   여기에는 **묶음(파트)과 학습 계획**만 둔다. 계획이 없는 강의·과제를 가리키면 빌드가 터진다
//   (pages/academy/cka/index.astro 의 검사) — 조용히 깨진 링크가 남지 않게.

export const ACADEMY_URL = '/academy/';
export const CKA_URL = '/academy/cka/';

export const PARTS = [
  { n: 0, title: '오리엔테이션', blurb: '시험이 무엇이고, 이 과정을 어떻게 쓰는지. 실습환경 준비.' },
  { n: 1, title: '기초 체력', blurb: '리눅스·컨테이너·YAML·아키텍처·kubectl. 모든 영역의 바탕.' },
  { n: 2, title: '워크로드 · 스케줄링', blurb: '파드, 디플로이먼트 롤아웃, 설정 주입, 자원, 스케줄링, 오토스케일링.', domain: 'workloads' },
  { n: 3, title: '클러스터 아키텍처 · 설치 · 구성', blurb: 'kubeadm 설치·업그레이드, etcd 백업, RBAC, Helm·Kustomize, CRD.', domain: 'arch' },
  { n: 4, title: '서비스 · 네트워킹', blurb: '서비스, DNS, NetworkPolicy, Ingress 와 Gateway API.', domain: 'network' },
  { n: 5, title: '스토리지', blurb: 'PV·PVC·StorageClass, 접근 모드, 반환 정책, 확장.', domain: 'storage' },
  { n: 6, title: '트러블슈팅', blurb: '앱·클러스터·노드·네트워크 고장 찾기. 가장 큰 30%.', domain: 'trouble' },
  { n: 7, title: '합격 전략', blurb: '시험 당일 루틴과 한 장 요약.' },
] as const;

export const DOMAIN_WEIGHTS = [
  { key: 'trouble', ko: '트러블슈팅', pct: 30 },
  { key: 'arch', ko: '클러스터 아키텍처 · 설치 · 구성', pct: 25 },
  { key: 'network', ko: '서비스 · 네트워킹', pct: 20 },
  { key: 'workloads', ko: '워크로드 · 스케줄링', pct: 15 },
  { key: 'storage', ko: '스토리지', pct: 10 },
];

/** 8주 학습 계획 — 하루 1~2시간 기준. 경험자는 두 주씩 묶어 4주로. */
export const PLAN = [
  { week: 1, focus: '시험 이해 + 기초 체력', lessons: ['exam-guide', 'lab-setup', 'linux-container-basics', 'yaml-basics', 'k8s-architecture', 'kubectl-essentials'], tip: 'kubectl 명령이 손에 붙을 때까지 실습 터미널에서 매일 20분.' },
  { week: 2, focus: '파드와 디플로이먼트', lessons: ['pods', 'deployments', 'configmaps-secrets'], tip: 'YAML 을 손으로 쓰지 말고 dry-run 뼈대에서 시작하는 습관.' },
  { week: 3, focus: '자원·스케줄링·오토스케일링 + 스토리지', lessons: ['resources-probes', 'scheduling', 'autoscaling-jobs', 'volumes-pv-pvc'], tip: 'FailedScheduling 문장을 소리 내어 읽어 보기.' },
  { week: 4, focus: '설치·업그레이드·etcd', lessons: ['kubeadm-install', 'cluster-upgrade', 'etcd-backup'], tip: '가상머신에 진짜 클러스터를 한 번 만들고 업그레이드·복구까지.' },
  { week: 5, focus: 'RBAC · Helm · Kustomize · CRD', lessons: ['rbac', 'helm-kustomize', 'extensions-crd'], tip: 'auth can-i 로 되는 것과 안 되는 것 둘 다 확인.' },
  { week: 6, focus: '네트워킹', lessons: ['services', 'dns-coredns', 'network-policy', 'ingress-gateway'], tip: 'NetworkPolicy 의 AND/OR(- 하나 차이)를 직접 틀려 보기.' },
  { week: 7, focus: '트러블슈팅 집중', lessons: ['troubleshoot-apps', 'troubleshoot-cluster', 'troubleshoot-network'], tip: '트러블슈팅 실습 과제를 힌트 없이 전부.' },
  { week: 8, focus: '실전 — 모의고사와 전략', lessons: ['exam-strategy', 'cheatsheet'], tip: '모의고사 2회 이상 + 시험에 딸린 killer.sh 2회.' },
];

export const PART_OF_DOMAIN: Record<string, string> = { basics: '기초 체력', workloads: '워크로드 · 스케줄링', arch: '아키텍처 · 설치 · 구성', network: '서비스 · 네트워킹', storage: '스토리지', trouble: '트러블슈팅', intro: '오리엔테이션', strategy: '합격 전략' };
