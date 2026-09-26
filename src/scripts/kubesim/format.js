// kubectl 출력 형식 — 표(get), YAML/JSON, jsonpath, custom-columns, 나이(AGE) 표기.
import yaml from 'js-yaml';
import { podStatusText, isReady } from './engine.js';
import { parseMem, fmtMem } from './resources.js';

export function age(sec) {
  sec = Math.max(0, Math.floor(sec));
  if (sec < 120) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 10) return `${m}m${sec % 60 ? (sec % 60) + 's' : ''}`;
  if (m < 180) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 8) return `${h}h${m % 60 ? (m % 60) + 'm' : ''}`;
  if (h < 48) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 8) return `${d}d${h % 24 ? (h % 24) + 'h' : ''}`;
  return `${d}d`;
}
export function objAge(cluster, o) {
  const t = Date.parse((o.metadata || {}).creationTimestamp || '') / 1000;
  return isNaN(t) ? '<unknown>' : age(cluster.now() - t);
}

export function table(headers, rows) {
  if (!rows.length) return '';
  const w = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
  const line = (r) => r.map((c, i) => (i === r.length - 1 ? String(c ?? '') : String(c ?? '').padEnd(w[i] + 3))).join('').replace(/\s+$/, '');
  return [line(headers), ...rows.map(line)].join('\n');
}

const KEY_ORDER = ['apiVersion', 'kind', 'metadata', 'spec', 'data', 'stringData', 'type', 'rules', 'roleRef', 'subjects', 'provisioner', 'parameters', 'reclaimPolicy', 'volumeBindingMode', 'allowVolumeExpansion', 'value', 'globalDefault', 'description', 'preemptionPolicy', 'subsets', 'status'];
const META_ORDER = ['annotations', 'creationTimestamp', 'generateName', 'labels', 'name', 'namespace', 'ownerReferences', 'resourceVersion', 'uid'];
export function ordered(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return o;
  const out = {};
  for (const k of KEY_ORDER) if (k in o) out[k] = k === 'metadata' ? orderMeta(o[k]) : o[k];
  for (const k of Object.keys(o)) if (!(k in out)) out[k] = o[k];
  return out;
}
function orderMeta(m) {
  if (!m) return m;
  const out = {};
  for (const k of META_ORDER) if (k in m) out[k] = m[k];
  for (const k of Object.keys(m)) if (!(k in out)) out[k] = m[k];
  return out;
}
// ⚠️kubectl 의 -o yaml 은 키를 **알파벳순**으로, 목록은 **들여쓰지 않고** 찍는다(Go map 직렬화).
//   시험 문서·출력과 모양이 같아야 눈에 익는다.
export function toYaml(o) {
  return yaml.dump(JSON.parse(JSON.stringify(o)), { lineWidth: -1, noRefs: true, sortKeys: true, noArrayIndent: true }).replace(/\n$/, '');
}
export function toJson(o) {
  return JSON.stringify(ordered(o), null, 4);
}
export function listWrap(items) {
  return { apiVersion: 'v1', items: items.map(ordered), kind: 'List', metadata: { resourceVersion: '' } };
}

// ─── jsonpath (kubectl 이 쓰는 부분집합) ─────────────────────────────────────
function jpSegments(path) {
  const segs = [];
  let i = 0;
  path = path.trim();
  if (path.startsWith('$')) path = path.slice(1);
  while (i < path.length) {
    const ch = path[i];
    if (ch === '.') {
      if (path[i + 1] === '.') { i += 2; let n = ''; while (i < path.length && /[\w-]/.test(path[i])) n += path[i++]; segs.push({ deep: n }); continue; }
      i++;
      let n = '';
      while (i < path.length && path[i] !== '.' && path[i] !== '[') n += path[i++];
      if (n) segs.push({ field: n });
    } else if (ch === '[') {
      let depth = 1, j = i + 1;
      while (j < path.length && depth) { if (path[j] === '[') depth++; if (path[j] === ']') depth--; j++; }
      const inner = path.slice(i + 1, j - 1).trim();
      i = j;
      if (inner === '*') segs.push({ all: true });
      else if (/^-?\d+$/.test(inner)) segs.push({ index: Number(inner) });
      else if (/^-?\d*:-?\d*$/.test(inner)) { const [a, b] = inner.split(':'); segs.push({ slice: [a === '' ? 0 : Number(a), b === '' ? undefined : Number(b)] }); }
      else if (/^'.*'$|^".*"$/.test(inner)) segs.push({ field: inner.slice(1, -1) });
      else if (inner.startsWith('?')) segs.push({ filter: inner.replace(/^\?\(|\)$/g, '') });
      else segs.push({ field: inner });
    } else {
      let n = '';
      while (i < path.length && path[i] !== '.' && path[i] !== '[') n += path[i++];
      if (n) segs.push({ field: n });
    }
  }
  return segs;
}
function jpFilter(expr, item) {
  const m = expr.match(/^@\.([\w.]+)\s*(==|!=|>|<)\s*(.*)$/);
  if (!m) { const e = expr.match(/^@\.([\w.]+)$/); return e ? getPath(item, e[1]) !== undefined : false; }
  const v = getPath(item, m[1]);
  let rhs = m[3].trim().replace(/^["']|["']$/g, '');
  switch (m[2]) {
    case '==': return String(v) === rhs;
    case '!=': return String(v) !== rhs;
    case '>': return Number(v) > Number(rhs);
    case '<': return Number(v) < Number(rhs);
  }
  return false;
}
function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
export function jpEval(root, path) {
  let cur = [root];
  for (const s of jpSegments(path)) {
    const next = [];
    for (const c of cur) {
      if (c == null) continue;
      if (s.field !== undefined) { if (c[s.field] !== undefined) next.push(c[s.field]); }
      else if (s.all) { if (Array.isArray(c)) next.push(...c); else if (typeof c === 'object') next.push(...Object.values(c)); }
      else if (s.index !== undefined) { if (Array.isArray(c)) { const v = c[s.index < 0 ? c.length + s.index : s.index]; if (v !== undefined) next.push(v); } }
      else if (s.slice) { if (Array.isArray(c)) next.push(...c.slice(s.slice[0], s.slice[1])); }
      else if (s.filter) { if (Array.isArray(c)) next.push(...c.filter((x) => jpFilter(s.filter, x))); }
      else if (s.deep !== undefined) {
        const walk = (x) => { if (x && typeof x === 'object') { if (s.deep in x) next.push(x[s.deep]); for (const v of Object.values(x)) walk(v); } };
        walk(c);
      }
    }
    cur = next;
  }
  return cur;
}
function jpStr(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
/** `{.items[*].metadata.name}` · `{range .items[*]}{.metadata.name}{"\n"}{end}` 템플릿 */
export function jsonpathTemplate(root, tpl) {
  tpl = tpl.trim().replace(/^['"]|['"]$/g, '');
  const toks = [];
  let i = 0;
  while (i < tpl.length) {
    if (tpl[i] === '{') {
      let depth = 1, j = i + 1, q = null;
      while (j < tpl.length && depth) {
        const ch = tpl[j];
        if (q) { if (ch === q) q = null; }
        else if (ch === '"' || ch === "'") q = ch;
        else if (ch === '{') depth++;
        else if (ch === '}') depth--;
        j++;
      }
      toks.push({ expr: tpl.slice(i + 1, j - 1).trim() });
      i = j;
    } else {
      let j = i;
      while (j < tpl.length && tpl[j] !== '{') j++;
      toks.push({ text: tpl.slice(i, j) });
      i = j;
    }
  }
  let pos = 0;
  const run = (ctx, stopAtEnd) => {
    let out = '';
    while (pos < toks.length) {
      const t = toks[pos++];
      if (t.text !== undefined) { out += t.text; continue; }
      const e = t.expr;
      if (e === 'end') { if (stopAtEnd) return out; continue; }
      if (e.startsWith('range ')) {
        const items = jpEval(ctx, e.slice(6).trim());
        const start = pos;
        let body = '';
        if (!items.length) { run(ctx, true); continue; }
        for (const it of items) { pos = start; body += run(it, true); }
        out += body;
        continue;
      }
      if (/^".*"$|^'.*'$/.test(e)) { out += e.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t'); continue; }
      const vals = jpEval(ctx, e.startsWith('.') || e.startsWith('$') || e.startsWith('[') ? e : '.' + e);
      out += vals.map(jpStr).join(' ');
    }
    return out;
  };
  return run(root, false);
}

export function customColumns(items, spec) {
  const cols = spec.split(',').map((c) => { const i = c.indexOf(':'); return { h: c.slice(0, i), p: c.slice(i + 1) }; });
  const rows = items.map((o) => cols.map((c) => { const v = jpEval(o, c.p.startsWith('.') ? c.p : '.' + c.p); return v.length ? v.map(jpStr).join(',') : '<none>'; }));
  return table(cols.map((c) => c.h), rows);
}

// ─── get 표 ────────────────────────────────────────────────────────────────
const none = (v) => (v === undefined || v === null || v === '' ? '<none>' : v);
function ports(svc) {
  return (svc.spec.ports || []).map((p) => `${p.port}${p.nodePort ? ':' + p.nodePort : ''}/${p.protocol || 'TCP'}`).join(',') || '<none>';
}
function selStr(sel) {
  if (!sel) return '<none>';
  const m = sel.matchLabels || (sel.matchExpressions ? {} : sel);
  const parts = Object.entries(m).map(([k, v]) => `${k}=${v}`);
  for (const e of sel.matchExpressions || []) parts.push(`${e.key} ${e.operator.toLowerCase()} (${(e.values || []).join(',')})`);
  return parts.join(',') || '<none>';
}
function nodeRoles(n) {
  const r = Object.keys(n.metadata.labels || {}).filter((k) => k.startsWith('node-role.kubernetes.io/')).map((k) => k.split('/')[1]);
  return r.join(',') || '<none>';
}
export function nodeStatus(n) {
  const ready = (n.status.conditions || []).find((c) => c.type === 'Ready');
  let s = ready && ready.status === 'True' ? 'Ready' : 'NotReady';
  if (n.spec.unschedulable) s += ',SchedulingDisabled';
  return s;
}

/** 종류별 열 정의 — [머리, 값 함수, wide 전용?] */
export function columnsFor(kind, cluster) {
  const A = (o) => objAge(cluster, o);
  switch (kind) {
    case 'Pod': return [
      ['NAME', (o) => o.metadata.name],
      ['READY', (o) => `${((o.status || {}).containerStatuses || []).filter((c) => c.ready).length}/${o.spec.containers.length}`],
      ['STATUS', (o) => podStatusText(o)],
      ['RESTARTS', (o) => { const r = ((o.status || {}).containerStatuses || []).reduce((a, c) => a + (c.restartCount || 0), 0); return r ? `${r} (${Math.min(59, r * 9)}s ago)` : '0'; }],
      ['AGE', A],
      ['IP', (o) => none((o.status || {}).podIP), true],
      ['NODE', (o) => none(o.spec.nodeName), true],
      ['NOMINATED NODE', () => '<none>', true],
      ['READINESS GATES', () => '<none>', true],
    ];
    case 'Deployment': return [
      ['NAME', (o) => o.metadata.name],
      ['READY', (o) => `${(o.status || {}).readyReplicas || 0}/${o.spec.replicas ?? 1}`],
      ['UP-TO-DATE', (o) => (o.status || {}).updatedReplicas || 0],
      ['AVAILABLE', (o) => (o.status || {}).availableReplicas || 0],
      ['AGE', A],
      ['CONTAINERS', (o) => o.spec.template.spec.containers.map((c) => c.name).join(','), true],
      ['IMAGES', (o) => o.spec.template.spec.containers.map((c) => c.image).join(','), true],
      ['SELECTOR', (o) => selStr(o.spec.selector), true],
    ];
    case 'ReplicaSet': return [
      ['NAME', (o) => o.metadata.name], ['DESIRED', (o) => o.spec.replicas ?? 1], ['CURRENT', (o) => (o.status || {}).replicas || 0],
      ['READY', (o) => (o.status || {}).readyReplicas || 0], ['AGE', A],
      ['CONTAINERS', (o) => o.spec.template.spec.containers.map((c) => c.name).join(','), true],
      ['IMAGES', (o) => o.spec.template.spec.containers.map((c) => c.image).join(','), true],
      ['SELECTOR', (o) => selStr(o.spec.selector), true],
    ];
    case 'DaemonSet': return [
      ['NAME', (o) => o.metadata.name], ['DESIRED', (o) => (o.status || {}).desiredNumberScheduled || 0], ['CURRENT', (o) => (o.status || {}).currentNumberScheduled || 0],
      ['READY', (o) => (o.status || {}).numberReady || 0], ['UP-TO-DATE', (o) => (o.status || {}).updatedNumberScheduled || 0], ['AVAILABLE', (o) => (o.status || {}).numberAvailable || 0],
      ['NODE SELECTOR', (o) => Object.entries(o.spec.template.spec.nodeSelector || {}).map(([k, v]) => `${k}=${v}`).join(',') || '<none>'], ['AGE', A],
    ];
    case 'StatefulSet': return [['NAME', (o) => o.metadata.name], ['READY', (o) => `${(o.status || {}).readyReplicas || 0}/${o.spec.replicas ?? 1}`], ['AGE', A]];
    case 'Service': return [
      ['NAME', (o) => o.metadata.name], ['TYPE', (o) => o.spec.type || 'ClusterIP'], ['CLUSTER-IP', (o) => o.spec.clusterIP || '<none>'],
      ['EXTERNAL-IP', (o) => (o.spec.type === 'LoadBalancer' ? '<pending>' : (o.spec.externalIPs || []).join(',') || '<none>')],
      ['PORT(S)', ports], ['AGE', A], ['SELECTOR', (o) => selStr(o.spec.selector), true],
    ];
    case 'Endpoints': return [['NAME', (o) => o.metadata.name], ['ENDPOINTS', (o) => {
      const l = (o.subsets || []).flatMap((s) => s.addresses.flatMap((a) => s.ports.map((p) => `${a.ip}:${p.port}`)));
      return l.length ? (l.length > 3 ? l.slice(0, 3).join(',') + ` + ${l.length - 3} more...` : l.join(',')) : '<none>';
    }], ['AGE', A]];
    case 'Node': return [
      ['NAME', (o) => o.metadata.name], ['STATUS', nodeStatus], ['ROLES', nodeRoles], ['AGE', A], ['VERSION', (o) => o.status.nodeInfo.kubeletVersion],
      ['INTERNAL-IP', (o) => (o.status.addresses.find((a) => a.type === 'InternalIP') || {}).address, true], ['EXTERNAL-IP', () => '<none>', true],
      ['OS-IMAGE', (o) => o.status.nodeInfo.osImage, true], ['KERNEL-VERSION', (o) => o.status.nodeInfo.kernelVersion, true], ['CONTAINER-RUNTIME', (o) => o.status.nodeInfo.containerRuntimeVersion, true],
    ];
    case 'Namespace': return [['NAME', (o) => o.metadata.name], ['STATUS', () => 'Active'], ['AGE', A]];
    case 'ConfigMap': return [['NAME', (o) => o.metadata.name], ['DATA', (o) => Object.keys(o.data || {}).length + Object.keys(o.binaryData || {}).length], ['AGE', A]];
    case 'Secret': return [['NAME', (o) => o.metadata.name], ['TYPE', (o) => o.type || 'Opaque'], ['DATA', (o) => Object.keys(o.data || {}).length], ['AGE', A]];
    case 'ServiceAccount': return [['NAME', (o) => o.metadata.name], ['SECRETS', () => 0], ['AGE', A]];
    case 'PersistentVolume': return [
      ['NAME', (o) => o.metadata.name], ['CAPACITY', (o) => (o.spec.capacity || {}).storage], ['ACCESS MODES', (o) => accessModes(o.spec.accessModes)],
      ['RECLAIM POLICY', (o) => o.spec.persistentVolumeReclaimPolicy || 'Retain'], ['STATUS', (o) => (o.status || {}).phase || 'Available'],
      ['CLAIM', (o) => (o.spec.claimRef ? `${o.spec.claimRef.namespace}/${o.spec.claimRef.name}` : '')], ['STORAGECLASS', (o) => o.spec.storageClassName || ''],
      ['VOLUMEATTRIBUTESCLASS', () => '<unset>'], ['REASON', () => ''], ['AGE', A],
    ];
    case 'PersistentVolumeClaim': return [
      ['NAME', (o) => o.metadata.name], ['STATUS', (o) => (o.status || {}).phase || 'Pending'], ['VOLUME', (o) => ((o.status || {}).phase === 'Bound' ? o.spec.volumeName : '')],
      ['CAPACITY', (o) => ((o.status || {}).capacity || {}).storage || ''], ['ACCESS MODES', (o) => ((o.status || {}).phase === 'Bound' ? accessModes(o.status.accessModes) : '')],
      ['STORAGECLASS', (o) => o.spec.storageClassName ?? '<unset>'], ['VOLUMEATTRIBUTESCLASS', () => '<unset>'], ['AGE', A],
    ];
    case 'StorageClass': return [
      ['NAME', (o) => o.metadata.name + ((o.metadata.annotations || {})['storageclass.kubernetes.io/is-default-class'] === 'true' ? ' (default)' : '')],
      ['PROVISIONER', (o) => o.provisioner], ['RECLAIMPOLICY', (o) => o.reclaimPolicy || 'Delete'], ['VOLUMEBINDINGMODE', (o) => o.volumeBindingMode || 'Immediate'],
      ['ALLOWVOLUMEEXPANSION', (o) => String(!!o.allowVolumeExpansion)], ['AGE', A],
    ];
    case 'Job': return [
      ['NAME', (o) => o.metadata.name], ['STATUS', (o) => { const c = ((o.status || {}).conditions || [])[0]; return c ? c.type : 'Running'; }],
      ['COMPLETIONS', (o) => `${(o.status || {}).succeeded || 0}/${o.spec.completions ?? 1}`], ['DURATION', (o) => ((o.status || {}).completionTime ? '5s' : objAge(cluster, o))], ['AGE', A],
    ];
    case 'CronJob': return [
      ['NAME', (o) => o.metadata.name], ['SCHEDULE', (o) => o.spec.schedule], ['TIMEZONE', (o) => o.spec.timeZone || '<none>'], ['SUSPEND', (o) => String(!!o.spec.suspend)],
      ['ACTIVE', () => 0], ['LAST SCHEDULE', () => '<none>'], ['AGE', A],
    ];
    case 'HorizontalPodAutoscaler': return [
      ['NAME', (o) => o.metadata.name], ['REFERENCE', (o) => `${o.spec.scaleTargetRef.kind}/${o.spec.scaleTargetRef.name}`],
      ['TARGETS', (o) => (o.spec.metrics || []).map((m) => `${m.resource.name}: ${((o.status || {}).currentMetrics || [])[0] ? '12' : '<unknown>'}%/${(m.resource.target || {}).averageUtilization}%`).join(', ') || '<none>'],
      ['MINPODS', (o) => o.spec.minReplicas ?? 1], ['MAXPODS', (o) => o.spec.maxReplicas], ['REPLICAS', (o) => (o.status || {}).currentReplicas ?? 0], ['AGE', A],
    ];
    case 'Role': case 'ClusterRole': return [['NAME', (o) => o.metadata.name], ['CREATED AT', (o) => o.metadata.creationTimestamp]];
    case 'RoleBinding': case 'ClusterRoleBinding': return [
      ['NAME', (o) => o.metadata.name], ['ROLE', (o) => `${o.roleRef.kind}/${o.roleRef.name}`], ['AGE', A],
      ['USERS', (o) => (o.subjects || []).filter((s) => s.kind === 'User').map((s) => s.name).join(', '), true],
      ['GROUPS', (o) => (o.subjects || []).filter((s) => s.kind === 'Group').map((s) => s.name).join(', '), true],
      ['SERVICEACCOUNTS', (o) => (o.subjects || []).filter((s) => s.kind === 'ServiceAccount').map((s) => `${s.namespace || o.metadata.namespace}/${s.name}`).join(', '), true],
    ];
    case 'NetworkPolicy': return [['NAME', (o) => o.metadata.name], ['POD-SELECTOR', (o) => selStr(o.spec.podSelector)], ['AGE', A]];
    case 'Ingress': return [
      ['NAME', (o) => o.metadata.name], ['CLASS', (o) => o.spec.ingressClassName || '<none>'], ['HOSTS', (o) => (o.spec.rules || []).map((r) => r.host || '*').join(',') || '*'],
      ['ADDRESS', () => '172.30.2.2'], ['PORTS', (o) => (o.spec.tls ? '80, 443' : '80')], ['AGE', A],
    ];
    case 'IngressClass': return [['NAME', (o) => o.metadata.name], ['CONTROLLER', (o) => o.spec.controller], ['PARAMETERS', () => '<none>'], ['AGE', A]];
    case 'PriorityClass': return [['NAME', (o) => o.metadata.name], ['VALUE', (o) => o.value], ['GLOBAL-DEFAULT', (o) => String(!!o.globalDefault)], ['AGE', A], ['PREEMPTIONPOLICY', (o) => o.preemptionPolicy || 'PreemptLowerPriority']];
    case 'CustomResourceDefinition': return [['NAME', (o) => o.metadata.name], ['CREATED AT', (o) => o.metadata.creationTimestamp]];
    case 'ResourceQuota': return [
      ['NAME', (o) => o.metadata.name], ['AGE', A],
      ['REQUEST', (o) => Object.entries(o.spec.hard || {}).filter(([k]) => !k.startsWith('limits.')).map(([k, v]) => `${k}: ${quotaUsedStr(cluster, o, k)}/${v}`).join(', ')],
      ['LIMIT', (o) => Object.entries(o.spec.hard || {}).filter(([k]) => k.startsWith('limits.')).map(([k, v]) => `${k}: ${quotaUsedStr(cluster, o, k)}/${v}`).join(', ')],
    ];
    case 'LimitRange': return [['NAME', (o) => o.metadata.name], ['CREATED AT', (o) => o.metadata.creationTimestamp]];
    case 'GatewayClass': return [['NAME', (o) => o.metadata.name], ['CONTROLLER', (o) => o.spec.controllerName], ['ACCEPTED', () => 'True'], ['AGE', A]];
    case 'Gateway': return [['NAME', (o) => o.metadata.name], ['CLASS', (o) => o.spec.gatewayClassName], ['ADDRESS', (o) => (((o.status || {}).addresses || [])[0] || {}).value || ''], ['PROGRAMMED', (o) => ((((o.status || {}).conditions || []).find((c) => c.type === 'Programmed')) || {}).status || 'Unknown'], ['AGE', A]];
    case 'HTTPRoute': return [['NAME', (o) => o.metadata.name], ['HOSTNAMES', (o) => JSON.stringify(o.spec.hostnames || [])], ['AGE', A]];
    default: return [['NAME', (o) => o.metadata.name], ['AGE', A]];
  }
}
function quotaUsedStr(cluster, q, k) {
  const u = cluster.quotaUsed(q.metadata.namespace);
  const map = { pods: u.pods, cpu: u['req.cpu'], 'requests.cpu': u['req.cpu'], memory: u['req.memory'], 'requests.memory': u['req.memory'], 'limits.cpu': u['lim.cpu'], 'limits.memory': u['lim.memory'] };
  const v = map[k];
  if (v === undefined) return '0';
  if (/cpu/.test(k)) return Math.round(v * 1000) ? `${Math.round(v * 1000)}m` : '0';
  if (/memory/.test(k)) return v ? fmtMem(v) : '0';
  return String(v);
}
function accessModes(m) {
  return (m || []).map((x) => ({ ReadWriteOnce: 'RWO', ReadOnlyMany: 'ROX', ReadWriteMany: 'RWX', ReadWriteOncePod: 'RWOP' }[x] || x)).join(',');
}
export { accessModes, selStr, parseMem, isReady };
