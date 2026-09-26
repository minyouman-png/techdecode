// 쿠버네티스 리소스 레지스트리 — kubectl 이 `pods`·`po`·`pod`·`deployment.apps` 를 전부 같은 것으로
// 알아듣는 것처럼, 시뮬레이터도 이 표 하나로 이름을 푼다.
//
// ⚠️DOM 을 쓰지 않는다. 브라우저와 node(자가검증) 양쪽에서 같은 코드가 돈다.

export const RESOURCES = [
  { kind: 'Pod', plural: 'pods', short: ['po'], ns: true, api: 'v1' },
  { kind: 'Service', plural: 'services', short: ['svc'], ns: true, api: 'v1' },
  { kind: 'Endpoints', plural: 'endpoints', short: ['ep'], ns: true, api: 'v1' },
  { kind: 'ConfigMap', plural: 'configmaps', short: ['cm'], ns: true, api: 'v1' },
  { kind: 'Secret', plural: 'secrets', short: [], ns: true, api: 'v1' },
  { kind: 'ServiceAccount', plural: 'serviceaccounts', short: ['sa'], ns: true, api: 'v1' },
  { kind: 'Namespace', plural: 'namespaces', short: ['ns'], ns: false, api: 'v1' },
  { kind: 'Node', plural: 'nodes', short: ['no'], ns: false, api: 'v1' },
  { kind: 'PersistentVolume', plural: 'persistentvolumes', short: ['pv'], ns: false, api: 'v1' },
  { kind: 'PersistentVolumeClaim', plural: 'persistentvolumeclaims', short: ['pvc'], ns: true, api: 'v1' },
  { kind: 'LimitRange', plural: 'limitranges', short: ['limits'], ns: true, api: 'v1' },
  { kind: 'ResourceQuota', plural: 'resourcequotas', short: ['quota'], ns: true, api: 'v1' },
  { kind: 'Event', plural: 'events', short: ['ev'], ns: true, api: 'v1' },
  { kind: 'Deployment', plural: 'deployments', short: ['deploy'], ns: true, api: 'apps/v1' },
  { kind: 'ReplicaSet', plural: 'replicasets', short: ['rs'], ns: true, api: 'apps/v1' },
  { kind: 'DaemonSet', plural: 'daemonsets', short: ['ds'], ns: true, api: 'apps/v1' },
  { kind: 'StatefulSet', plural: 'statefulsets', short: ['sts'], ns: true, api: 'apps/v1' },
  { kind: 'Job', plural: 'jobs', short: [], ns: true, api: 'batch/v1' },
  { kind: 'CronJob', plural: 'cronjobs', short: ['cj'], ns: true, api: 'batch/v1' },
  { kind: 'HorizontalPodAutoscaler', plural: 'horizontalpodautoscalers', short: ['hpa'], ns: true, api: 'autoscaling/v2' },
  { kind: 'Role', plural: 'roles', short: [], ns: true, api: 'rbac.authorization.k8s.io/v1' },
  { kind: 'RoleBinding', plural: 'rolebindings', short: [], ns: true, api: 'rbac.authorization.k8s.io/v1' },
  { kind: 'ClusterRole', plural: 'clusterroles', short: [], ns: false, api: 'rbac.authorization.k8s.io/v1' },
  { kind: 'ClusterRoleBinding', plural: 'clusterrolebindings', short: [], ns: false, api: 'rbac.authorization.k8s.io/v1' },
  { kind: 'NetworkPolicy', plural: 'networkpolicies', short: ['netpol'], ns: true, api: 'networking.k8s.io/v1' },
  { kind: 'Ingress', plural: 'ingresses', short: ['ing'], ns: true, api: 'networking.k8s.io/v1' },
  { kind: 'IngressClass', plural: 'ingressclasses', short: [], ns: false, api: 'networking.k8s.io/v1' },
  { kind: 'StorageClass', plural: 'storageclasses', short: ['sc'], ns: false, api: 'storage.k8s.io/v1' },
  { kind: 'PriorityClass', plural: 'priorityclasses', short: ['pc'], ns: false, api: 'scheduling.k8s.io/v1' },
  { kind: 'CustomResourceDefinition', plural: 'customresourcedefinitions', short: ['crd', 'crds'], ns: false, api: 'apiextensions.k8s.io/v1' },
  { kind: 'GatewayClass', plural: 'gatewayclasses', short: ['gc'], ns: false, api: 'gateway.networking.k8s.io/v1' },
  { kind: 'Gateway', plural: 'gateways', short: ['gtw'], ns: true, api: 'gateway.networking.k8s.io/v1' },
  { kind: 'HTTPRoute', plural: 'httproutes', short: [], ns: true, api: 'gateway.networking.k8s.io/v1' },
];

/** CRD 로 추가된 종류까지 포함해 이름(복수·단수·약칭·`x.group`)을 리소스 정의로 푼다. */
export function resolveResource(name, extra = []) {
  if (!name) return null;
  let n = String(name).toLowerCase();
  const all = RESOURCES.concat(extra);
  for (const r of all) {
    if (r.plural === n || r.kind.toLowerCase() === n || r.short.includes(n)) return r;
  }
  // deployment.apps · networkpolicies.networking.k8s.io 같은 그룹 표기
  if (n.includes('.')) {
    const head = n.split('.')[0];
    for (const r of all) {
      if (r.plural === head || r.kind.toLowerCase() === head || r.short.includes(head)) return r;
    }
    for (const r of all) if (r.plural + '.' + (r.group || '') === n) return r;
  }
  return null;
}

export function resourceByKind(kind, extra = []) {
  return RESOURCES.concat(extra).find((r) => r.kind === kind) || null;
}

// ─── 수량 단위 ────────────────────────────────────────────────────────────
/** '500m' → 0.5, '2' → 2 (코어) */
export function parseCpu(v) {
  if (v === undefined || v === null || v === '') return 0;
  const s = String(v);
  if (s.endsWith('m')) return parseFloat(s) / 1000;
  return parseFloat(s) || 0;
}
/** '128Mi' → 바이트. Ki/Mi/Gi/Ti 와 K/M/G/T 둘 다 */
export function parseMem(v) {
  if (v === undefined || v === null || v === '') return 0;
  const m = String(v).match(/^([0-9.]+)\s*(Ki|Mi|Gi|Ti|K|M|G|T|k|m)?$/);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  const mul = { Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3, Ti: 1024 ** 4, K: 1e3, k: 1e3, M: 1e6, G: 1e9, T: 1e12, m: 0.001 }[m[2]] || 1;
  return n * mul;
}
export function fmtMem(bytes) {
  if (bytes >= 1024 ** 3 && bytes % (1024 ** 3) === 0) return bytes / 1024 ** 3 + 'Gi';
  if (bytes >= 1024 ** 2) return Math.round(bytes / 1024 ** 2) + 'Mi';
  return Math.round(bytes / 1024) + 'Ki';
}
export function fmtCpu(c) {
  return Math.round(c * 1000) + 'm';
}

// ─── 레이블 셀렉터 ─────────────────────────────────────────────────────────
/** `app=web,tier!=db,env in (a,b),!x,x` 형태의 문자열 셀렉터 */
export function parseSelectorString(s) {
  const out = [];
  if (!s) return out;
  // 괄호 안의 콤마를 보존하며 나눈다
  const parts = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) parts.push(cur);
  for (let p of parts) {
    p = p.trim();
    let m;
    if ((m = p.match(/^([\w./-]+)\s+(in|notin)\s+\((.*)\)$/))) {
      out.push({ key: m[1], operator: m[2] === 'in' ? 'In' : 'NotIn', values: m[3].split(',').map((x) => x.trim()) });
    } else if ((m = p.match(/^([\w./-]+)\s*!=\s*(.*)$/))) {
      out.push({ key: m[1], operator: 'NotIn', values: [m[2]] });
    } else if ((m = p.match(/^([\w./-]+)\s*==?\s*(.*)$/))) {
      out.push({ key: m[1], operator: 'In', values: [m[2]] });
    } else if ((m = p.match(/^!([\w./-]+)$/))) {
      out.push({ key: m[1], operator: 'DoesNotExist' });
    } else if (p) {
      out.push({ key: p, operator: 'Exists' });
    }
  }
  return out;
}

/** LabelSelector 객체(matchLabels/matchExpressions) 또는 서비스식 평면 맵을 레이블에 맞춘다. */
export function matchSelector(sel, labels) {
  labels = labels || {};
  if (!sel) return false;
  if (Array.isArray(sel)) return sel.every((e) => matchExpr(e, labels));
  const isLS = 'matchLabels' in sel || 'matchExpressions' in sel;
  if (!isLS) {
    // Service 의 spec.selector 처럼 평면 맵
    const keys = Object.keys(sel);
    if (!keys.length) return false;
    return keys.every((k) => labels[k] === String(sel[k]));
  }
  const ml = sel.matchLabels || {};
  if (!Object.keys(ml).every((k) => labels[k] === String(ml[k]))) return false;
  return (sel.matchExpressions || []).every((e) => matchExpr(e, labels));
}

/** 빈 LabelSelector(`{}`)는 '전부'를 뜻한다 — NetworkPolicy 의 podSelector: {} */
export function matchLabelSelectorAllowEmpty(sel, labels) {
  if (!sel) return true;
  const ml = sel.matchLabels || {};
  const me = sel.matchExpressions || [];
  if (!Object.keys(ml).length && !me.length) return true;
  return matchSelector({ matchLabels: ml, matchExpressions: me }, labels);
}

function matchExpr(e, labels) {
  const has = Object.prototype.hasOwnProperty.call(labels, e.key);
  const v = labels[e.key];
  const vals = (e.values || []).map(String);
  switch (e.operator) {
    case 'In': return has && vals.includes(v);
    case 'NotIn': return !has || !vals.includes(v);
    case 'Exists': return has;
    case 'DoesNotExist': return !has;
    case 'Gt': return has && Number(v) > Number(vals[0]);
    case 'Lt': return has && Number(v) < Number(vals[0]);
    default: return false;
  }
}

export function clone(o) {
  return o === undefined ? undefined : JSON.parse(JSON.stringify(o));
}

/** JSON Merge Patch(RFC 7386) — kubectl patch --type=merge */
export function mergePatch(target, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return clone(patch);
  const out = target && typeof target === 'object' && !Array.isArray(target) ? clone(target) : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else out[k] = mergePatch(out[k], v);
  }
  return out;
}

/** strategic merge patch 의 흉내 — 이름(name)이 있는 목록은 이름으로 합친다(containers 등). */
export function strategicPatch(target, patch) {
  if (patch === null || typeof patch !== 'object') return clone(patch);
  if (Array.isArray(patch)) {
    if (Array.isArray(target) && patch.every((x) => x && typeof x === 'object' && 'name' in x)) {
      const out = clone(target);
      for (const p of patch) {
        const i = out.findIndex((x) => x && x.name === p.name);
        if (i >= 0) out[i] = strategicPatch(out[i], p);
        else out.push(clone(p));
      }
      return out;
    }
    return clone(patch);
  }
  const out = target && typeof target === 'object' && !Array.isArray(target) ? clone(target) : {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else out[k] = strategicPatch(out[k], v);
  }
  return out;
}
