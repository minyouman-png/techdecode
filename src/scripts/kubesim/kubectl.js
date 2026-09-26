// kubectl 명령 구현. 입력은 이미 토큰으로 나뉜 인자 배열, 출력은 { out, err }.
//
// ⚠️오류 메시지는 **실제 kubectl 문구를 그대로** 쓴다. 시험장에서 마주칠 문장을 여기서 먼저
//   읽어 봐야 당황하지 않는다(예: `selector` does not match template `labels`,
//   pod updates may not change fields other than …, cannot delete DaemonSet-managed Pods …).
import yaml from 'js-yaml';
import { clone, mergePatch, strategicPatch, parseSelectorString, matchSelector, parseCpu, parseMem, fmtMem } from './resources.js';
import { K8S_VERSION, podStatusText, isReady, b64d, b64e, parseImage, key as okey } from './engine.js';
import { table, columnsFor, toYaml, toJson, listWrap, jsonpathTemplate, customColumns, objAge, age, nodeStatus, accessModes, selStr, jpEval } from './format.js';

const VALUE_FLAGS = new Set(['namespace', 'output', 'selector', 'filename', 'container', 'image', 'replicas', 'port', 'target-port', 'type', 'name', 'labels', 'env', 'restart', 'from-literal', 'from-file', 'from-env-file', 'tcp', 'node-port', 'verb', 'resource', 'resource-name', 'role', 'clusterrole', 'user', 'group', 'serviceaccount', 'schedule', 'rule', 'class', 'value', 'description', 'hard', 'to-revision', 'revision', 'min', 'max', 'cpu-percent', 'cpu', 'memory', 'sort-by', 'field-selector', 'as', 'as-group', 'grace-period', 'timeout', 'context', 'from', 'requests', 'limits', 'patch', 'protocol', 'cert', 'key', 'docker-server', 'docker-username', 'docker-password', 'docker-email', 'duration', 'kustomize', 'external-ip', 'cluster-ip', 'preemption-policy', 'current-replicas', 'tail', 'since', 'overrides', 'image-pull-policy', 'session-affinity', 'for', 'namespaced', 'field-manager', 'template', 'cascade', 'limit', 'label-columns', 'default-backend', 'annotation', 'pod-running-timeout', 'api-group', 'subresource', 'selector-labels', 'priority-class-name', 'current-context', 'server', 'certificate-authority', 'cluster', 'kubeconfig', 'token', 'filename', 'save-config']);
const SHORT = { n: 'namespace', o: 'output', l: 'selector', f: 'filename', c: 'container', A: 'all-namespaces', k: 'kustomize', R: 'recursive', w: 'watch', h: 'help', i: 'stdin', t: 'tty', L: 'label-columns', q: 'quiet' };
const OPT_VALUE = new Set(['dry-run', 'overwrite', 'record', 'show-labels', 'force', 'all', 'ignore-daemonsets', 'delete-emptydir-data', 'global-default', 'expose', 'rm', 'wait', 'now', 'ignore-not-found', 'show-kind', 'previous', 'containers', 'no-headers', 'current', 'local', 'list', 'recursive', 'all-namespaces', 'stdin', 'tty', 'quiet', 'include-uninitialized', 'raw', 'minify', 'follow', 'timestamps', 'validate', 'save-config', 'print-join-command', 'insecure-skip-tls-verify', 'use-protocol-buffers']);

export function parseArgs(argv, sub = '') {
  const pos = [], flags = {}, dash = [];
  const set = (k, v) => { (flags[k] = flags[k] || []).push(v); };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { dash.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('--') && a.length > 2) {
      const eq = a.indexOf('=');
      const k = eq > 0 ? a.slice(2, eq) : a.slice(2);
      if (eq > 0) { set(k, a.slice(eq + 1)); continue; }
      if (VALUE_FLAGS.has(k) && !OPT_VALUE.has(k) && i + 1 < argv.length) { set(k, argv[++i]); continue; }
      set(k, 'true');
      continue;
    }
    if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) {
      const c = a[1];
      if (c === 'p') {
        if (sub === 'patch') { set('patch', a.length > 2 ? a.slice(2) : argv[++i]); continue; }
        set('previous', 'true'); continue;
      }
      const long = SHORT[c];
      if (!long) { // -it 같은 묶음
        for (const ch of a.slice(1)) if (SHORT[ch]) set(SHORT[ch], 'true');
        continue;
      }
      if (['namespace', 'output', 'selector', 'filename', 'container', 'kustomize', 'label-columns'].includes(long)) {
        let v = a.slice(2);
        if (v.startsWith('=')) v = v.slice(1);
        if (!v) v = argv[++i];
        set(long, v);
        continue;
      }
      for (const ch of a.slice(1)) if (SHORT[ch]) set(SHORT[ch], 'true');
      continue;
    }
    pos.push(a);
  }
  const f = (k) => (flags[k] ? flags[k][flags[k].length - 1] : undefined);
  const fa = (k) => flags[k] || [];
  const b = (k) => { const v = f(k); return v !== undefined && v !== 'false'; };
  return { pos, flags, dash, f, fa, b };
}

const R = (out = '', err = '') => ({ out, err });
const NF = (res, name) => `Error from server (NotFound): ${res.plural}${res.group ? '.' + res.group : groupOf(res) ? '.' + groupOf(res) : ''} "${name}" not found`;
function groupOf(r) { return r.api.includes('/') ? r.api.split('/')[0] : ''; }
export function typeName(r) { return r.kind.toLowerCase() + (groupOf(r) ? '.' + groupOf(r) : ''); }
function nfShort(r, name) { return `Error from server (NotFound): ${r.plural}${groupOf(r) ? '.' + groupOf(r) : ''} "${name}" not found`; }
function nsMsg(ns) { return ns ? `No resources found in ${ns} namespace.` : 'No resources found'; }

// ─── 진입점 ────────────────────────────────────────────────────────────────
export function kubectl(argv, io) {
  const c = io.cluster;
  const sub = argv[0];
  if (!sub || sub === 'help' || sub === '--help' || sub === '-h') return R(HELP);
  const a = parseArgs(argv.slice(1), sub);
  if (a.b('help')) return R(HELP);
  // API 서버가 죽으면 kubectl 은 아무것도 못 한다(config·version 클라이언트 부분만 예외)
  const clientOnly = ['config', 'version', 'kustomize', 'completion', 'explain-local'];
  if (!clientOnly.includes(sub) && !(sub === 'create' && a.b('dry-run') && a.f('dry-run') !== 'server') && !(sub === 'run' && a.b('dry-run')) && !c.apiUp()) {
    return R('', 'The connection to the server 172.30.1.2:6443 was refused - did you specify the right host or port?');
  }
  const ctxName = a.f('context');
  if (ctxName && !c.contexts.some((x) => x.name === ctxName)) return R('', `error: context "${ctxName}" does not exist`);
  const fn = CMDS[sub];
  if (!fn) return R('', `error: unknown command "${sub}" for "kubectl"\n\nDid you mean this?\n\t${Object.keys(CMDS).find((k) => k.startsWith(sub[0])) || 'get'}`);
  try {
    c.reconcile(); // 그사이 파일(static pod 매니페스트 등)이 바뀌었을 수 있다 — kubelet 이 먼저 반영한다
    const r = fn(a, io, c);
    c.reconcile();
    return r;
  } catch (e) {
    if (e && e.kerr) return R('', e.kerr);
    throw e;
  }
}
const fail = (msg) => { const e = new Error(msg); e.kerr = msg; throw e; };

function nsOf(a, c) { return a.f('namespace') || c.ns; }

/** `pods`, `pod/x`, `pods,svc`, `deploy x y` → [{res, name?}] */
function targets(a, c, { allowAll = true } = {}) {
  const pos = a.pos;
  if (!pos.length) return [];
  const out = [];
  if (pos[0].includes('/')) {
    for (const p of pos) {
      const [t, n] = p.split('/');
      const res = c.resolve(t);
      if (!res) fail(`error: the server doesn't have a resource type "${t}"`);
      out.push({ res, name: n });
    }
    return out;
  }
  const types = pos[0].split(',');
  const names = pos.slice(1);
  for (const t of types) {
    if (t === 'all' && allowAll) {
      for (const k of ['pods', 'services', 'daemonsets', 'deployments', 'replicasets', 'statefulsets', 'horizontalpodautoscalers', 'cronjobs', 'jobs']) out.push({ res: c.resolve(k), all: true });
      continue;
    }
    const res = c.resolve(t);
    if (!res) fail(`error: the server doesn't have a resource type "${t}"`);
    if (names.length) for (const n of names) out.push({ res, name: n });
    else out.push({ res });
  }
  return out;
}

function fieldSel(o, fs) {
  if (!fs) return true;
  return fs.split(',').every((cond) => {
    const m = cond.match(/^([\w.]+)\s*(!=|==|=)\s*(.*)$/);
    if (!m) return true;
    const v = String(jpEval(o, '.' + m[1])[0] ?? '');
    return m[2] === '!=' ? v !== m[3] : v === m[3];
  });
}
function selMatch(o, sel) {
  if (!sel) return true;
  return matchSelector(parseSelectorString(sel), o.metadata.labels || {});
}

// ─── get ───────────────────────────────────────────────────────────────────
function cmdGet(a, io, c) {
  if (a.fa('filename').length) {
    const docs = loadFiles(a, io);
    const items = docs.map((d) => { const r = c.resolve(d.kind); return r && c.get(r.kind, d.metadata.namespace || nsOf(a, c), d.metadata.name); }).filter(Boolean);
    return render(a, c, items.map((o) => ({ res: c.resOf(o.kind), o })), { single: items.length === 1 });
  }
  if (!a.pos.length) return R('', 'You must specify the type of resource to get. Use "kubectl api-resources" for a complete list of supported resources.\n\nerror: Required resource not specified.\nUse "kubectl explain <resource>" for a detailed description of that resource (e.g. kubectl explain pods).\nSee \'kubectl get -h\' for help and examples');
  const allNs = a.b('all-namespaces');
  const ns = allNs ? null : nsOf(a, c);
  const ts = targets(a, c);
  if (ts.length && ts[0].res.kind === 'Event') return getEvents(a, c, ns);
  const found = [];
  const errs = [];
  const multiType = new Set(ts.map((t) => t.res.kind)).size > 1 || ts.some((t) => t.all);
  for (const t of ts) {
    if (t.name) {
      const o = c.get(t.res.kind, t.res.ns ? ns || 'default' : '', t.name);
      if (!o) errs.push(nfShort(t.res, t.name)); else found.push({ res: t.res, o });
    } else {
      let items = c.list(t.res.kind, t.res.ns ? ns : null).filter((o) => selMatch(o, a.f('selector')) && fieldSel(o, a.f('field-selector')));
      if (t.all && t.res.kind === 'Service' && !allNs) items = items.filter((o) => o.metadata.namespace === ns);
      for (const o of items) found.push({ res: t.res, o });
    }
  }
  const single = ts.length === 1 && !!ts[0].name;
  const r = render(a, c, found, { single, multiType, allNs, ns });
  if (!found.length && !errs.length && !r.out) {
    const clusterScoped = ts.length && ts.every((t) => !t.res.ns);
    return R('', nsMsg(allNs || clusterScoped ? '' : ns));
  }
  return R(r.out, [r.err, ...errs].filter(Boolean).join('\n'));
}

function sortItems(items, sortBy) {
  if (!sortBy) return items;
  const p = sortBy.replace(/^['"{]+|['"}]+$/g, '');
  const val = (o) => { const v = jpEval(o, p.startsWith('.') ? p : '.' + p)[0]; return v; };
  const num = (v) => { if (typeof v === 'number') return v; const s = String(v ?? ''); if (/^[\d.]+(Ki|Mi|Gi|Ti|m|K|M|G)?$/.test(s)) return /m$/.test(s) ? parseCpu(s) : parseMem(s); if (/^\d{4}-\d\d-\d\dT/.test(s)) return Date.parse(s); return null; };
  return items.slice().sort((x, y) => {
    const a = val(x.o || x), b = val(y.o || y);
    const na = num(a), nb = num(b);
    if (na !== null && nb !== null) return na - nb;
    return String(a ?? '').localeCompare(String(b ?? ''));
  });
}

function render(a, c, found, opt = {}) {
  const out = a.f('output') || '';
  found = sortItems(found, a.f('sort-by'));
  const objs = found.map((f) => f.o);
  if (out === 'yaml' || out === 'json') {
    if (!objs.length) return R('');
    const v = opt.single && objs.length === 1 ? objs[0] : listWrap(objs);
    return R(out === 'yaml' ? toYaml(v) : toJson(v));
  }
  if (out === 'name') return R(found.map((f) => `${typeName(f.res)}/${f.o.metadata.name}`).join('\n'));
  if (out.startsWith('jsonpath') || out.startsWith('go-template')) {
    const tpl = out.replace(/^jsonpath(-as-json)?=?/, '');
    if (!tpl) return R('', 'error: template format specified but no template given');
    const root = opt.single && objs.length === 1 ? objs[0] : listWrap(objs);
    try { return R(jsonpathTemplate(root, tpl)); } catch (e) { return R('', `error: error parsing jsonpath ${tpl}, ${e.message}`); }
  }
  if (out.startsWith('custom-columns=')) return R(customColumns(objs, out.slice('custom-columns='.length)));
  if (out && out !== 'wide') return R('', `error: unable to match a printer suitable for the output format "${out}", allowed formats are: custom-columns,custom-columns-file,go-template,go-template-file,json,jsonpath,jsonpath-as-json,jsonpath-file,name,template,templatefile,wide,yaml`);
  // 표
  const groups = [];
  for (const f of found) {
    let g = groups.find((x) => x.kind === f.res.kind);
    if (!g) groups.push(g = { kind: f.res.kind, res: f.res, items: [] });
    g.items.push(f.o);
  }
  const blocks = groups.map((g) => {
    let cols = columnsFor(g.kind, c).filter((col) => out === 'wide' || !col[2]);
    if (a.b('show-labels')) cols = cols.concat([['LABELS', (o) => Object.entries(o.metadata.labels || {}).map(([k, v]) => `${k}=${v}`).join(',') || '<none>']]);
    for (const L of a.fa('label-columns').flatMap((x) => x.split(','))) cols = cols.concat([[L.toUpperCase().split('/').pop(), (o) => (o.metadata.labels || {})[L] || '']]);
    const heads = cols.map((x) => x[0]);
    const rows = g.items.map((o) => cols.map((col, i) => { let v = col[1](o); if (i === 0 && (opt.multiType)) v = `${typeName(g.res)}/${v}`; return v; }));
    if (opt.allNs && g.res.ns) { heads.unshift('NAMESPACE'); rows.forEach((r, i) => r.unshift(g.items[i].metadata.namespace)); }
    let t = table(heads, rows);
    if (a.b('no-headers')) t = t.split('\n').slice(1).join('\n');
    return t;
  });
  return R(blocks.join('\n\n'));
}

function getEvents(a, c, ns) {
  const evs = c.events.filter((e) => !ns || e.ns === ns);
  if (!evs.length) return R('', nsMsg(ns));
  const rows = evs.map((e) => [age(c.now() - e.t), e.type, e.reason, `${e.kind.toLowerCase()}/${e.name}`, e.message]);
  const heads = ['LAST SEEN', 'TYPE', 'REASON', 'OBJECT', 'MESSAGE'];
  if (!ns) { heads.unshift('NAMESPACE'); rows.forEach((r, i) => r.unshift(evs[i].ns)); }
  return R(table(heads, rows));
}

// ─── describe ──────────────────────────────────────────────────────────────
const FROM = { Scheduled: 'default-scheduler', FailedScheduling: 'default-scheduler', SuccessfulCreate: 'replicaset-controller', SuccessfulDelete: 'replicaset-controller', FailedCreate: 'replicaset-controller', ScalingReplicaSet: 'deployment-controller', ProvisioningSucceeded: 'persistentvolume-controller', FailedBinding: 'persistentvolume-controller', WaitForFirstConsumer: 'persistentvolume-controller', FailedMount: 'kubelet' };
function eventsBlock(c, o) {
  const evs = c.eventsFor(o);
  if (!evs.length) return 'Events:                      <none>';
  const rows = evs.slice(-12).map((e) => [e.type, e.reason, age(c.now() - e.t), FROM[e.reason] || (o.kind === 'Pod' ? 'kubelet' : `${o.kind.toLowerCase()}-controller`), e.message]);
  return 'Events:\n' + table(['Type', 'Reason', 'Age', 'From', 'Message'], [['----', '------', '----', '----', '-------'], ...rows]).split('\n').map((l) => '  ' + l).join('\n');
}
const kv = (k, v, w = 18) => `${(k + ':').padEnd(w)}${v}`;
function mapLines(m, w = 18, ind = 0) {
  const e = Object.entries(m || {});
  if (!e.length) return '<none>';
  return e.map(([k, v], i) => (i ? ' '.repeat(w + ind) : '') + `${k}=${v}`).join('\n');
}
function describe(a, io, c) {
  const ns = nsOf(a, c);
  const ts = targets(a, c);
  if (!ts.length) return R('', 'error: You must specify the type of resource to describe. Use "kubectl api-resources" for a complete list of supported resources.');
  const blocks = [];
  const errs = [];
  for (const t of ts) {
    let objs;
    if (t.name) {
      const o = c.get(t.res.kind, t.res.ns ? ns : '', t.name) || (t.res.ns ? c.list(t.res.kind, ns).find((x) => x.metadata.name.startsWith(t.name)) : null);
      if (!o) { errs.push(nfShort(t.res, t.name)); continue; }
      objs = [o];
    } else objs = c.list(t.res.kind, t.res.ns ? (a.b('all-namespaces') ? null : ns) : null).filter((o) => selMatch(o, a.f('selector')));
    for (const o of objs) blocks.push(describeObj(c, o));
  }
  if (!blocks.length && !errs.length) return R('', nsMsg(ns));
  return R(blocks.join('\n\n\n'), errs.join('\n'));
}
function describeObj(c, o) {
  const m = o.metadata;
  const head = [kv('Name', m.name), ...(m.namespace ? [kv('Namespace', m.namespace)] : [])];
  if (o.kind === 'Pod') return describePod(c, o);
  if (o.kind === 'Node') return describeNode(c, o);
  const L = [...head, kv('Labels', mapLines(m.labels)), kv('Annotations', mapLines(m.annotations))];
  if (o.kind === 'Deployment') {
    const s = o.status || {};
    L.push(kv('CreationTimestamp', m.creationTimestamp), kv('Selector', selStr(o.spec.selector)),
      kv('Replicas', `${o.spec.replicas ?? 1} desired | ${s.updatedReplicas || 0} updated | ${s.replicas || 0} total | ${s.availableReplicas || 0} available | ${(s.replicas || 0) - (s.availableReplicas || 0)} unavailable`),
      kv('StrategyType', (o.spec.strategy || {}).type || 'RollingUpdate'), kv('MinReadySeconds', o.spec.minReadySeconds || 0));
    if (((o.spec.strategy || {}).type || 'RollingUpdate') === 'RollingUpdate') L.push(kv('RollingUpdateStrategy', `${((o.spec.strategy || {}).rollingUpdate || {}).maxUnavailable ?? '25%'} max unavailable, ${((o.spec.strategy || {}).rollingUpdate || {}).maxSurge ?? '25%'} max surge`));
    L.push('Pod Template:', podTemplateBlock(o.spec.template, '  '));
    const rss = c.ownedBy('ReplicaSet', o);
    const cur = rss.find((r) => (r.spec.replicas || 0) > 0 && r.metadata.annotations['deployment.kubernetes.io/revision'] === m.annotations['deployment.kubernetes.io/revision']);
    L.push('Conditions:', '  Type           Status  Reason', '  ----           ------  ------', ...(s.conditions || []).map((x) => `  ${x.type.padEnd(15)}${x.status.padEnd(8)}${x.reason || ''}`));
    L.push(kv('OldReplicaSets', rss.filter((r) => r !== cur && r.spec.replicas).map((r) => `${r.metadata.name} (${r.status ? r.status.replicas : 0}/${r.spec.replicas} replicas created)`).join(', ') || '<none>'));
    L.push(kv('NewReplicaSet', cur ? `${cur.metadata.name} (${(cur.status || {}).replicas || 0}/${cur.spec.replicas} replicas created)` : '<none>'));
  } else if (o.kind === 'Service') {
    const ep = c.get('Endpoints', m.namespace, m.name);
    const epl = ep && ep.subsets ? ep.subsets.flatMap((s) => s.addresses.flatMap((ad) => s.ports.map((p) => `${ad.ip}:${p.port}`))).join(',') : '<none>';
    L.push(kv('Selector', o.spec.selector ? Object.entries(o.spec.selector).map(([k, v]) => `${k}=${v}`).join(',') : '<none>'), kv('Type', o.spec.type || 'ClusterIP'), kv('IP Family Policy', 'SingleStack'), kv('IP Families', 'IPv4'), kv('IP', o.spec.clusterIP), kv('IPs', o.spec.clusterIP));
    for (const p of o.spec.ports || []) {
      L.push(kv('Port', `${p.name || '<unset>'}  ${p.port}/${p.protocol || 'TCP'}`), kv('TargetPort', `${p.targetPort}/${p.protocol || 'TCP'}`));
      if (p.nodePort) L.push(kv('NodePort', `${p.name || '<unset>'}  ${p.nodePort}/${p.protocol || 'TCP'}`));
      L.push(kv('Endpoints', epl));
    }
    L.push(kv('Session Affinity', o.spec.sessionAffinity || 'None'), kv('Internal Traffic Policy', 'Cluster'));
  } else if (o.kind === 'PersistentVolumeClaim') {
    L.push(kv('StorageClass', o.spec.storageClassName ?? ''), kv('Status', (o.status || {}).phase || 'Pending'), kv('Volume', o.spec.volumeName || ''), kv('Capacity', ((o.status || {}).capacity || {}).storage || ''), kv('Access Modes', accessModes((o.status || {}).accessModes || [])), kv('VolumeMode', o.spec.volumeMode || 'Filesystem'),
      kv('Used By', c.list('Pod', m.namespace).filter((p) => (p.spec.volumes || []).some((v) => v.persistentVolumeClaim && v.persistentVolumeClaim.claimName === m.name)).map((p) => p.metadata.name).join('\n' + ' '.repeat(18)) || '<none>'));
  } else if (o.kind === 'PersistentVolume') {
    L.push(kv('StorageClass', o.spec.storageClassName || ''), kv('Status', (o.status || {}).phase), kv('Claim', o.spec.claimRef ? `${o.spec.claimRef.namespace}/${o.spec.claimRef.name}` : ''), kv('Reclaim Policy', o.spec.persistentVolumeReclaimPolicy || 'Retain'), kv('Access Modes', accessModes(o.spec.accessModes)), kv('VolumeMode', o.spec.volumeMode || 'Filesystem'), kv('Capacity', (o.spec.capacity || {}).storage),
      'Source:', o.spec.hostPath ? `    Type:          HostPath (bare host directory volume)\n    Path:          ${o.spec.hostPath.path}` : o.spec.local ? `    Type:  LocalVolume (a persistent volume backed by local storage on a node)\n    Path:  ${o.spec.local.path}` : '    Type:  (other)');
  } else if (o.kind === 'Role' || o.kind === 'ClusterRole') {
    const rows = (o.rules || []).map((r) => [(r.resources || r.nonResourceURLs || []).map((x) => x + ((r.apiGroups || [''])[0] ? '.' + r.apiGroups[0] : '')).join(', '), (r.nonResourceURLs || []).join(', ') ? r.nonResourceURLs.join(',') : '[]', r.resourceNames ? `[${r.resourceNames.join(' ')}]` : '[]', `[${(r.verbs || []).join(' ')}]`]);
    L.push('PolicyRule:', table(['  Resources', 'Non-Resource URLs', 'Resource Names', 'Verbs'], [['  ---------', '-----------------', '--------------', '-----'], ...rows.map((r) => ['  ' + r[0], r[1], r[2], r[3]])]));
  } else if (o.kind === 'RoleBinding' || o.kind === 'ClusterRoleBinding') {
    L.push('Role:', `  Kind:  ${o.roleRef.kind}`, `  Name:  ${o.roleRef.name}`, 'Subjects:', table(['  Kind', 'Name', 'Namespace'], [['  ----', '----', '---------'], ...(o.subjects || []).map((s) => ['  ' + s.kind, s.name, s.namespace || ''])]));
  } else if (o.kind === 'NetworkPolicy') {
    L.push(kv('Created on', m.creationTimestamp), kv('Spec', ''), `  PodSelector:     ${selStr(o.spec.podSelector) === '<none>' ? '<none> (Allowing the specific traffic to all pods in this namespace)' : selStr(o.spec.podSelector)}`);
    L.push(yamlBlock({ policyTypes: o.spec.policyTypes || ['Ingress'], ingress: o.spec.ingress, egress: o.spec.egress }, '  '));
  } else if (o.kind === 'ConfigMap' || o.kind === 'Secret') {
    L.push(...(o.kind === 'Secret' ? [kv('Type', o.type || 'Opaque')] : []), '', 'Data', '====');
    for (const [k, v] of Object.entries(o.data || {})) L.push(o.kind === 'Secret' ? `${k}:  ${b64d(v).length} bytes` : `${k}:\n----\n${v}\n`);
  } else {
    L.push(yamlBlock(o.spec !== undefined ? { Spec: o.spec } : Object.fromEntries(Object.entries(o).filter(([k]) => !['apiVersion', 'kind', 'metadata', 'status'].includes(k))), ''));
    if (o.status && Object.keys(o.status).length) L.push(yamlBlock({ Status: o.status }, ''));
  }
  L.push(eventsBlock(c, o));
  return L.join('\n');
}
function yamlBlock(o, ind) {
  return yaml.dump(JSON.parse(JSON.stringify(o)), { lineWidth: -1 }).trimEnd().split('\n').map((l) => ind + l).join('\n');
}
function podTemplateBlock(tpl, ind) {
  const L = [`${ind}Labels:  ${mapLines((tpl.metadata || {}).labels, 11, ind.length)}`];
  if ((tpl.spec || {}).serviceAccountName) L.push(`${ind}Service Account:  ${tpl.spec.serviceAccountName}`);
  L.push(`${ind}Containers:`);
  for (const ct of (tpl.spec || {}).containers || []) {
    L.push(`${ind}  ${ct.name}:`, `${ind}    Image:      ${ct.image}`, `${ind}    Port:       ${(ct.ports || []).map((p) => `${p.containerPort}/${p.protocol || 'TCP'}`).join(', ') || '<none>'}`, `${ind}    Host Port:  <none>`);
    const res = ct.resources || {};
    if (res.limits) L.push(`${ind}    Limits:`, ...Object.entries(res.limits).map(([k, v]) => `${ind}      ${k}:  ${v}`));
    if (res.requests) L.push(`${ind}    Requests:`, ...Object.entries(res.requests).map(([k, v]) => `${ind}      ${k}:  ${v}`));
    L.push(`${ind}    Environment:  ${(ct.env || []).length ? '' : '<none>'}`, ...(ct.env || []).map((e) => `${ind}      ${e.name}:  ${'value' in e ? e.value : '<set to the key ...>'}`));
    L.push(`${ind}    Mounts:       ${(ct.volumeMounts || []).length ? '' : '<none>'}`, ...(ct.volumeMounts || []).map((v) => `${ind}      ${v.mountPath} from ${v.name} (${v.readOnly ? 'ro' : 'rw'})`));
  }
  L.push(`${ind}Volumes:         ${((tpl.spec || {}).volumes || []).length ? '' : '<none>'}`, ...((tpl.spec || {}).volumes || []).map((v) => `${ind}  ${v.name}: ${Object.keys(v).filter((k) => k !== 'name')[0]}`));
  L.push(`${ind}Node-Selectors:  ${mapLines((tpl.spec || {}).nodeSelector)}`, `${ind}Tolerations:     ${((tpl.spec || {}).tolerations || []).map(tolStr).join('\n' + ind + ' '.repeat(17)) || '<none>'}`);
  return L.join('\n');
}
function tolStr(t) { return `${t.key || ''}${t.value ? '=' + t.value : ''}${t.effect ? ':' + t.effect : ''}${t.operator === 'Exists' ? ' op=Exists' : ''}`; }
function describePod(c, p) {
  const m = p.metadata, st = p.status || {};
  const host = p.spec.nodeName ? `${p.spec.nodeName}/${st.hostIP || ''}` : '<none>';
  const L = [kv('Name', m.name), kv('Namespace', m.namespace), kv('Priority', p.spec.priority || 0), ...(p.spec.priorityClassName ? [kv('Priority Class Name', p.spec.priorityClassName)] : []), kv('Service Account', p.spec.serviceAccountName || 'default'), kv('Node', host), kv('Start Time', st.startTime || '<none>'),
    kv('Labels', mapLines(m.labels)), kv('Annotations', mapLines(m.annotations)), kv('Status', st.phase || 'Pending'), kv('IP', st.podIP || ''), 'IPs:', st.podIP ? `  IP:  ${st.podIP}` : '  <none>'];
  if (m.ownerReferences && m.ownerReferences.length) L.push(kv('Controlled By', `${m.ownerReferences[0].kind}/${m.ownerReferences[0].name}`));
  const ctrs = (list, statuses, title) => {
    if (!list || !list.length) return;
    L.push(`${title}:`);
    for (const ct of list) {
      const cs = (statuses || []).find((x) => x.name === ct.name) || {};
      const s = cs.state || {};
      L.push(`  ${ct.name}:`, `    Image:          ${ct.image}`, `    Port:           ${(ct.ports || []).map((pp) => `${pp.containerPort}/${pp.protocol || 'TCP'}`).join(', ') || '<none>'}`, '    Host Port:      <none>');
      if (ct.command) L.push('    Command:', ...ct.command.map((x) => `      ${x}`));
      if (ct.args) L.push('    Args:', ...ct.args.map((x) => `      ${x}`));
      if (s.running) L.push('    State:          Running', `      Started:      ${s.running.startedAt}`);
      else if (s.waiting) L.push('    State:          Waiting', `      Reason:       ${s.waiting.reason}`, ...(s.waiting.message ? [`      Message:      ${s.waiting.message}`] : []));
      else if (s.terminated) L.push('    State:          Terminated', `      Reason:       ${s.terminated.reason}`, `      Exit Code:    ${s.terminated.exitCode}`);
      else L.push('    State:          Waiting', '      Reason:       ContainerCreating');
      if (cs.lastState && cs.lastState.terminated) L.push('    Last State:     Terminated', `      Reason:       ${cs.lastState.terminated.reason}`, `      Exit Code:    ${cs.lastState.terminated.exitCode}`);
      L.push(`    Ready:          ${cs.ready ? 'True' : 'False'}`, `    Restart Count:  ${cs.restartCount || 0}`);
      const res = ct.resources || {};
      if (res.limits) L.push('    Limits:', ...Object.entries(res.limits).map(([k, v]) => `      ${k}:     ${v}`));
      if (res.requests) L.push('    Requests:', ...Object.entries(res.requests).map(([k, v]) => `      ${k}:     ${v}`));
      for (const [nm, pr] of [['Liveness', ct.livenessProbe], ['Readiness', ct.readinessProbe], ['Startup', ct.startupProbe]]) {
        if (!pr) continue;
        const how = pr.httpGet ? `http-get http://:${pr.httpGet.port}${pr.httpGet.path || '/'}` : pr.tcpSocket ? `tcp-socket :${pr.tcpSocket.port}` : `exec [${(pr.exec.command || []).join(' ')}]`;
        L.push(`    ${(nm + ':').padEnd(16)}${how} delay=${pr.initialDelaySeconds || 0}s timeout=${pr.timeoutSeconds || 1}s period=${pr.periodSeconds || 10}s #success=1 #failure=${pr.failureThreshold || 3}`);
      }
      const env = ct.env || [];
      L.push(`    Environment:    ${env.length || (ct.envFrom || []).length ? '' : '<none>'}`);
      for (const ef of ct.envFrom || []) L.push(`      ${ef.configMapRef ? 'ConfigMap' : 'Secret'}  ${(ef.configMapRef || ef.secretRef).name}  Optional: false`);
      for (const e of env) L.push(`      ${e.name}:  ${'value' in e ? e.value : e.valueFrom && e.valueFrom.configMapKeyRef ? `<set to the key '${e.valueFrom.configMapKeyRef.key}' of config map '${e.valueFrom.configMapKeyRef.name}'>` : e.valueFrom && e.valueFrom.secretKeyRef ? `<set to the key '${e.valueFrom.secretKeyRef.key}' in secret '${e.valueFrom.secretKeyRef.name}'>` : '(field ref)'}  Optional: false`);
      L.push('    Mounts:', ...(ct.volumeMounts || []).map((v) => `      ${v.mountPath} from ${v.name} (${v.readOnly ? 'ro' : 'rw'})`), `      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-${m.uid.slice(0, 5)} (ro)`);
    }
  };
  ctrs(p.spec.initContainers, st.initContainerStatuses, 'Init Containers');
  ctrs(p.spec.containers, st.containerStatuses, 'Containers');
  L.push('Conditions:', '  Type                        Status', ...(st.conditions || []).map((x) => `  ${x.type.padEnd(28)}${x.status}`));
  L.push('Volumes:');
  for (const v of p.spec.volumes || []) {
    L.push(`  ${v.name}:`);
    if (v.configMap) L.push('    Type:      ConfigMap (a volume populated by a ConfigMap)', `    Name:      ${v.configMap.name}`, `    Optional:  ${!!v.configMap.optional}`);
    else if (v.secret) L.push('    Type:        Secret (a volume populated by a Secret)', `    SecretName:  ${v.secret.secretName}`, `    Optional:    ${!!v.secret.optional}`);
    else if (v.persistentVolumeClaim) L.push('    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)', `    ClaimName:  ${v.persistentVolumeClaim.claimName}`, `    ReadOnly:   ${!!v.persistentVolumeClaim.readOnly}`);
    else if (v.emptyDir) L.push('    Type:       EmptyDir (a temporary directory that shares a pod\'s lifetime)', `    Medium:     ${v.emptyDir.medium || ''}`);
    else if (v.hostPath) L.push('    Type:          HostPath (bare host directory volume)', `    Path:          ${v.hostPath.path}`, `    HostPathType:  ${v.hostPath.type || ''}`);
    else L.push('    Type:  ' + Object.keys(v).filter((k) => k !== 'name')[0]);
  }
  L.push(`  kube-api-access-${m.uid.slice(0, 5)}:`, '    Type:                    Projected (a volume that contains injected data from multiple sources)');
  L.push(kv('QoS Class', st.qosClass || 'BestEffort', 29), kv('Node-Selectors', mapLines(p.spec.nodeSelector, 29), 29));
  const tols = (p.spec.tolerations || []).map(tolStr).concat(['node.kubernetes.io/not-ready:NoExecute op=Exists for 300s', 'node.kubernetes.io/unreachable:NoExecute op=Exists for 300s']);
  L.push(kv('Tolerations', tols.join('\n' + ' '.repeat(29)), 29));
  L.push(eventsBlock(c, p));
  return L.join('\n');
}
function describeNode(c, n) {
  const m = n.metadata;
  const pods = c.list('Pod').filter((p) => p.spec.nodeName === m.name && !['Succeeded', 'Failed'].includes((p.status || {}).phase));
  const req = c.nodeRequested(m.name);
  let lim = { cpu: 0, mem: 0 };
  for (const p of pods) for (const ct of p.spec.containers) { const l = (ct.resources || {}).limits || {}; lim.cpu += parseCpu(l.cpu); lim.mem += parseMem(l.memory) || 0; }
  const cpuA = parseCpu(n.status.allocatable.cpu), memA = parseMem(n.status.allocatable.memory);
  const L = [kv('Name', m.name), kv('Roles', Object.keys(m.labels || {}).filter((k) => k.startsWith('node-role')).map((k) => k.split('/')[1]).join(',') || '<none>'), kv('Labels', mapLines(m.labels)), kv('Annotations', mapLines(m.annotations)), kv('CreationTimestamp', m.creationTimestamp),
    kv('Taints', (n.spec.taints || []).map((t) => `${t.key}${t.value ? '=' + t.value : ''}:${t.effect}`).join('\n' + ' '.repeat(18)) || '<none>'), kv('Unschedulable', String(!!n.spec.unschedulable)),
    'Conditions:', '  Type             Status  Reason                       Message', '  ----             ------  ------                       -------',
    ...(n.status.conditions || []).map((x) => `  ${x.type.padEnd(17)}${x.status.padEnd(8)}${(x.reason || '').padEnd(29)}${x.message || ''}`),
    'Addresses:', ...n.status.addresses.map((ad) => `  ${ad.type}:  ${ad.address}`),
    'Capacity:', `  cpu:     ${n.status.capacity.cpu}`, `  memory:  ${n.status.capacity.memory}`, `  pods:    ${n.status.capacity.pods}`,
    'Allocatable:', `  cpu:     ${n.status.allocatable.cpu}`, `  memory:  ${n.status.allocatable.memory}`, `  pods:    ${n.status.allocatable.pods}`,
    'System Info:', `  Kernel Version:             ${n.status.nodeInfo.kernelVersion}`, `  OS Image:                   ${n.status.nodeInfo.osImage}`, `  Container Runtime Version:  ${n.status.nodeInfo.containerRuntimeVersion}`, `  Kubelet Version:            ${n.status.nodeInfo.kubeletVersion}`,
    kv('PodCIDR', n.spec.podCIDR),
    `Non-terminated Pods:          (${pods.length} in total)`,
    table(['  Namespace', 'Name', 'CPU Requests', 'CPU Limits', 'Memory Requests', 'Memory Limits', 'Age'], [['  ---------', '----', '------------', '----------', '---------------', '-------------', '---'],
      ...pods.map((p) => { const r = p.spec.containers.reduce((acc, ct) => { const rr = (ct.resources || {}).requests || {}, ll = (ct.resources || {}).limits || {}; acc[0] += parseCpu(rr.cpu); acc[1] += parseCpu(ll.cpu); acc[2] += parseMem(rr.memory) || 0; acc[3] += parseMem(ll.memory) || 0; return acc; }, [0, 0, 0, 0]);
        return ['  ' + p.metadata.namespace, p.metadata.name, `${Math.round(r[0] * 1000)}m (${Math.round(r[0] / cpuA * 100)}%)`, `${Math.round(r[1] * 1000)}m (${Math.round(r[1] / cpuA * 100)}%)`, `${r[2] ? fmtMem(r[2]) : 0} (${Math.round(r[2] / memA * 100)}%)`, `${r[3] ? fmtMem(r[3]) : 0} (${Math.round(r[3] / memA * 100)}%)`, objAge(c, p)]; })]),
    'Allocated resources:', '  (Total limits may be over 100 percent, i.e., overcommitted.)', '  Resource           Requests     Limits', '  --------           --------     ------',
    `  cpu                ${Math.round(req.cpu * 1000)}m (${Math.round(req.cpu / cpuA * 100)}%)`.padEnd(34) + `${Math.round(lim.cpu * 1000)}m (${Math.round(lim.cpu / cpuA * 100)}%)`,
    `  memory             ${req.mem ? fmtMem(req.mem) : 0} (${Math.round(req.mem / memA * 100)}%)`.padEnd(34) + `${lim.mem ? fmtMem(lim.mem) : 0} (${Math.round(lim.mem / memA * 100)}%)`];
  const ready = (n.status.conditions || []).find((x) => x.type === 'Ready');
  L.push(ready && ready.status !== 'True' ? 'Events:\n  Type    Reason        Age   From             Message\n  ----    ------        ----  ----             -------\n  Normal  NodeNotReady  1m    node-controller  Node ' + m.name + ' status is now: NodeNotReady' : 'Events:                      <none>');
  return L.join('\n');
}

// ─── 파일 로딩 · 검증 · 적용 ───────────────────────────────────────────────
export function loadYamlText(text, src) {
  let docs;
  try { docs = yaml.loadAll(text).filter((d) => d !== null && d !== undefined); } catch (e) {
    fail(`error: error parsing ${src}: error converting YAML to JSON: yaml: line ${(e.mark && e.mark.line + 1) || '?'}: ${(e.reason || e.message).replace(/\s*\(\d+:\d+\)[\s\S]*/, '')}`);
  }
  const out = [];
  for (const d of docs) {
    if (typeof d !== 'object' || Array.isArray(d)) fail(`error: error validating "${src}": error validating data: invalid object to validate; if you choose to ignore these errors, turn validation off with --validate=false`);
    if (d.kind === 'List' && Array.isArray(d.items)) out.push(...d.items); else out.push(d);
  }
  return out;
}
function loadFiles(a, io) {
  const docs = [];
  for (const f of a.fa('filename')) {
    if (/^https?:\/\//.test(f)) {
      const t = io.fetchUrl && io.fetchUrl(f);
      if (!t) fail(`error: unable to read URL "${f}", server reported 404 Not Found, status code=404`);
      docs.push(...loadYamlText(t, f).map((d) => Object.assign(d, {})));
      continue;
    }
    const st = io.stat(f);
    if (st === 'dir') {
      for (const p of io.listDir(f).filter((x) => /\.(ya?ml|json)$/.test(x))) docs.push(...loadYamlText(io.readFile(p), p));
      continue;
    }
    const t = io.readFile(f);
    if (t === null || t === undefined) fail(`error: the path "${f}" does not exist`);
    docs.push(...loadYamlText(t, f).map((d) => { Object.defineProperty(d, '_src', { value: f, enumerable: false }); return d; }));
  }
  return docs;
}

const META_KEYS = ['name', 'namespace', 'labels', 'annotations', 'generateName', 'ownerReferences', 'finalizers', 'uid', 'resourceVersion', 'creationTimestamp', 'managedFields', 'generation', 'deletionTimestamp', 'deletionGracePeriodSeconds', 'selfLink'];
const POD_SPEC = ['containers', 'initContainers', 'ephemeralContainers', 'volumes', 'restartPolicy', 'terminationGracePeriodSeconds', 'activeDeadlineSeconds', 'dnsPolicy', 'nodeSelector', 'serviceAccountName', 'serviceAccount', 'automountServiceAccountToken', 'nodeName', 'hostNetwork', 'hostPID', 'hostIPC', 'shareProcessNamespace', 'securityContext', 'imagePullSecrets', 'hostname', 'subdomain', 'affinity', 'schedulerName', 'tolerations', 'hostAliases', 'priorityClassName', 'priority', 'dnsConfig', 'readinessGates', 'runtimeClassName', 'enableServiceLinks', 'preemptionPolicy', 'overhead', 'topologySpreadConstraints', 'setHostnameAsFQDN', 'os', 'hostUsers', 'schedulingGates', 'resourceClaims', 'resources'];
const CONTAINER = ['name', 'image', 'command', 'args', 'workingDir', 'ports', 'envFrom', 'env', 'resources', 'resizePolicy', 'restartPolicy', 'volumeMounts', 'volumeDevices', 'livenessProbe', 'readinessProbe', 'startupProbe', 'lifecycle', 'terminationMessagePath', 'terminationMessagePolicy', 'imagePullPolicy', 'securityContext', 'stdin', 'stdinOnce', 'tty'];
const TOP = {
  _default: ['apiVersion', 'kind', 'metadata', 'spec', 'status'],
  ConfigMap: ['apiVersion', 'kind', 'metadata', 'data', 'binaryData', 'immutable'],
  Secret: ['apiVersion', 'kind', 'metadata', 'data', 'stringData', 'type', 'immutable'],
  ServiceAccount: ['apiVersion', 'kind', 'metadata', 'secrets', 'imagePullSecrets', 'automountServiceAccountToken'],
  Role: ['apiVersion', 'kind', 'metadata', 'rules'], ClusterRole: ['apiVersion', 'kind', 'metadata', 'rules', 'aggregationRule'],
  RoleBinding: ['apiVersion', 'kind', 'metadata', 'roleRef', 'subjects'], ClusterRoleBinding: ['apiVersion', 'kind', 'metadata', 'roleRef', 'subjects'],
  StorageClass: ['apiVersion', 'kind', 'metadata', 'provisioner', 'parameters', 'reclaimPolicy', 'volumeBindingMode', 'allowVolumeExpansion', 'mountOptions', 'allowedTopologies'],
  PriorityClass: ['apiVersion', 'kind', 'metadata', 'value', 'globalDefault', 'description', 'preemptionPolicy'],
  Endpoints: ['apiVersion', 'kind', 'metadata', 'subsets'],
};
const SPEC_KEYS = {
  Deployment: ['replicas', 'selector', 'template', 'strategy', 'minReadySeconds', 'revisionHistoryLimit', 'paused', 'progressDeadlineSeconds'],
  Service: ['ports', 'selector', 'clusterIP', 'clusterIPs', 'type', 'externalIPs', 'sessionAffinity', 'loadBalancerIP', 'loadBalancerSourceRanges', 'externalName', 'externalTrafficPolicy', 'healthCheckNodePort', 'publishNotReadyAddresses', 'sessionAffinityConfig', 'ipFamilies', 'ipFamilyPolicy', 'allocateLoadBalancerNodePorts', 'loadBalancerClass', 'internalTrafficPolicy', 'trafficDistribution'],
  PersistentVolumeClaim: ['accessModes', 'selector', 'resources', 'volumeName', 'storageClassName', 'volumeMode', 'dataSource', 'dataSourceRef', 'volumeAttributesClassName'],
  PersistentVolume: ['capacity', 'accessModes', 'persistentVolumeReclaimPolicy', 'storageClassName', 'mountOptions', 'volumeMode', 'nodeAffinity', 'claimRef', 'hostPath', 'local', 'nfs', 'csi', 'iscsi', 'fc', 'awsElasticBlockStore', 'gcePersistentDisk', 'azureDisk', 'azureFile', 'cephfs', 'rbd', 'volumeAttributesClassName'],
  NetworkPolicy: ['podSelector', 'policyTypes', 'ingress', 'egress'],
};
function strictCheck(d) {
  const bad = (path) => fail(`Error from server (BadRequest): error when creating "${d._src || 'STDIN'}": ${d.kind} in version "${(d.apiVersion || '').split('/').pop()}" cannot be handled as a ${d.kind}: strict decoding error: unknown field "${path}"`);
  const top = TOP[d.kind] || (d.kind === 'Service' || SPEC_KEYS[d.kind] || ['Pod', 'DaemonSet', 'StatefulSet', 'Job', 'CronJob', 'ReplicaSet', 'Ingress', 'HorizontalPodAutoscaler', 'Namespace', 'Node', 'ResourceQuota', 'LimitRange'].includes(d.kind) ? TOP._default : null);
  if (top) for (const k of Object.keys(d)) if (!top.includes(k)) bad(k);
  for (const k of Object.keys(d.metadata || {})) if (!META_KEYS.includes(k)) bad('metadata.' + k);
  const checkPod = (spec, pre) => {
    if (!spec || typeof spec !== 'object') return;
    for (const k of Object.keys(spec)) if (!POD_SPEC.includes(k)) bad(`${pre}.${k}`);
    for (const [list, nm] of [[spec.containers, 'containers'], [spec.initContainers, 'initContainers']]) {
      (list || []).forEach((ct, i) => {
        for (const k of Object.keys(ct || {})) if (!CONTAINER.includes(k)) bad(`${pre}.${nm}[${i}].${k}`);
        (ct.ports || []).forEach((p, j) => { if (typeof p.containerPort !== 'number') fail(`Error from server (BadRequest): error when creating "${d._src || 'STDIN'}": ${d.kind} in version "v1" cannot be handled as a ${d.kind}: json: cannot unmarshal string into Go struct field ContainerPort.${pre}.${nm}.ports.containerPort of type int32`); });
      });
    }
  };
  const sp = d.spec || {};
  if (SPEC_KEYS[d.kind]) for (const k of Object.keys(sp)) if (!SPEC_KEYS[d.kind].includes(k)) bad('spec.' + k);
  if (d.kind === 'Pod') checkPod(sp, 'spec');
  if (['Deployment', 'DaemonSet', 'StatefulSet', 'ReplicaSet', 'Job'].includes(d.kind)) {
    checkPod((sp.template || {}).spec, 'spec.template.spec');
    if (sp.replicas !== undefined && typeof sp.replicas !== 'number') fail(`Error from server (BadRequest): error when creating "${d._src || 'STDIN'}": ${d.kind} in version "v1" cannot be handled as a ${d.kind}: json: cannot unmarshal string into Go struct field ${d.kind}Spec.spec.replicas of type int32`);
  }
  if (d.kind === 'CronJob') checkPod((((sp.jobTemplate || {}).spec || {}).template || {}).spec, 'spec.jobTemplate.spec.template.spec');
}

function validate(d, c, src) {
  if (!d.apiVersion || !d.kind) fail(`error: error validating "${src}": error validating data: [apiVersion not set, kind not set]; if you choose to ignore these errors, turn validation off with --validate=false`);
  const r = c.resolve(d.kind) && c.resolve(d.kind).kind === d.kind ? c.resolve(d.kind) : null;
  if (!r || (r.api !== d.apiVersion && !(r.kind === 'HorizontalPodAutoscaler' && /^autoscaling\/v[12]$/.test(d.apiVersion)))) {
    fail(`error: resource mapping not found for name: "${(d.metadata || {}).name}" namespace: "${(d.metadata || {}).namespace || ''}" from "${src}": no matches for kind "${d.kind}" in version "${d.apiVersion}"\nensure CRDs are installed first`);
  }
  if (!d.metadata || !d.metadata.name) fail(`error: error when retrieving current configuration of:\nResource: "${r.plural}", GroupVersionKind: "${d.apiVersion}, Kind=${d.kind}"\nfrom server for: "${src}": resource name may not be empty`);
  if (!/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(d.metadata.name)) fail(`The ${d.kind} "${d.metadata.name}" is invalid: metadata.name: Invalid value: "${d.metadata.name}": a lowercase RFC 1123 subdomain must consist of lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character`);
  strictCheck(d);
  const inv = (field, msg) => fail(`The ${d.kind} "${d.metadata.name}" is invalid: ${field}: ${msg}`);
  if (['Deployment', 'ReplicaSet', 'DaemonSet', 'StatefulSet'].includes(d.kind)) {
    const sp = d.spec || {};
    if (!sp.selector) inv('spec.selector', 'Required value');
    const tl = ((sp.template || {}).metadata || {}).labels || {};
    if (!matchSelector(sp.selector, tl)) inv('spec.template.metadata.labels', `Invalid value: map[string]string{${Object.entries(tl).map(([k, v]) => `"${k}":"${v}"`).join(', ')}}: \`selector\` does not match template \`labels\``);
    if (!((sp.template || {}).spec || {}).containers) inv('spec.template.spec.containers', 'Required value');
  }
  if (d.kind === 'Pod' && !((d.spec || {}).containers || []).length) inv('spec.containers', 'Required value');
  if (d.kind === 'Pod') for (const [i, ct] of (d.spec.containers || []).entries()) if (!ct.image) inv(`spec.containers[${i}].image`, 'Required value');
  if (d.kind === 'Job' || d.kind === 'CronJob') {
    const t = d.kind === 'Job' ? (d.spec || {}).template : (((d.spec || {}).jobTemplate || {}).spec || {}).template;
    const rp = ((t || {}).spec || {}).restartPolicy;
    if (rp !== 'Never' && rp !== 'OnFailure') inv(`spec.${d.kind === 'CronJob' ? 'jobTemplate.spec.' : ''}template.spec.restartPolicy`, `Required value: valid values: "OnFailure", "Never"`);
  }
  if (d.kind === 'Service') {
    for (const [i, p] of ((d.spec || {}).ports || []).entries()) {
      if (typeof p.port !== 'number') inv(`spec.ports[${i}].port`, 'Required value');
      if (p.nodePort && (p.nodePort < 30000 || p.nodePort > 32767)) inv(`spec.ports[${i}].nodePort`, `Invalid value: ${p.nodePort}: provided port is not in the valid range. The range of valid ports is 30000-32767`);
      if (p.nodePort) { const clash = c.list('Service').find((s) => s.metadata.name !== d.metadata.name && (s.spec.ports || []).some((q) => q.nodePort === p.nodePort)); if (clash) inv(`spec.ports[${i}].nodePort`, `Invalid value: ${p.nodePort}: provided port is already allocated`); }
    }
    if (((d.spec || {}).ports || []).length > 1 && d.spec.ports.some((p) => !p.name)) inv('spec.ports[0].name', 'Required value');
  }
  if (d.kind === 'PersistentVolumeClaim' && !(((d.spec || {}).resources || {}).requests || {}).storage) inv('spec.resources[storage]', 'Required value');
  if (d.kind === 'PersistentVolumeClaim' && !((d.spec || {}).accessModes || []).length) inv('spec.accessModes', 'Required value: at least 1 access mode is required');
  if (d.kind === 'NetworkPolicy' && !(d.spec && 'podSelector' in d.spec)) inv('spec.podSelector', 'Required value');
  if ((d.kind === 'RoleBinding' || d.kind === 'ClusterRoleBinding') && !d.roleRef) inv('roleRef.kind', 'Unsupported value: "": supported values: "Role", "ClusterRole"');
  if (d.kind === 'ClusterRoleBinding' && d.roleRef && d.roleRef.kind === 'Role') inv('roleRef.kind', 'Unsupported value: "Role": supported values: "ClusterRole"');
  return r;
}

/** 객체 하나를 저장소에 넣는다 — mode: create | apply | replace */
export function upsert(c, d, mode, nsFlag, src = 'STDIN') {
  const r = validate(d, c, src);
  d = clone(d);
  if (r.ns) {
    if (nsFlag && d.metadata.namespace && d.metadata.namespace !== nsFlag) fail(`error: the namespace from the provided object "${d.metadata.namespace}" does not match the namespace "${nsFlag}". You must pass '--namespace=${d.metadata.namespace}' to perform this operation.`);
    d.metadata.namespace = d.metadata.namespace || nsFlag || c.ns;
    if (!c.get('Namespace', '', d.metadata.namespace)) fail(`Error from server (NotFound): error when creating "${src}": namespaces "${d.metadata.namespace}" not found`);
  } else delete d.metadata.namespace;
  const tn = `${typeName(r)}/${d.metadata.name}`;
  const cur = c.get(r.kind, d.metadata.namespace, d.metadata.name);
  if (cur && mode === 'create') fail(`Error from server (AlreadyExists): error when creating "${src}": ${r.plural}${groupOf(r) ? '.' + groupOf(r) : ''} "${d.metadata.name}" already exists`);
  if (!cur && mode === 'replace') fail(`Error from server (NotFound): error when replacing "${src}": ${r.plural}${groupOf(r) ? '.' + groupOf(r) : ''} "${d.metadata.name}" not found`);
  delete d.status;
  if (cur) {
    // 바뀐 게 있나(status·메타 부가정보 제외)
    const strip = (o) => { const x = clone(o); delete x.status; for (const k of ['uid', 'creationTimestamp', 'resourceVersion', 'managedFields', 'generation']) delete x.metadata[k]; if (x.metadata.annotations) { delete x.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration']; delete x.metadata.annotations['deployment.kubernetes.io/revision']; if (!Object.keys(x.metadata.annotations).length) delete x.metadata.annotations; } return x; };
    let merged;
    if (mode === 'apply') {
      merged = clone(cur);
      for (const k of Object.keys(d)) if (k !== 'metadata') merged[k] = d[k];
      merged.metadata = { ...cur.metadata, ...d.metadata, labels: d.metadata.labels || cur.metadata.labels, annotations: { ...(cur.metadata.annotations || {}), ...(d.metadata.annotations || {}) } };
      if (r.kind === 'Service') { merged.spec.clusterIP = cur.spec.clusterIP; merged.spec.clusterIPs = cur.spec.clusterIPs; for (const p of merged.spec.ports || []) { const old = (cur.spec.ports || []).find((q) => q.port === p.port); if (old && !p.nodePort && old.nodePort && ['NodePort', 'LoadBalancer'].includes(merged.spec.type)) p.nodePort = old.nodePort; } }
      if (r.kind === 'PersistentVolumeClaim' && cur.spec.volumeName && !d.spec.volumeName) merged.spec.volumeName = cur.spec.volumeName;
      if (r.kind === 'Pod') { merged.spec.nodeName = merged.spec.nodeName || cur.spec.nodeName; merged.spec.serviceAccountName = merged.spec.serviceAccountName || cur.spec.serviceAccountName; }
    } else {
      merged = d;
      merged.metadata.uid = cur.metadata.uid; merged.metadata.creationTimestamp = cur.metadata.creationTimestamp;
      if (r.kind === 'Service') { merged.spec.clusterIP = merged.spec.clusterIP || cur.spec.clusterIP; }
    }
    if (JSON.stringify(strip(merged)) === JSON.stringify(strip(cur))) return `${tn} unchanged`;
    immutableCheck(c, cur, merged, r);
    merged.status = cur.status;
    if (r.kind === 'Service') c.assignClusterIP(merged);
    if (r.kind === 'CustomResourceDefinition') registerCRD(c, merged);
    if (merged.kind === 'Secret') normalizeSecret(merged);
    for (const [k, v] of Object.entries(Object.getOwnPropertyDescriptors(cur))) if (!v.enumerable && k.startsWith('_') && k !== '_src') Object.defineProperty(merged, k, v);
    c.put(merged);
    return `${tn} ${mode === 'replace' ? 'replaced' : 'configured'}`;
  }
  createObj(c, d, r);
  return `${tn} created`;
}
function immutableCheck(c, cur, next, r) {
  if (r.kind === 'Pod') {
    const a = clone(cur.spec), b = clone(next.spec);
    for (const s of [a, b]) { for (const ct of (s.containers || []).concat(s.initContainers || [])) delete ct.image; delete s.activeDeadlineSeconds; delete s.tolerations; delete s.nodeName; delete s.serviceAccountName; delete s.priority; delete s.restartPolicy; delete s.dnsPolicy; delete s.terminationGracePeriodSeconds; delete s.enableServiceLinks; delete s.schedulerName; delete s.securityContext; }
    for (const s of [a, b]) for (const ct of s.containers || []) { delete ct.terminationMessagePath; delete ct.terminationMessagePolicy; delete ct.imagePullPolicy; if (ct.resources && !Object.keys(ct.resources).length) delete ct.resources; }
    if (JSON.stringify(a) !== JSON.stringify(b)) fail(`The Pod "${cur.metadata.name}" is invalid: spec: Forbidden: pod updates may not change fields other than \`spec.containers[*].image\`,\`spec.initContainers[*].image\`,\`spec.activeDeadlineSeconds\`,\`spec.tolerations\` (only additions to existing tolerations),\`spec.terminationGracePeriodSeconds\` (allow it to be set to 1 if it was previously negative)`);
  }
  if (['Deployment', 'ReplicaSet', 'DaemonSet', 'StatefulSet'].includes(r.kind) && JSON.stringify(cur.spec.selector) !== JSON.stringify(next.spec.selector)) {
    fail(`The ${r.kind} "${cur.metadata.name}" is invalid: spec.selector: Invalid value: ${JSON.stringify(next.spec.selector)}: field is immutable`);
  }
  if (r.kind === 'PersistentVolumeClaim') {
    const oldS = parseMem(((cur.spec.resources || {}).requests || {}).storage), newS = parseMem(((next.spec.resources || {}).requests || {}).storage);
    if (newS < oldS) fail(`The PersistentVolumeClaim "${cur.metadata.name}" is invalid: spec.resources.requests.storage: Forbidden: field can not be less than status.capacity`);
    if (newS > oldS) {
      const sc = c.get('StorageClass', '', cur.spec.storageClassName || '');
      if (!sc || !sc.allowVolumeExpansion) fail(`Error from server (Forbidden): persistentvolumeclaims "${cur.metadata.name}" is forbidden: only dynamically provisioned pvc can be resized and the storageclass that provisions the pvc must support resize`);
      const pv = c.get('PersistentVolume', '', cur.spec.volumeName);
      if (pv) { pv.spec.capacity.storage = next.spec.resources.requests.storage; if (cur.status) cur.status.capacity = { storage: next.spec.resources.requests.storage }; }
    }
    const x = clone(cur.spec), y = clone(next.spec);
    delete x.resources; delete y.resources; delete x.volumeName; delete y.volumeName; delete x.storageClassName; delete y.storageClassName;
    if (JSON.stringify(x) !== JSON.stringify(y)) fail(`The PersistentVolumeClaim "${cur.metadata.name}" is invalid: spec: Forbidden: spec is immutable after creation except resources.requests and volumeAttributesClassName for bound claims`);
  }
  if (r.kind === 'Job' && JSON.stringify(cur.spec.template) !== JSON.stringify(next.spec.template)) fail(`The Job "${cur.metadata.name}" is invalid: spec.template: Invalid value: …: field is immutable`);
  if ((r.kind === 'RoleBinding' || r.kind === 'ClusterRoleBinding') && JSON.stringify(cur.roleRef) !== JSON.stringify(next.roleRef)) fail(`The ${r.kind} "${cur.metadata.name}" is invalid: roleRef: Invalid value: …: cannot change roleRef`);
  if ((cur.data !== undefined || cur.immutable) && cur.immutable && JSON.stringify(cur.data) !== JSON.stringify(next.data)) fail(`The ${r.kind} "${cur.metadata.name}" is invalid: data: Forbidden: field is immutable when \`immutable\` is set`);
}
function normalizeSecret(o) {
  if (o.stringData) { o.data = o.data || {}; for (const [k, v] of Object.entries(o.stringData)) o.data[k] = b64e(String(v)); delete o.stringData; }
  o.type = o.type || 'Opaque';
}
function registerCRD(c, o) {
  const n = (o.spec || {}).names || {};
  const ver = ((o.spec.versions || []).find((v) => v.storage) || (o.spec.versions || [])[0] || { name: 'v1' }).name;
  if (!n.kind || !n.plural) return;
  c.extraRes = c.extraRes.filter((r) => r.kind !== n.kind);
  c.extraRes.push({ kind: n.kind, plural: n.plural, short: n.shortNames || [], singular: n.singular, ns: (o.spec.scope || 'Namespaced') === 'Namespaced', api: `${o.spec.group}/${ver}`, group: o.spec.group, crd: o.metadata.name });
}
export function createObj(c, d, r) {
  c.stamp(d);
  switch (r.kind) {
    case 'Pod': {
      const err = c.admitPod(d);
      if (err) fail(`Error from server (Forbidden): ${err}`.replace('Error from server (Forbidden): namespaces', 'Error from server (NotFound): namespaces'));
      d.spec.restartPolicy = d.spec.restartPolicy || 'Always';
      d.spec.dnsPolicy = d.spec.dnsPolicy || 'ClusterFirst';
      break;
    }
    case 'Service': c.assignClusterIP(d); break;
    case 'Secret': normalizeSecret(d); break;
    case 'Namespace': d.metadata.labels = { ...(d.metadata.labels || {}), 'kubernetes.io/metadata.name': d.metadata.name }; d.status = { phase: 'Active' }; break;
    case 'Deployment': d.spec.replicas = d.spec.replicas ?? 1; d.spec.strategy = d.spec.strategy || { type: 'RollingUpdate', rollingUpdate: { maxSurge: '25%', maxUnavailable: '25%' } }; d.spec.revisionHistoryLimit = d.spec.revisionHistoryLimit ?? 10; break;
    case 'CustomResourceDefinition': registerCRD(c, d); break;
    case 'PersistentVolume': d.spec.persistentVolumeReclaimPolicy = d.spec.persistentVolumeReclaimPolicy || 'Retain'; d.status = { phase: 'Available' }; break;
    case 'StorageClass': d.reclaimPolicy = d.reclaimPolicy || 'Delete'; d.volumeBindingMode = d.volumeBindingMode || 'Immediate'; break;
    case 'Job': d.spec.backoffLimit = d.spec.backoffLimit ?? 6; d.spec.completions = d.spec.completions ?? 1; d.spec.parallelism = d.spec.parallelism ?? 1; break;
    case 'ResourceQuota': { d.status = { hard: clone((d.spec || {}).hard || {}) }; break; }
  }
  if (r.kind === 'Pod' || r.kind === 'Service') {
    const q = c.list('ResourceQuota', d.metadata.namespace);
    for (const rq of q) {
      const lim = ((rq.spec || {}).hard || {})[r.kind === 'Service' ? 'services' : 'x'];
      if (lim !== undefined && c.list('Service', d.metadata.namespace).length + 1 > Number(lim)) fail(`Error from server (Forbidden): services "${d.metadata.name}" is forbidden: exceeded quota: ${rq.metadata.name}, requested: services=1, used: services=${c.list('Service', d.metadata.namespace).length}, limited: services=${lim}`);
    }
  }
  c.put(d);
  return d;
}

function cmdApply(a, io, c, mode = 'apply') {
  if (a.f('kustomize')) {
    const docs = kustomizeBuild(io, a.f('kustomize'));
    return R(docs.map((d) => upsert(c, d, mode === 'create' ? 'create' : 'apply', a.f('namespace'), a.f('kustomize'))).join('\n'));
  }
  if (!a.fa('filename').length) return R('', `error: must specify one of -f and -k\n\nSee 'kubectl ${mode} -h' for help and examples`);
  const docs = loadFiles(a, io);
  const outs = [];
  const dry = a.f('dry-run');
  for (const d of docs) {
    if (dry && dry !== 'none' && dry !== 'false') { validate(d, c, d._src); outs.push(`${typeName(c.resolve(d.kind))}/${d.metadata.name} ${c.get(d.kind, d.metadata.namespace || nsOf(a, c), d.metadata.name) ? 'configured' : 'created'} (${dry === 'server' ? 'server ' : ''}dry run)`); continue; }
    if (mode === 'replace' && a.b('force')) {
      const r = c.resolve(d.kind);
      const cur = r && c.get(r.kind, d.metadata.namespace || nsOf(a, c), d.metadata.name);
      if (cur) { c.remove(cur); c.reconcile(); outs.push(`${typeName(r)} "${d.metadata.name}" deleted`); }
      outs.push(upsert(c, d, 'create', a.f('namespace'), d._src).replace(' created', ' replaced'));
      continue;
    }
    outs.push(upsert(c, d, mode, a.f('namespace'), d._src));
    c.reconcile();
  }
  return R(outs.join('\n'));
}

export function kustomizeBuild(io, dir) {
  dir = dir.replace(/\/$/, '');
  const txt = io.readFile(`${dir}/kustomization.yaml`) ?? io.readFile(`${dir}/kustomization.yml`) ?? io.readFile(`${dir}/Kustomization`);
  if (txt === null || txt === undefined) fail(`error: unable to find one of 'kustomization.yaml', 'kustomization.yml' or 'Kustomization' in directory '${io.abs ? io.abs(dir) : dir}'`);
  let k;
  try { k = yaml.load(txt) || {}; } catch (e) { fail(`error: invalid Kustomization: ${e.message.split('\n')[0]}`); }
  let docs = [];
  for (const r of k.resources || []) {
    const p = `${dir}/${r}`;
    if (io.stat(p) === 'dir') docs.push(...kustomizeBuild(io, p));
    else { const t = io.readFile(p); if (t === null || t === undefined) fail(`error: accumulating resources: accumulation err='accumulating resources from '${r}': open ${p}: no such file or directory'`); docs.push(...loadYamlText(t, p)); }
  }
  for (const d of docs) {
    d.metadata = d.metadata || {};
    if (k.namePrefix) d.metadata.name = k.namePrefix + d.metadata.name;
    if (k.nameSuffix) d.metadata.name = d.metadata.name + k.nameSuffix;
    if (k.namespace && d.kind !== 'Namespace') d.metadata.namespace = k.namespace;
    const labels = { ...(k.commonLabels || {}), ...Object.assign({}, ...((k.labels || []).map((l) => l.pairs || {}))) };
    if (Object.keys(labels).length) {
      d.metadata.labels = { ...(d.metadata.labels || {}), ...labels };
      const withSel = k.commonLabels || (k.labels || []).some((l) => l.includeSelectors);
      if (d.spec && d.spec.template) { d.spec.template.metadata = d.spec.template.metadata || {}; d.spec.template.metadata.labels = { ...(d.spec.template.metadata.labels || {}), ...labels }; if (withSel && d.spec.selector) d.spec.selector.matchLabels = { ...(d.spec.selector.matchLabels || {}), ...labels }; }
      if (d.kind === 'Service' && withSel && d.spec) d.spec.selector = { ...(d.spec.selector || {}), ...labels };
    }
    if (k.commonAnnotations) d.metadata.annotations = { ...(d.metadata.annotations || {}), ...k.commonAnnotations };
    for (const im of k.images || []) {
      const cs = (((d.spec || {}).template || {}).spec || {}).containers || ((d.spec || {}).containers) || [];
      for (const ct of cs) {
        if (parseImage(ct.image).repo === im.name || ct.image.split(':')[0] === im.name) ct.image = `${im.newName || ct.image.split(':')[0]}${im.digest ? '@' + im.digest : ':' + (im.newTag || parseImage(ct.image).tag)}`;
      }
    }
    for (const rp of k.replicas || []) if (d.metadata.name === (k.namePrefix || '') + rp.name + (k.nameSuffix || '') && d.spec) d.spec.replicas = rp.count;
  }
  for (const g of k.configMapGenerator || []) {
    const data = {};
    for (const l of g.literals || []) { const i = l.indexOf('='); data[l.slice(0, i)] = l.slice(i + 1); }
    for (const f of g.files || []) { const [kk, pp] = f.includes('=') ? f.split('=') : [f.split('/').pop(), f]; data[kk] = io.readFile(`${dir}/${pp}`) || ''; }
    docs.push({ apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: `${g.name}-${hashStr6(JSON.stringify(data))}`, ...(k.namespace ? { namespace: k.namespace } : {}) }, data });
  }
  for (const p of k.patches || []) {
    let patch = p.patch ? yaml.load(p.patch) : p.path ? yaml.load(io.readFile(`${dir}/${p.path}`) || '') : null;
    if (!patch) continue;
    const t = p.target || { kind: patch.kind, name: (patch.metadata || {}).name };
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      if ((t.kind && d.kind !== t.kind) || (t.name && d.metadata.name !== (k.namePrefix || '') + t.name && d.metadata.name !== t.name)) continue;
      if (Array.isArray(patch)) docs[i] = jsonPatch(d, patch);
      else { const pp = clone(patch); if (pp.metadata) { delete pp.metadata.name; delete pp.metadata.namespace; } docs[i] = strategicPatch(d, pp); }
    }
  }
  return docs;
}
function hashStr6(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h.toString(36).slice(0, 10).padEnd(10, 'k').replace(/[aeiou01]/g, 'k'); }

// ─── delete ────────────────────────────────────────────────────────────────
function cmdDelete(a, io, c) {
  const outs = [];
  const errs = [];
  const del = (o, r) => {
    c.remove(o);
    if (r.kind === 'CustomResourceDefinition') { c.extraRes = c.extraRes.filter((x) => x.crd !== o.metadata.name); for (const x of [...c.objs.values()]) if (x.apiVersion && x.apiVersion.startsWith(((o.spec || {}).group || '#') + '/')) c.remove(x); }
    outs.push(`${typeName(r)} "${o.metadata.name}" deleted${o.metadata.namespace && a.b('all-namespaces') ? ` from ${o.metadata.namespace} namespace` : ''}`);
  };
  const grace = a.f('grace-period');
  if (a.b('force') && grace === '0') outs.push('Warning: Immediate deletion does not wait for confirmation that the running resource has been terminated. The resource may continue to run on the cluster indefinitely.');
  if (a.f('kustomize')) {
    for (const d of kustomizeBuild(io, a.f('kustomize'))) { const r = c.resolve(d.kind); const o = r && c.get(r.kind, d.metadata.namespace || nsOf(a, c), d.metadata.name); if (o) del(o, r); }
    return R(outs.join('\n'));
  }
  if (a.fa('filename').length) {
    for (const d of loadFiles(a, io)) {
      const r = c.resolve(d.kind);
      const o = r && c.get(r.kind, d.metadata.namespace || nsOf(a, c), d.metadata.name);
      if (!o) { if (!a.b('ignore-not-found')) errs.push(`Error from server (NotFound): error when deleting "${d._src}": ${r ? r.plural : d.kind} "${d.metadata.name}" not found`); continue; }
      del(o, r);
    }
    return R(outs.join('\n'), errs.join('\n'));
  }
  const ts = targets(a, c, { allowAll: false });
  if (!ts.length) return R('', 'error: You must provide one or more resources by argument or filename.\nExample resource specifications include:\n   \'-f rsrc.yaml\'\n   \'--filename=rsrc.json\'\n   \'<resource> <name>\'\n   \'<resource>\'');
  const ns = a.b('all-namespaces') ? null : nsOf(a, c);
  for (const t of ts) {
    if (t.name) {
      const o = c.get(t.res.kind, t.res.ns ? ns || 'default' : '', t.name);
      if (!o) { if (!a.b('ignore-not-found')) errs.push(nfShort(t.res, t.name)); continue; }
      if (t.res.kind === 'Namespace' && ['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(t.name)) { errs.push(`Error from server (Forbidden): namespaces "${t.name}" is forbidden: this namespace may not be deleted`); continue; }
      del(o, t.res);
    } else {
      if (!a.b('all') && !a.f('selector') && !a.f('field-selector')) return R('', `error: resource(s) were provided, but no name was specified`);
      const items = c.list(t.res.kind, t.res.ns ? ns : null).filter((o) => selMatch(o, a.f('selector')) && fieldSel(o, a.f('field-selector')));
      if (!items.length) errs.push(nsMsg(t.res.ns ? ns : ''));
      for (const o of items) del(o, t.res);
    }
  }
  return R(outs.join('\n'), errs.join('\n'));
}

// ─── run · create · expose ─────────────────────────────────────────────────
function kvList(list) {
  const o = {};
  for (const item of list.flatMap((x) => x.split(','))) { if (!item) continue; const i = item.indexOf('='); o[item.slice(0, i)] = item.slice(i + 1); }
  return o;
}
function dryOut(a, obj) {
  const o = clone(obj);
  o.metadata = { ...o.metadata };
  if (!('creationTimestamp' in o.metadata)) o.metadata = { creationTimestamp: null, ...o.metadata };
  const fmt = a.f('output');
  if (fmt === 'json') return R(toJson(o));
  if (fmt === 'yaml') return R(toYaml(o));
  if (fmt === 'name') return R(`${obj.kind.toLowerCase()}/${obj.metadata.name}`);
  return R(`${obj.kind.toLowerCase()}${obj.apiVersion.includes('/') ? '.' + obj.apiVersion.split('/')[0] : ''}/${obj.metadata.name} created (${a.f('dry-run') === 'server' ? 'server ' : ''}dry run)`);
}
function isDry(a) { const d = a.f('dry-run'); return d !== undefined && d !== 'none' && d !== 'false'; }
function finishCreate(a, c, obj) {
  if (isDry(a)) return dryOut(a, obj);
  const r = c.resOf(obj.kind);
  if (r.ns) obj.metadata.namespace = obj.metadata.namespace || nsOf(a, c);
  if (r.ns && !c.get('Namespace', '', obj.metadata.namespace)) fail(`error: failed to create ${obj.kind.toLowerCase()}: namespaces "${obj.metadata.namespace}" not found`);
  if (c.get(obj.kind, obj.metadata.namespace, obj.metadata.name)) fail(`Error from server (AlreadyExists): ${r.plural}${groupOf(r) ? '.' + groupOf(r) : ''} "${obj.metadata.name}" already exists`);
  const o = clone(obj);
  delete o.status;
  createObj(c, o, r);
  c.reconcile();
  const fmt = a.f('output');
  if (fmt === 'yaml' || fmt === 'json') return R(fmt === 'yaml' ? toYaml(c.get(obj.kind, o.metadata.namespace, o.metadata.name)) : toJson(c.get(obj.kind, o.metadata.namespace, o.metadata.name)));
  return R(`${typeName(r)}/${obj.metadata.name} created`);
}

function cmdRun(a, io, c) {
  const name = a.pos[0];
  if (!name) return R('', 'error: NAME is required for run\nSee \'kubectl run -h\' for help and examples');
  const image = a.f('image');
  if (!image) return R('', 'error: required flag(s) "image" not set');
  const labels = a.f('labels') ? kvList(a.fa('labels')) : { run: name };
  const ct = { name, image, resources: {} };
  if (a.dash.length) { if (a.b('command')) ct.command = a.dash.slice(); else ct.args = a.dash.slice(); }
  if (a.f('port')) ct.ports = [{ containerPort: Number(a.f('port')) }];
  if (a.fa('env').length) ct.env = a.fa('env').map((e) => { const i = e.indexOf('='); return { name: e.slice(0, i), value: e.slice(i + 1) }; });
  if (a.f('image-pull-policy')) ct.imagePullPolicy = a.f('image-pull-policy');
  if (a.f('requests') || a.f('limits')) { ct.resources = {}; if (a.f('requests')) ct.resources.requests = kvList([a.f('requests')]); if (a.f('limits')) ct.resources.limits = kvList([a.f('limits')]); }
  const pod = { apiVersion: 'v1', kind: 'Pod', metadata: { labels, name }, spec: { containers: [ct], dnsPolicy: 'ClusterFirst', restartPolicy: a.f('restart') || 'Always' }, status: {} };
  if (a.f('serviceaccount')) pod.spec.serviceAccountName = a.f('serviceaccount');
  if (a.f('overrides')) { try { Object.assign(pod, mergePatch(pod, JSON.parse(a.f('overrides')))); } catch { return R('', 'error: Invalid JSON Patch'); } }
  if (isDry(a)) return dryOut(a, pod);
  if (a.b('rm') && (a.b('stdin') || a.b('tty'))) {
    // kubectl run tmp --rm -it --image=busybox -- wget … : 일회용 파드로 명령을 실행하고 지운다
    pod.metadata.namespace = nsOf(a, c);
    const tmp = createObj(c, clone(pod), c.resOf('Pod'));
    c.reconcile();
    const res = execIn(c, tmp, a.dash.length ? a.dash : ['sh'], io, null, true);
    c.remove(tmp);
    return R([res.out, `pod "${name}" deleted from ${pod.metadata.namespace} namespace`].filter(Boolean).join('\n'), res.err);
  }
  const r = finishCreate(a, c, pod);
  if (a.b('expose') && a.f('port')) {
    const svc = { apiVersion: 'v1', kind: 'Service', metadata: { name, namespace: nsOf(a, c) }, spec: { ports: [{ port: Number(a.f('port')), protocol: 'TCP', targetPort: Number(a.f('port')) }], selector: labels } };
    createObj(c, svc, c.resOf('Service'));
    return R(`service/${name} created\n${r.out.replace('pod/', 'pod/')}`);
  }
  return R(r.out.replace(/^pod\//, 'pod/'), r.err);
}

function cmdCreate(a, io, c) {
  const what = a.pos[0];
  if (a.fa('filename').length || a.f('kustomize')) return cmdApply(a, io, c, 'create');
  const name = a.pos[1];
  const ns = nsOf(a, c);
  const need = (v, msg) => { if (!v) fail(msg); };
  switch (c.resolve(what) ? c.resolve(what).kind : what) {
    case 'Namespace': need(name, 'error: exactly one NAME is required, got 0');
      return finishCreate(a, c, { apiVersion: 'v1', kind: 'Namespace', metadata: { name }, spec: {}, status: {} });
    case 'Deployment': {
      need(name, 'error: exactly one NAME is required, got 0');
      const imgs = a.fa('image');
      need(imgs.length, 'error: required flag(s) "image" not set');
      const labels = { app: name };
      const cts = imgs.map((im, i) => ({ image: im, name: imgs.length > 1 ? parseImage(im).repo.split('/').pop() : parseImage(im).repo.split('/').pop().replace(/[^a-z0-9-]/g, '-'), resources: {}, ...(a.f('port') && i === 0 ? { ports: [{ containerPort: Number(a.f('port')) }] } : {}) }));
      if (a.dash.length) cts[0].command = a.dash.slice();
      return finishCreate(a, c, { apiVersion: 'apps/v1', kind: 'Deployment', metadata: { labels, name }, spec: { replicas: Number(a.f('replicas') || 1), selector: { matchLabels: labels }, strategy: {}, template: { metadata: { labels }, spec: { containers: cts } } }, status: {} });
    }
    case 'Service': {
      const type = { clusterip: 'ClusterIP', nodeport: 'NodePort', loadbalancer: 'LoadBalancer', externalname: 'ExternalName' }[name];
      const sname = a.pos[2];
      if (!type) return R('', 'error: must specify one of clusterip, externalname, loadbalancer, nodeport');
      need(sname, 'error: exactly one NAME is required, got 0');
      const ports = a.fa('tcp').flatMap((x) => x.split(',')).map((t) => { const [p, tp] = t.split(':'); return { name: `${p}-${tp || p}`, port: Number(p), protocol: 'TCP', targetPort: Number(tp || p), ...(type === 'NodePort' && a.f('node-port') ? { nodePort: Number(a.f('node-port')) } : {}) }; });
      if (type !== 'ExternalName' && !ports.length && a.f('clusterip') !== 'None') fail('error: at least one tcp port specifier must be provided');
      const svc = { apiVersion: 'v1', kind: 'Service', metadata: { labels: { app: sname }, name: sname }, spec: { ports, selector: { app: sname }, type }, status: { loadBalancer: {} } };
      if (a.f('clusterip')) svc.spec.clusterIP = a.f('clusterip');
      return finishCreate(a, c, svc);
    }
    case 'ConfigMap': {
      need(name, 'error: exactly one NAME is required, got 0');
      const data = {};
      for (const l of a.fa('from-literal')) { const i = l.indexOf('='); data[l.slice(0, i)] = l.slice(i + 1); }
      for (const f of a.fa('from-file')) readInto(io, f, data, false);
      for (const f of a.fa('from-env-file')) for (const line of (io.readFile(f) || '').split('\n')) { const m = line.match(/^\s*([\w.-]+)=(.*)$/); if (m) data[m[1]] = m[2]; }
      return finishCreate(a, c, { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name }, data });
    }
    case 'Secret': {
      const sub = name;
      const sname = a.pos[2];
      need(sname, 'error: exactly one NAME is required, got 0');
      if (sub === 'generic') {
        const data = {};
        for (const l of a.fa('from-literal')) { const i = l.indexOf('='); data[l.slice(0, i)] = b64e(l.slice(i + 1)); }
        for (const f of a.fa('from-file')) readInto(io, f, data, true);
        for (const f of a.fa('from-env-file')) for (const line of (io.readFile(f) || '').split('\n')) { const m = line.match(/^\s*([\w.-]+)=(.*)$/); if (m) data[m[1]] = b64e(m[2]); }
        return finishCreate(a, c, { apiVersion: 'v1', kind: 'Secret', metadata: { name: sname }, data, type: a.f('type') || 'Opaque' });
      }
      if (sub === 'tls') {
        const cert = io.readFile(a.f('cert') || ''), k = io.readFile(a.f('key') || '');
        if (cert === null || cert === undefined) fail(`error: failed to load key pair open ${a.f('cert')}: no such file or directory`);
        if (k === null || k === undefined) fail(`error: failed to load key pair open ${a.f('key')}: no such file or directory`);
        return finishCreate(a, c, { apiVersion: 'v1', kind: 'Secret', metadata: { name: sname }, data: { 'tls.crt': b64e(cert), 'tls.key': b64e(k) }, type: 'kubernetes.io/tls' });
      }
      if (sub === 'docker-registry') {
        const auth = { auths: { [a.f('docker-server') || 'https://index.docker.io/v1/']: { username: a.f('docker-username'), password: a.f('docker-password'), auth: b64e(`${a.f('docker-username')}:${a.f('docker-password')}`) } } };
        return finishCreate(a, c, { apiVersion: 'v1', kind: 'Secret', metadata: { name: sname }, data: { '.dockerconfigjson': b64e(JSON.stringify(auth)) }, type: 'kubernetes.io/dockerconfigjson' });
      }
      return R('', 'error: must specify one of docker-registry, generic, tls');
    }
    case 'ServiceAccount': need(name, 'error: exactly one NAME is required, got 0');
      return finishCreate(a, c, { apiVersion: 'v1', kind: 'ServiceAccount', metadata: { name } });
    case 'Role': case 'ClusterRole': {
      need(name, 'error: exactly one NAME is required, got 0');
      const kind = c.resolve(what).kind;
      const verbs = a.fa('verb').flatMap((x) => x.split(','));
      const ress = a.fa('resource').flatMap((x) => x.split(','));
      if (!verbs.length) fail('error: at least one verb must be specified');
      if (!ress.length && !a.f('non-resource-url')) fail('error: at least one resource must be specified');
      const VALID = ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete', 'deletecollection', 'use', 'bind', 'escalate', 'impersonate', 'approve', 'sign', '*'];
      for (const v of verbs) if (!VALID.includes(v)) fail(`error: invalid verb: '${v}'`);
      const byGroup = {};
      for (const rr of ress) {
        const [base, sub2] = rr.split('/');
        const r = c.resolve(base.split('.')[0]);
        if (!r && base !== '*') fail(`error: resource type "${base}" not found`);
        const g = base.includes('.') ? base.split('.').slice(1).join('.') : r ? groupOf(r) : '*';
        const plural = r ? r.plural : '*';
        (byGroup[g] = byGroup[g] || []).push(plural + (sub2 ? '/' + sub2 : ''));
      }
      const rules = Object.entries(byGroup).map(([g, rs]) => ({ apiGroups: [g], resources: rs, verbs, ...(a.fa('resource-name').length ? { resourceNames: a.fa('resource-name').flatMap((x) => x.split(',')) } : {}) }));
      return finishCreate(a, c, { apiVersion: 'rbac.authorization.k8s.io/v1', kind, metadata: { name }, rules });
    }
    case 'RoleBinding': case 'ClusterRoleBinding': {
      need(name, 'error: exactly one NAME is required, got 0');
      const kind = c.resolve(what).kind;
      const role = a.f('role'), crole = a.f('clusterrole');
      if (!role && !crole) fail('error: exactly one of clusterrole or role must be specified');
      if (kind === 'ClusterRoleBinding' && role) fail('error: unknown flag: --role');
      const subjects = [];
      for (const u of a.fa('user')) subjects.push({ apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: u });
      for (const g of a.fa('group')) subjects.push({ apiGroup: 'rbac.authorization.k8s.io', kind: 'Group', name: g });
      for (const s of a.fa('serviceaccount')) { const [sns, sn] = s.split(':'); if (!sn) fail(`error: serviceaccount must be <namespace>:<name>`); subjects.push({ kind: 'ServiceAccount', name: sn, namespace: sns }); }
      return finishCreate(a, c, { apiVersion: 'rbac.authorization.k8s.io/v1', kind, metadata: { name }, roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: role ? 'Role' : 'ClusterRole', name: role || crole }, subjects });
    }
    case 'Job': {
      need(name, 'error: exactly one NAME is required, got 0');
      if (a.f('from')) {
        const [k2, n2] = a.f('from').split('/');
        const cj = c.get('CronJob', ns, n2);
        if (!cj || !/^(cronjob|cj|cronjobs)$/.test(k2)) fail(`Error from server (NotFound): cronjobs.batch "${n2}" not found`);
        return finishCreate(a, c, { apiVersion: 'batch/v1', kind: 'Job', metadata: { name, annotations: { 'cronjob.kubernetes.io/instantiate': 'manual' } }, spec: clone(cj.spec.jobTemplate.spec) });
      }
      need(a.f('image'), 'error: required flag(s) "image" not set');
      const ct = { image: a.f('image'), name, resources: {} };
      if (a.dash.length) ct.command = a.dash.slice();
      return finishCreate(a, c, { apiVersion: 'batch/v1', kind: 'Job', metadata: { name }, spec: { template: { metadata: {}, spec: { containers: [ct], restartPolicy: 'Never' } } }, status: {} });
    }
    case 'CronJob': {
      need(name, 'error: exactly one NAME is required, got 0');
      need(a.f('image'), 'error: required flag(s) "image" not set');
      need(a.f('schedule'), 'error: required flag(s) "schedule" not set');
      const ct = { image: a.f('image'), name, resources: {} };
      if (a.dash.length) ct.command = a.dash.slice();
      return finishCreate(a, c, { apiVersion: 'batch/v1', kind: 'CronJob', metadata: { name }, spec: { jobTemplate: { metadata: { name }, spec: { template: { metadata: {}, spec: { containers: [ct], restartPolicy: a.f('restart') || 'OnFailure' } } } }, schedule: a.f('schedule') }, status: {} });
    }
    case 'Ingress': {
      need(name, 'error: exactly one NAME is required, got 0');
      const rules = [];
      for (const rs of a.fa('rule')) {
        const m = rs.match(/^([^/]*)(\/[^=]*)?=([^:]+):([^,]+)(,tls(=.*)?)?$/);
        if (!m) fail(`error: rule ${rs} is invalid and should be in format host/path=svcname:svcport[,tls[=secret]]`);
        const [, host, path, svc, port] = m;
        const pathType = path && path.endsWith('*') ? 'Prefix' : 'Exact';
        let rule = rules.find((r) => (r.host || '') === host);
        if (!rule) rules.push(rule = { ...(host ? { host } : {}), http: { paths: [] } });
        rule.http.paths.push({ backend: { service: { name: svc, port: /^\d+$/.test(port) ? { number: Number(port) } : { name: port } } }, path: (path || '/').replace(/\*$/, ''), pathType });
      }
      const ing = { apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', metadata: { name }, spec: { ...(a.f('class') ? { ingressClassName: a.f('class') } : {}), rules }, status: { loadBalancer: {} } };
      if (a.f('annotation')) ing.metadata.annotations = kvList(a.fa('annotation'));
      return finishCreate(a, c, ing);
    }
    case 'PriorityClass': need(name, 'error: exactly one NAME is required, got 0');
      return finishCreate(a, c, { apiVersion: 'scheduling.k8s.io/v1', kind: 'PriorityClass', metadata: { name }, value: Number(a.f('value') || 0), globalDefault: a.b('global-default'), description: a.f('description') || '', preemptionPolicy: a.f('preemption-policy') || 'PreemptLowerPriority' });
    case 'ResourceQuota': need(name, 'error: exactly one NAME is required, got 0');
      return finishCreate(a, c, { apiVersion: 'v1', kind: 'ResourceQuota', metadata: { name }, spec: { hard: kvList(a.fa('hard')) }, status: {} });
    case 'token': {
      const sa = a.pos[1];
      if (!c.get('ServiceAccount', ns, sa)) fail(`error: failed to create token: serviceaccounts "${sa}" not found`);
      return R(`eyJhbGciOiJSUzI1NiIsImtpZCI6IlNpbSJ9.${b64e(JSON.stringify({ sub: `system:serviceaccount:${ns}:${sa}`, exp: c.now() + 3600 })).replace(/=+$/, '')}.c2ltdWxhdG9y`);
    }
    default: {
      if (what === 'sa') return cmdCreate({ ...a, pos: ['serviceaccount', ...a.pos.slice(1)] }, io, c);
      if (what === 'secret') return R('', 'error: must specify one of docker-registry, generic, tls');
      return R('', `error: unknown command "${what}" for "kubectl create"\nAvailable Commands: clusterrole clusterrolebinding configmap cronjob deployment ingress job namespace poddisruptionbudget priorityclass quota role rolebinding secret service serviceaccount token`);
    }
  }
}
function readInto(io, spec, data, b64) {
  let [k, p] = spec.includes('=') ? spec.split('=') : [null, spec];
  if (io.stat(p) === 'dir') { for (const f of io.listDir(p)) { const t = io.readFile(f); data[f.split('/').pop()] = b64 ? b64e(t) : t; } return; }
  const t = io.readFile(p);
  if (t === null || t === undefined) fail(`error: error reading ${p}: no such file or directory`);
  data[k || p.split('/').pop()] = b64 ? b64e(t) : t;
}

function cmdExpose(a, io, c) {
  const ns = nsOf(a, c);
  let [t, n] = a.pos[0] && a.pos[0].includes('/') ? a.pos[0].split('/') : [a.pos[0], a.pos[1]];
  if (a.fa('filename').length) { const d = loadFiles(a, io)[0]; t = d.kind; n = d.metadata.name; }
  const r = c.resolve(t || '');
  if (!r) return R('', 'error: You must provide one or more resources by argument or filename.');
  const o = c.get(r.kind, ns, n);
  if (!o) return R('', nfShort(r, n));
  let sel, ports = [];
  if (r.kind === 'Pod') { sel = clone(o.metadata.labels || {}); ports = o.spec.containers.flatMap((x) => x.ports || []); }
  else if (r.kind === 'Service') { sel = clone(o.spec.selector || {}); ports = (o.spec.ports || []).map((p) => ({ containerPort: p.port })); }
  else if (['Deployment', 'ReplicaSet', 'StatefulSet'].includes(r.kind)) { sel = clone(o.spec.selector.matchLabels || {}); ports = o.spec.template.spec.containers.flatMap((x) => x.ports || []); }
  else return R('', `error: cannot expose a ${r.kind}`);
  if (!Object.keys(sel).length) return R('', `error: couldn't retrieve selectors via --selector flag or introspection: the ${r.kind.toLowerCase()} has no labels`);
  const port = a.f('port') ? Number(a.f('port')) : ports[0] ? Number(ports[0].containerPort) : null;
  if (!port) return R('', "error: couldn't find port via --port flag or introspection\nSee 'kubectl expose -h' for help and examples");
  const tp = a.f('target-port') ? (/^\d+$/.test(a.f('target-port')) ? Number(a.f('target-port')) : a.f('target-port')) : port;
  const svc = { apiVersion: 'v1', kind: 'Service', metadata: { name: a.f('name') || n, ...(Object.keys(o.metadata.labels || {}).length ? { labels: clone(o.metadata.labels) } : {}) }, spec: { ports: [{ port, protocol: a.f('protocol') || 'TCP', targetPort: tp }], selector: a.f('selector') ? kvList([a.f('selector')]) : sel, ...(a.f('type') ? { type: a.f('type') } : {}) }, status: { loadBalancer: {} } };
  if (a.f('node-port')) svc.spec.ports[0].nodePort = Number(a.f('node-port'));
  if (svc.spec.type) svc.spec.type = { nodeport: 'NodePort', clusterip: 'ClusterIP', loadbalancer: 'LoadBalancer' }[svc.spec.type.toLowerCase()] || svc.spec.type;
  if (a.f('cluster-ip')) svc.spec.clusterIP = a.f('cluster-ip');
  svc.metadata.namespace = ns;
  return finishCreate(a, c, svc);
}

// ─── edit · patch · replace · label · annotate · taint · scale · set ─────
function getOne(a, c, ns) {
  let [t, n] = a.pos[0] && a.pos[0].includes('/') ? a.pos[0].split('/') : [a.pos[0], a.pos[1]];
  const r = c.resolve(t || '');
  if (!r) fail(t ? `error: the server doesn't have a resource type "${t}"` : 'error: You must provide one or more resources by argument or filename.');
  if (!n) fail(`error: resource(s) were provided, but no name was specified`);
  const o = c.get(r.kind, r.ns ? ns : '', n);
  if (!o) fail(nfShort(r, n));
  return { r, o, rest: a.pos[0].includes('/') ? a.pos.slice(1) : a.pos.slice(2) };
}
function cmdEdit(a, io, c) {
  const ns = nsOf(a, c);
  const { r, o } = getOne(a, c, ns);
  const text = `# Please edit the object below. Lines beginning with a '#' will be ignored,\n# and an empty file will abort the edit. If an error occurs while saving this file will be\n# reopened with the relevant failures.\n#\n${toYaml(o)}\n`;
  return {
    out: '', err: '',
    edit: {
      path: `/tmp/kubectl-edit-${c.randName(10)}.yaml`, content: text,
      save: (newText) => applyEdit(c, io, r, o, newText),
    },
  };
}
export function applyEdit(c, io, r, o, newText) {
  const body = newText.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n').trim();
  if (!body) return R('', 'Edit cancelled, no changes made.');
  try {
    const d = loadYamlText(body, 'edit')[0];
    if (JSON.stringify(ordered2(d)) === JSON.stringify(ordered2(o))) return R('Edit cancelled, no changes made.');
    d.metadata.namespace = o.metadata.namespace;
    const res = upsert(c, d, 'replace', o.metadata.namespace, 'edit');
    c.reconcile();
    return R(res.replace(' replaced', ' edited'));
  } catch (e) {
    if (!e.kerr) throw e;
    const tmp = `/tmp/kubectl-edit-${c.randName(10)}.yaml`;
    io.writeFile(tmp, newText);
    return R('', `error: ${e.kerr.replace(/^error: /, '')}\nA copy of your changes has been stored to "${tmp}"\nerror: Edit cancelled, no valid changes were saved.`);
  }
}
function ordered2(o) { const x = clone(o); delete x.status; return x; }

function jsonPatch(doc, ops) {
  const d = clone(doc);
  for (const op of ops) {
    const parts = op.path.split('/').slice(1).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
    let cur = d;
    for (let i = 0; i < parts.length - 1; i++) { const k = Array.isArray(cur) ? Number(parts[i]) : parts[i]; if (cur[k] === undefined) { if (op.op === 'add') cur[k] = {}; else fail(`The request is invalid: the server rejected our request due to an error in our request`); } cur = cur[k]; }
    const last = parts[parts.length - 1];
    if (op.op === 'add') { if (Array.isArray(cur)) { if (last === '-') cur.push(op.value); else cur.splice(Number(last), 0, op.value); } else cur[last] = op.value; }
    else if (op.op === 'replace') { if (Array.isArray(cur)) cur[Number(last)] = op.value; else cur[last] = op.value; }
    else if (op.op === 'remove') { if (Array.isArray(cur)) cur.splice(Number(last), 1); else delete cur[last]; }
  }
  return d;
}
function cmdPatch(a, io, c) {
  const ns = nsOf(a, c);
  const { r, o } = getOne(a, c, ns);
  let raw = a.f('patch');
  if (!raw && a.f('patch-file')) raw = io.readFile(a.f('patch-file'));
  if (!raw) return R('', 'error: must specify --patch or --patch-file containing the contents of the patch');
  let p;
  try { p = yaml.load(raw); } catch { return R('', `error: unable to parse "${raw}": yaml: did not find expected node content`); }
  const type = a.f('type') || 'strategic';
  const next = type === 'json' ? jsonPatch(o, p) : type === 'merge' ? mergePatch(o, p) : strategicPatch(o, p);
  if (JSON.stringify(next) === JSON.stringify(o)) return R(`${typeName(r)}/${o.metadata.name} patched (no change)`);
  const res = upsert(c, next, 'replace', o.metadata.namespace, 'patch');
  return R(res.replace(/ (replaced|configured)$/, ' patched').replace(/ unchanged$/, ' patched (no change)'));
}
function cmdReplace(a, io, c) { return cmdApply(a, io, c, 'replace'); }

function cmdLabel(a, io, c, field = 'labels') {
  const ns = nsOf(a, c);
  let objs = [], rest;
  const pos = a.pos;
  if (!pos.length) return R('', 'error: one or more resources must be specified as <resource> <name> or <resource>/<name>');
  let r;
  if (pos[0].includes('/')) { const [t, n] = pos[0].split('/'); r = c.resolve(t); const o = r && c.get(r.kind, r.ns ? ns : '', n); if (!o) return R('', nfShort(r || { plural: t, api: 'v1' }, n)); objs = [o]; rest = pos.slice(1); }
  else {
    r = c.resolve(pos[0]);
    if (!r) return R('', `error: the server doesn't have a resource type "${pos[0]}"`);
    if (a.b('all') || a.f('selector')) { objs = c.list(r.kind, r.ns ? ns : null).filter((o) => selMatch(o, a.f('selector'))); rest = pos.slice(1); }
    else {
      const names = pos.slice(1).filter((x) => !/[=]|-$/.test(x));
      rest = pos.slice(1 + names.length);
      for (const n of names) { const o = c.get(r.kind, r.ns ? ns : '', n); if (!o) return R('', nfShort(r, n)); objs.push(o); }
    }
  }
  if (!rest.length) return R('', 'error: at least one label update is required');
  const out = [];
  for (const o of objs) {
    const m = o.metadata[field] = o.metadata[field] || {};
    for (const kvs of rest) {
      if (kvs.endsWith('-') && !kvs.includes('=')) { delete m[kvs.slice(0, -1)]; continue; }
      const i = kvs.indexOf('=');
      const k = kvs.slice(0, i), v = kvs.slice(i + 1);
      if (field === 'labels' && !/^[A-Za-z0-9]([-A-Za-z0-9_.]*[A-Za-z0-9])?$|^$/.test(v)) return R('', `error: invalid label value: "${kvs}": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character`);
      if (k in m && m[k] !== v && !a.b('overwrite')) return R('', `error: '${k}' already has a value (${m[k]}), and --overwrite is false`);
      m[k] = v;
    }
    if (!Object.keys(m).length) delete o.metadata[field];
    out.push(`${typeName(r)}/${o.metadata.name} ${field === 'labels' ? 'labeled' : 'annotated'}`);
  }
  if (field === 'annotations' && r.kind === 'Deployment') for (const o of objs) { const cc = (o.metadata.annotations || {})['kubernetes.io/change-cause']; if (cc) { const rs = c.ownedBy('ReplicaSet', o).find((x) => x.metadata.annotations['deployment.kubernetes.io/revision'] === o.metadata.annotations['deployment.kubernetes.io/revision']); if (rs) rs.metadata.annotations['kubernetes.io/change-cause'] = cc; } }
  return R(out.join('\n'));
}
function cmdTaint(a, io, c) {
  const pos = a.pos;
  if (!/^(node|nodes|no)$/.test((pos[0] || '').split('/')[0])) return R('', 'error: at least one resource name must be specified since \'all\' parameter is not set');
  let names, specs;
  if (pos[0].includes('/')) { names = [pos[0].split('/')[1]]; specs = pos.slice(1); }
  else if (a.f('selector') || a.b('all')) { names = c.list('Node').filter((n) => selMatch(n, a.f('selector'))).map((n) => n.metadata.name); specs = pos.slice(1); }
  else { names = [pos[1]]; specs = pos.slice(2); }
  if (!specs.length) return R('', 'error: at least one taint update is required');
  const out = [];
  for (const nn of names) {
    const n = c.get('Node', '', nn);
    if (!n) return R('', `Error from server (NotFound): nodes "${nn}" not found`);
    let taints = n.spec.taints || [];
    let untaint = false;
    for (const s of specs) {
      if (s.endsWith('-')) {
        const body = s.slice(0, -1);
        const m = body.match(/^([^=:]+)(?:=([^:]*))?(?::(\w+))?$/);
        const before = taints.length;
        taints = taints.filter((t) => !(t.key === m[1] && (!m[3] || t.effect === m[3])));
        if (before === taints.length) return R('', `error: taint "${body}" not found`);
        untaint = true;
        continue;
      }
      const m = s.match(/^([^=:]+)(?:=([^:]*))?:(NoSchedule|PreferNoSchedule|NoExecute)$/);
      if (!m) return R('', `error: invalid taint spec: ${s}, unknown taint effect or missing effect`);
      const ex = taints.find((t) => t.key === m[1] && t.effect === m[3]);
      if (ex && !a.b('overwrite')) return R('', `error: node ${nn} already has ${m[1]} taint(s) with same effect(s) and --overwrite is false`);
      taints = taints.filter((t) => !(t.key === m[1] && t.effect === m[3]));
      taints.push({ key: m[1], ...(m[2] ? { value: m[2] } : {}), effect: m[3] });
      // NoExecute 는 버티지 못하는 파드를 쫓아낸다
      if (m[3] === 'NoExecute') for (const p of c.list('Pod').filter((p) => p.spec.nodeName === nn)) { if (!(p.spec.tolerations || []).some((t) => (t.operator === 'Exists' && (!t.key || t.key === m[1])) || (t.key === m[1] && (t.value || '') === (m[2] || '')))) { if (!(p.metadata.annotations || {})['kubernetes.io/config.mirror']) c.remove(p); } }
    }
    if (taints.length) n.spec.taints = taints; else delete n.spec.taints;
    out.push(`node/${nn} ${untaint ? 'untainted' : 'tainted'}`);
  }
  return R(out.join('\n'));
}
function cmdScale(a, io, c) {
  const ns = nsOf(a, c);
  const rep = a.f('replicas');
  if (rep === undefined) return R('', 'error: required flag(s) "replicas" not set');
  const { r, o } = getOne(a, c, ns);
  if (!['Deployment', 'ReplicaSet', 'StatefulSet'].includes(r.kind)) return R('', `error: cannot scale a ${r.kind}`);
  if (a.f('current-replicas') && Number(a.f('current-replicas')) !== (o.spec.replicas ?? 1)) return R('', `error: Expected replicas to be ${a.f('current-replicas')}, was ${o.spec.replicas}`);
  o.spec.replicas = Number(rep);
  return R(`${typeName(r)}/${o.metadata.name} scaled`);
}
function cmdSet(a, io, c) {
  const what = a.pos[0];
  const ns = nsOf(a, c);
  const sub = { ...a, pos: a.pos.slice(1) };
  const { r, o, rest } = getOne(sub, c, ns);
  const spec = r.kind === 'Pod' ? o.spec : r.kind === 'CronJob' ? o.spec.jobTemplate.spec.template.spec : o.spec.template.spec;
  const next = clone(o);
  const nspec = r.kind === 'Pod' ? next.spec : r.kind === 'CronJob' ? next.spec.jobTemplate.spec.template.spec : next.spec.template.spec;
  if (what === 'image') {
    for (const pair of rest) {
      const [cn, img] = pair.split('=');
      const targets2 = cn === '*' ? nspec.containers : nspec.containers.filter((x) => x.name === cn).concat((nspec.initContainers || []).filter((x) => x.name === cn));
      if (!targets2.length) return R('', `error: unable to find container named "${cn}"`);
      for (const x of targets2) x.image = img;
    }
  } else if (what === 'resources') {
    const cts = a.f('container') ? nspec.containers.filter((x) => x.name === a.f('container')) : nspec.containers;
    for (const ct of cts) {
      ct.resources = ct.resources || {};
      if (a.f('limits')) ct.resources.limits = { ...(ct.resources.limits || {}), ...kvList([a.f('limits')]) };
      if (a.f('requests')) ct.resources.requests = { ...(ct.resources.requests || {}), ...kvList([a.f('requests')]) };
    }
  } else if (what === 'env') {
    const cts = a.f('container') ? nspec.containers.filter((x) => x.name === a.f('container')) : nspec.containers;
    for (const ct of cts) {
      ct.env = ct.env || [];
      for (const pair of rest) {
        if (pair.endsWith('-')) { ct.env = ct.env.filter((e) => e.name !== pair.slice(0, -1)); continue; }
        const i = pair.indexOf('='); const k = pair.slice(0, i), v = pair.slice(i + 1);
        const ex = ct.env.find((e) => e.name === k);
        if (ex) ex.value = v; else ct.env.push({ name: k, value: v });
      }
      if (a.f('from')) { const [k2, n2] = a.f('from').split('/'); ct.envFrom = (ct.envFrom || []).concat([/secret/.test(k2) ? { secretRef: { name: n2 } } : { configMapRef: { name: n2 } }]); }
    }
  } else if (what === 'serviceaccount' || what === 'sa') {
    nspec.serviceAccountName = rest[0];
  } else return R('', `error: unknown command "${what}" for "kubectl set"`);
  if (JSON.stringify(spec) === JSON.stringify(nspec)) return R('');
  if (a.b('record')) next.metadata.annotations = { ...(next.metadata.annotations || {}), 'kubernetes.io/change-cause': `kubectl set ${what} ${a.pos.slice(1).join(' ')} --record=true` };
  upsert(c, next, 'replace', o.metadata.namespace);
  return R(`${typeName(r)}/${o.metadata.name} ${what === 'image' ? 'image' : what === 'resources' ? 'resource requirements' : what === 'env' ? 'env' : 'serviceaccount'} updated`);
}

// ─── rollout ───────────────────────────────────────────────────────────────
function cmdRollout(a, io, c) {
  const what = a.pos[0];
  const ns = nsOf(a, c);
  const { r, o } = getOne({ ...a, pos: a.pos.slice(1) }, c, ns);
  const tn = `${typeName(r)}/${o.metadata.name}`;
  if (!['Deployment', 'DaemonSet', 'StatefulSet'].includes(r.kind)) return R('', `error: no rollout ${what} for ${r.kind}`);
  const rss = r.kind === 'Deployment' ? c.ownedBy('ReplicaSet', o).sort((x, y) => Number(x.metadata.annotations['deployment.kubernetes.io/revision']) - Number(y.metadata.annotations['deployment.kubernetes.io/revision'])) : [];
  switch (what) {
    case 'status': {
      if (r.kind !== 'Deployment') return R(`${r.kind.toLowerCase()} "${o.metadata.name}" successfully rolled out`);
      const s = o.status || {};
      const want = o.spec.replicas ?? 1;
      if ((s.updatedReplicas || 0) < want) return R(`Waiting for deployment "${o.metadata.name}" rollout to finish: ${s.updatedReplicas || 0} out of ${want} new replicas have been updated...`, a.f('timeout') ? `error: timed out waiting for the condition` : '');
      if ((s.replicas || 0) > want) return R(`Waiting for deployment "${o.metadata.name}" rollout to finish: ${(s.replicas || 0) - want} old replicas are pending termination...`);
      if ((s.availableReplicas || 0) < want) return R(`Waiting for deployment "${o.metadata.name}" rollout to finish: ${s.availableReplicas || 0} of ${want} updated replicas are available...`, a.f('timeout') ? 'error: timed out waiting for the condition' : '');
      return R(`deployment "${o.metadata.name}" successfully rolled out`);
    }
    case 'history': {
      if (a.f('revision')) {
        const rs = rss.find((x) => x.metadata.annotations['deployment.kubernetes.io/revision'] === a.f('revision'));
        if (!rs) return R('', `error: unable to find the specified revision`);
        return R(`${tn} with revision #${a.f('revision')}\nPod Template:\n${podTemplateBlock(rs.spec.template, '  ')}`);
      }
      return R(`${tn} \n` + table(['REVISION', 'CHANGE-CAUSE'], rss.map((x) => [x.metadata.annotations['deployment.kubernetes.io/revision'], x.metadata.annotations['kubernetes.io/change-cause'] || '<none>'])));
    }
    case 'undo': {
      const curRev = o.metadata.annotations['deployment.kubernetes.io/revision'];
      let target;
      if (a.f('to-revision') && a.f('to-revision') !== '0') target = rss.find((x) => x.metadata.annotations['deployment.kubernetes.io/revision'] === a.f('to-revision'));
      else target = rss.filter((x) => x.metadata.annotations['deployment.kubernetes.io/revision'] !== curRev).pop();
      if (!target) return R('', a.f('to-revision') ? `error: unable to find specified revision ${a.f('to-revision')} in history` : 'error: no rollout history found for deployment "' + o.metadata.name + '"');
      if (target.metadata.annotations['deployment.kubernetes.io/revision'] === curRev) return R(`${tn} skipped rollback (current template already matches revision ${curRev})`);
      const tpl = clone(target.spec.template);
      delete tpl.metadata.labels['pod-template-hash'];
      o.spec.template = tpl;
      if (target.metadata.annotations['kubernetes.io/change-cause']) o.metadata.annotations['kubernetes.io/change-cause'] = target.metadata.annotations['kubernetes.io/change-cause'];
      else delete o.metadata.annotations['kubernetes.io/change-cause'];
      return R(`${tn} rolled back`);
    }
    case 'restart': {
      const tpl = r.kind === 'Deployment' || r.kind === 'DaemonSet' || r.kind === 'StatefulSet' ? o.spec.template : null;
      tpl.metadata = tpl.metadata || {};
      tpl.metadata.annotations = { ...(tpl.metadata.annotations || {}), 'kubectl.kubernetes.io/restartedAt': c.ts() };
      if (r.kind === 'StatefulSet') for (const p of c.ownedBy('Pod', o)) c.remove(p);
      return R(`${tn} restarted`);
    }
    case 'pause': o.spec.paused = true; return R(`${tn} paused`);
    case 'resume': delete o.spec.paused; return R(`${tn} resumed`);
  }
  return R('', `error: unknown command "${what}" for "kubectl rollout"`);
}

// ─── 노드 관리 ─────────────────────────────────────────────────────────────
function cmdCordon(a, io, c, flag) {
  const n = c.get('Node', '', a.pos[0]);
  if (!n) return R('', `Error from server (NotFound): nodes "${a.pos[0]}" not found`);
  if (!!n.spec.unschedulable === flag) return R(`node/${a.pos[0]} already ${flag ? 'cordoned' : 'uncordoned'}`);
  if (flag) n.spec.unschedulable = true; else delete n.spec.unschedulable;
  return R(`node/${a.pos[0]} ${flag ? 'cordoned' : 'uncordoned'}`);
}
function cmdDrain(a, io, c) {
  const nn = a.pos[0];
  const n = c.get('Node', '', nn);
  if (!n) return R('', `Error from server (NotFound): nodes "${nn}" not found`);
  const pods = c.list('Pod').filter((p) => p.spec.nodeName === nn && !(p.metadata.annotations || {})['kubernetes.io/config.mirror']);
  const ds = pods.filter((p) => (p.metadata.ownerReferences || []).some((x) => x.kind === 'DaemonSet'));
  const bare = pods.filter((p) => !(p.metadata.ownerReferences || []).length);
  const local = pods.filter((p) => (p.spec.volumes || []).some((v) => v.emptyDir));
  const errs = [];
  if (ds.length && !a.b('ignore-daemonsets')) errs.push(`cannot delete DaemonSet-managed Pods (use --ignore-daemonsets to ignore): ${ds.map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(', ')}`);
  if (bare.length && !a.b('force')) errs.push(`cannot delete Pods that declare no controller (use --force to override): ${bare.map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(', ')}`);
  if (local.length && !a.b('delete-emptydir-data') && !a.b('delete-local-data')) errs.push(`cannot delete Pods with local storage (use --delete-emptydir-data to override): ${local.map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(', ')}`);
  n.spec.unschedulable = true;
  const out = [`node/${nn} cordoned`];
  if (errs.length) return R(out.join('\n'), `error: unable to drain node "${nn}" due to error: [${errs.join(', ')}], continuing command...\nThere are pending nodes to be drained:\n ${nn}\n` + errs.map((e) => `error: ${e}`).join('\n'));
  if (ds.length) out.push(`Warning: ignoring DaemonSet-managed Pods: ${ds.map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(', ')}`);
  if (bare.length) out.push(`Warning: deleting Pods that declare no controller: ${bare.map((p) => `${p.metadata.namespace}/${p.metadata.name}`).join(', ')}`);
  for (const p of pods.filter((x) => !ds.includes(x))) out.push(`evicting pod ${p.metadata.namespace}/${p.metadata.name}`);
  for (const p of pods.filter((x) => !ds.includes(x))) { c.remove(p); out.push(`pod/${p.metadata.name} evicted`); }
  out.push(`node/${nn} drained`);
  return R(out.join('\n'));
}

// ─── logs · exec · top ─────────────────────────────────────────────────────
function pickPod(a, c, ns, target) {
  if (!target && a.f('selector')) {
    const ps = c.list('Pod', ns).filter((p) => selMatch(p, a.f('selector')));
    if (!ps.length) fail(nsMsg(ns));
    return ps;
  }
  if (!target) fail('error: expected \'logs [-f] [-p] (POD | TYPE/NAME) [-c CONTAINER]\'.\nPOD or TYPE/NAME is a required argument for the logs command');
  if (target.includes('/')) {
    const [t, n] = target.split('/');
    const r = c.resolve(t);
    if (!r) fail(`error: the server doesn't have a resource type "${t}"`);
    const o = c.get(r.kind, ns, n);
    if (!o) fail(nfShort(r, n));
    if (r.kind === 'Pod') return [o];
    const owners = r.kind === 'Deployment' ? c.ownedBy('ReplicaSet', o) : [o];
    const pods = owners.flatMap((x) => c.ownedBy('Pod', x));
    if (!pods.length) fail(`error: timed out waiting for the condition`);
    return [pods.sort((x, y) => Number(isReady(y)) - Number(isReady(x)))[0]];
  }
  const p = c.get('Pod', ns, target);
  if (!p) fail(`Error from server (NotFound): pods "${target}" not found`);
  return [p];
}
function cmdLogs(a, io, c) {
  const ns = nsOf(a, c);
  const pods = pickPod(a, c, ns, a.pos[0]);
  const out = [], errs = [];
  for (const p of pods) {
    const cname = a.f('container') || a.pos[1];
    let ctrs = [...(p.spec.initContainers || []), ...p.spec.containers];
    let ct;
    if (cname) { ct = ctrs.find((x) => x.name === cname); if (!ct) fail(`error: container ${cname} is not valid for pod ${p.metadata.name}`); }
    else if (a.b('all-containers')) ct = null;
    else { ct = p.spec.containers[0]; if (p.spec.containers.length > 1 && pods.length === 1) errs.push(`Defaulted container "${ct.name}" out of: ${p.spec.containers.map((x) => x.name).join(', ')}`); }
    for (const x of ct ? [ct] : p.spec.containers) {
      const st = [...((p.status || {}).containerStatuses || []), ...((p.status || {}).initContainerStatuses || [])].find((s) => s.name === x.name) || {};
      if (!p.spec.nodeName) { errs.push(`Error from server (BadRequest): container "${x.name}" in pod "${p.metadata.name}" is waiting to start: ContainerCreating`); continue; }
      if (st.state && st.state.waiting && ['ImagePullBackOff', 'ErrImagePull'].includes(st.state.waiting.reason)) { errs.push(`Error from server (BadRequest): container "${x.name}" in pod "${p.metadata.name}" is waiting to start: trying and failing to pull image`); continue; }
      if (st.state && st.state.waiting && ['CreateContainerConfigError', 'ContainerCreating', 'PodInitializing'].includes(st.state.waiting.reason)) { errs.push(`Error from server (BadRequest): container "${x.name}" in pod "${p.metadata.name}" is waiting to start: ${st.state.waiting.reason}`); continue; }
      const e = c.evalContainer(x, p.spec, p.metadata.namespace, p.metadata.name);
      let lines = e.logs || [];
      // 컨트롤 플레인 static pod 은 매니페스트 판정의 로그(왜 죽었는지)를 보여 준다 — 트러블슈팅의 핵심 단서
      const comp = p.metadata.name.replace(/-controlplane$/, '');
      if ((p.metadata.annotations || {})['kubernetes.io/config.mirror'] && p.spec.nodeName === 'controlplane' && ['etcd', 'kube-apiserver', 'kube-controller-manager', 'kube-scheduler'].includes(comp)) {
        const hh = c.componentHealth(comp);
        lines = hh.ok ? [`I0901 09:00:01.000000       1 serving.go:386] Generated self-signed cert in-memory`, `I0901 09:00:02.000000       1 leaderelection.go:271] successfully acquired lease kube-system/${comp}`] : (hh.log && hh.log.length ? hh.log : ['(컨테이너가 시작 직후 종료됨)']);
      }
      if (a.b('previous') && !(st.restartCount > 0)) { errs.push(`Error from server (BadRequest): previous terminated container "${x.name}" in pod "${p.metadata.name}" not found`); continue; }
      if (a.f('tail')) lines = lines.slice(-Number(a.f('tail')));
      if (a.b('prefix') || pods.length > 1) lines = lines.map((l) => `[pod/${p.metadata.name}/${x.name}] ${l}`);
      out.push(...lines);
    }
  }
  return R(out.join('\n'), errs.join('\n'));
}

const TOOLS = { // 이미지별로 들어 있는 도구 — 'curl 이 없다'는 실제 시험장 함정 재현
  busybox: ['wget', 'nslookup', 'nc', 'ping', 'cat', 'ls', 'env', 'sh', 'echo', 'hostname', 'date', 'sleep', 'printenv', 'id', 'whoami', 'df', 'ps', 'top', 'mkdir', 'touch'],
  alpine: ['wget', 'nslookup', 'nc', 'ping', 'cat', 'ls', 'env', 'sh', 'echo', 'hostname', 'date', 'printenv', 'id', 'whoami', 'df', 'ps', 'mkdir', 'touch'],
  nginx: ['curl', 'cat', 'ls', 'env', 'sh', 'bash', 'echo', 'hostname', 'date', 'printenv', 'id', 'whoami', 'df', 'nginx', 'mkdir', 'touch'],
  httpd: ['cat', 'ls', 'env', 'sh', 'bash', 'echo', 'hostname', 'date', 'printenv', 'id', 'whoami', 'df', 'mkdir', 'touch'],
  'curlimages/curl': ['curl', 'nslookup', 'cat', 'ls', 'env', 'sh', 'echo', 'hostname', 'date', 'printenv', 'id', 'whoami'],
  'nicolaka/netshoot': ['curl', 'wget', 'nslookup', 'dig', 'nc', 'ping', 'cat', 'ls', 'env', 'sh', 'bash', 'echo', 'hostname', 'date', 'printenv', 'id', 'whoami', 'host'],
};
export function execIn(c, p, cmd, io, cname, oneShot = false) {
  const ct = cname ? p.spec.containers.find((x) => x.name === cname) : p.spec.containers[0];
  if (!ct) return R('', `error: unable to upgrade connection: container not found ("${cname}")`);
  const st = ((p.status || {}).containerStatuses || []).find((s) => s.name === ct.name) || {};
  // oneShot = kubectl run --rm -it … -- 명령: 컨테이너의 명령 자체가 곧 실행할 명령이다
  if (!oneShot && (!st.state || !st.state.running)) return R('', `error: unable to upgrade connection: container not found ("${ct.name}")`);
  if (oneShot && !p.spec.nodeName) return R('', `error: timed out waiting for the condition (파드가 스케줄되지 않았습니다)`);
  const img = parseImage(ct.image).repo;
  const tools = TOOLS[img] || TOOLS.busybox;
  let argv = cmd.slice();
  if ((argv[0] === 'sh' || argv[0] === 'bash' || argv[0] === '/bin/sh' || argv[0] === '/bin/bash') && argv[1] === '-c') argv = shellSplit(argv.slice(2).join(' '));
  if (argv[0] === 'sh' || argv[0] === 'bash' || argv[0] === '/bin/sh' || argv[0] === '/bin/bash') return R('', 'Unable to use a TTY - input is not a terminal or the right kind of file\n(대화형 셸은 이 시뮬레이터에서 지원하지 않는다. `kubectl exec POD -- 명령` 으로 한 줄씩 실행하세요.)');
  const bin = argv[0].split('/').pop();
  if (!tools.includes(bin)) return R('', `error: Internal error occurred: Internal error occurred: error executing command in container: failed to exec in container: failed to start exec "${c.randName(12)}": OCI runtime exec failed: exec failed: unable to start container process: exec: "${argv[0]}": executable file not found in $PATH: unknown\ncommand terminated with exit code 127`);
  const env = { HOSTNAME: p.metadata.name, KUBERNETES_SERVICE_HOST: '10.96.0.1', KUBERNETES_SERVICE_PORT: '443', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', ...c.containerEnv(ct, p.metadata.namespace) };
  const files = podFiles(c, p, ct);
  switch (bin) {
    case 'env': case 'printenv':
      if (argv[1]) return env[argv[1]] !== undefined ? R(env[argv[1]]) : R('', '', 1);
      return R(Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'));
    case 'hostname': return R(p.spec.hostname || p.metadata.name);
    case 'whoami': return R('root');
    case 'id': return R('uid=0(root) gid=0(root) groups=0(root)');
    case 'date': return R(new Date(c.now() * 1000).toUTCString().replace('GMT', 'UTC'));
    case 'echo': return R(argv.slice(1).join(' '));
    case 'cat': {
      const f = argv[1];
      if (files[f] !== undefined) return R(files[f]);
      return R('', `cat: can't open '${f}': No such file or directory\ncommand terminated with exit code 1`);
    }
    case 'ls': {
      const d = (argv.filter((x) => !x.startsWith('-'))[1] || '/').replace(/\/$/, '') + '/';
      const names = [...new Set(Object.keys(files).filter((f) => f.startsWith(d)).map((f) => f.slice(d.length).split('/')[0]))];
      if (!names.length) return R('', `ls: ${d}: No such file or directory\ncommand terminated with exit code 1`);
      return R(names.sort().join('\n'));
    }
    case 'nslookup': case 'host': case 'dig': {
      const host = argv.filter((x) => !x.startsWith('-') && !x.startsWith('+'))[1];
      if (!host) return R('', 'usage: nslookup HOST');
      const res = c.resolveDNS(p, host);
      if (!res.ok) {
        if (res.why === 'coredns' || res.why === 'egress') return R(';; connection timed out; no servers could be reached\n', 'command terminated with exit code 1');
        return R(`Server:\t\t10.96.0.10\nAddress:\t10.96.0.10:53\n\n** server can't find ${host}.${p.metadata.namespace}.svc.cluster.local: NXDOMAIN\n`, 'command terminated with exit code 1');
      }
      const fq = res.fqdn || (res.target.pod ? `${res.ip.replace(/\./g, '-')}.${p.metadata.namespace}.pod.cluster.local` : host);
      return R(`Server:\t\t10.96.0.10\nAddress:\t10.96.0.10:53\n\n${(res.headless || [res.ip]).map((ip) => `Name:\t${fq}\nAddress: ${ip}`).join('\n')}\n`);
    }
    case 'curl': case 'wget': {
      const url = argv.slice(1).find((x) => /^(https?:\/\/)?[\w.-]+(:\d+)?(\/.*)?$/.test(x) && !x.startsWith('-') && !/^\d+$/.test(x));
      if (!url) return R('', bin === 'curl' ? 'curl: try \'curl --help\' for more information' : 'BusyBox wget: no URL');
      const m = url.replace(/^https?:\/\//, '').match(/^([^/:]+)(?::(\d+))?/);
      const host = m[1], port = Number(m[2] || (url.startsWith('https') ? 443 : 80));
      const res = c.connect(p, host, port);
      if (res.ok) return R(res.body);
      if (bin === 'wget') {
        if (res.dnsFail) return R('', `wget: bad address '${host}${m[2] ? ':' + m[2] : ''}'\ncommand terminated with exit code 1`);
        if (res.timeout) return R(`Connecting to ${host}${m[2] ? ':' + m[2] : ''}`, 'wget: download timed out\ncommand terminated with exit code 1');
        return R(`Connecting to ${host}${m[2] ? ':' + m[2] : ''}`, 'wget: can\'t connect to remote host: Connection refused\ncommand terminated with exit code 1');
      }
      if (res.dnsFail) return R('', `curl: (6) Could not resolve host: ${host}\ncommand terminated with exit code 6`);
      if (res.timeout) return R('', `curl: (28) Failed to connect to ${host} port ${port} after 5001 ms: Timeout was reached\ncommand terminated with exit code 28`);
      return R('', `curl: (7) Failed to connect to ${host} port ${port} after 2 ms: Couldn't connect to server\ncommand terminated with exit code 7`);
    }
    case 'nc': {
      const rest = argv.slice(1).filter((x) => !x.startsWith('-'));
      const [host, port] = rest;
      const res = c.connect(p, host, Number(port));
      if (res.ok) return R('', `${host} (${res.pod._ip}:${port}) open`);
      return R('', `nc: ${host} (${port}): ${res.timeout ? 'Operation timed out' : 'Connection refused'}\ncommand terminated with exit code 1`);
    }
    case 'ping': return R('', 'PING: ICMP 은 쿠버네티스 서비스 IP 에 응답하지 않는다(가상 IP). 서비스 연결은 wget/curl/nc 로 확인하세요.');
    case 'mkdir': case 'touch': return R('');
    default: return R('', `sh: ${argv[0]}: not found\ncommand terminated with exit code 127`);
  }
}
function podFiles(c, p, ct) {
  const ns = p.metadata.namespace;
  const files = { '/etc/hostname': p.metadata.name, '/etc/resolv.conf': `search ${ns}.svc.cluster.local svc.cluster.local cluster.local\nnameserver 10.96.0.10\noptions ndots:5`, '/var/run/secrets/kubernetes.io/serviceaccount/namespace': ns, '/var/run/secrets/kubernetes.io/serviceaccount/token': 'eyJhbGciOiJSUzI1NiIs…', '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt': '-----BEGIN CERTIFICATE-----…' };
  if (p.spec.automountServiceAccountToken === false) for (const k of Object.keys(files)) if (k.includes('serviceaccount')) delete files[k];
  const img = parseImage(ct.image).repo;
  if (img === 'nginx') { files['/usr/share/nginx/html/index.html'] = '<h1>Welcome to nginx!</h1>'; files['/etc/nginx/nginx.conf'] = 'user  nginx;\nworker_processes  auto;\n…'; }
  for (const vm of ct.volumeMounts || []) {
    const v = (p.spec.volumes || []).find((x) => x.name === vm.name);
    if (!v) continue;
    const base = vm.mountPath.replace(/\/$/, '');
    let data = {};
    if (v.configMap) { const cm = c.get('ConfigMap', ns, v.configMap.name); data = { ...(cm || {}).data }; if (v.configMap.items) data = Object.fromEntries(v.configMap.items.map((it) => [it.path, data[it.key]])); }
    if (v.secret) { const s = c.get('Secret', ns, v.secret.secretName); data = Object.fromEntries(Object.entries((s || {}).data || {}).map(([k, val]) => [k, b64d(val)])); if (v.secret.items) data = Object.fromEntries(v.secret.items.map((it) => [it.path, data[it.key]])); }
    if (vm.subPath) { files[base] = data[vm.subPath] ?? ''; continue; }
    for (const [k, val] of Object.entries(data)) files[`${base}/${k}`] = val;
    if (!Object.keys(data).length) files[`${base}/.keep`] = '';
    // 같은 볼륨에 다른 컨테이너가 echo … > 파일 로 쓴 내용
    for (const other of p.spec.containers.concat(p.spec.initContainers || [])) {
      const om = (other.volumeMounts || []).find((x) => x.name === vm.name);
      if (!om) continue;
      const cmd = [].concat(other.command || [], other.args || []).join(' ');
      for (const m of cmd.matchAll(/echo\s+(?:"([^"]*)"|'([^']*)'|([^;&|>"']+?))\s*(>>?)\s*([^\s;&|]+)/g)) {
        const path = m[5];
        if (!path.startsWith(om.mountPath)) continue;
        const rel = path.slice(om.mountPath.replace(/\/$/, '').length);
        const line = (m[1] ?? m[2] ?? m[3]).replace(/\$\(date\)/g, 'Tue Sep  1 09:00:00 UTC 2026');
        const f = base + rel;
        files[f] = m[4] === '>>' ? [files[f], line, line].filter(Boolean).join('\n') : line;
      }
    }
  }
  return files;
}
export function shellSplit(s) {
  const out = []; let cur = '', q = null, has = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === q) q = null; else if (ch === '\\' && q === '"' && i + 1 < s.length) cur += s[++i]; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (cur || has) out.push(cur); cur = ''; has = false; continue; }
    if (ch === '\\' && i + 1 < s.length) { cur += s[++i]; continue; }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}
function cmdExec(a, io, c) {
  const ns = nsOf(a, c);
  let target = a.pos[0];
  if (!target) return R('', 'error: pod, type/name or --filename must be specified');
  const p = pickPod(a, c, ns, target)[0];
  let cmd = a.dash.length ? a.dash : a.pos.slice(1);
  if (!cmd.length) return R('', 'error: you must specify at least one command for the container');
  return execIn(c, p, cmd, io, a.f('container'));
}

export function podMetrics(c, p) {
  let h = 0; for (const ch of p.metadata.name) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  let cpu = (h % 40) + 1, mem = (h % 90) + 6;
  const cmd = p.spec.containers.map((x) => [].concat(x.command || [], x.args || []).join(' ')).join(' ');
  if (/stress|--cpu|burn|yes >/.test(cmd) || /hog|burn|stress/.test(p.metadata.name)) { cpu = 480 + (h % 300); mem = 150 + (h % 80); }
  if (p.metadata.namespace === 'kube-system') { cpu = (h % 20) + 2; mem = (h % 60) + 15; if (/apiserver/.test(p.metadata.name)) { cpu = 42; mem = 312; } if (/etcd/.test(p.metadata.name)) { cpu = 21; mem = 64; } }
  if (c.metricsOverride && c.metricsOverride[`${p.metadata.namespace}/${p.metadata.name}`]) return c.metricsOverride[`${p.metadata.namespace}/${p.metadata.name}`];
  return { cpu, mem };
}
function cmdTop(a, io, c) {
  const what = a.pos[0];
  const ms = c.list('Pod', 'kube-system').find((p) => (p.metadata.labels || {})['k8s-app'] === 'metrics-server');
  if (!ms || !isReady(ms)) return R('', 'error: Metrics API not available');
  const ns = a.b('all-namespaces') ? null : nsOf(a, c);
  if (/^(node|nodes|no)$/.test(what)) {
    const rows = c.list('Node').filter((n) => !a.pos[1] || n.metadata.name === a.pos[1]).map((n) => {
      const pods = c.list('Pod').filter((p) => p.spec.nodeName === n.metadata.name && isReady(p));
      const cpu = pods.reduce((s, p) => s + podMetrics(c, p).cpu, 0) + 60, mem = pods.reduce((s, p) => s + podMetrics(c, p).mem, 0) + 700;
      const ready = nodeStatus(n).startsWith('Ready');
      return ready ? [n.metadata.name, `${cpu}m`, `${Math.round(cpu / 20)}%`, `${mem}Mi`, `${Math.round(mem / 39.13)}%`] : [n.metadata.name, '<unknown>', '<unknown>', '<unknown>', '<unknown>'];
    });
    let sorted = rows;
    if (a.f('sort-by') === 'cpu') sorted = rows.slice().sort((x, y) => parseInt(y[1]) - parseInt(x[1]));
    if (a.f('sort-by') === 'memory') sorted = rows.slice().sort((x, y) => parseInt(y[3]) - parseInt(x[3]));
    const tb = table(['NAME', 'CPU(cores)', 'CPU(%)', 'MEMORY(bytes)', 'MEMORY(%)'], sorted);
    return R(a.b('no-headers') ? tb.split('\n').slice(1).join('\n') : tb);
  }
  if (/^(pod|pods|po)$/.test(what)) {
    let pods = c.list('Pod', ns).filter((p) => isReady(p) && selMatch(p, a.f('selector')) && (!a.pos[1] || p.metadata.name === a.pos[1]));
    if (!pods.length) return R('', nsMsg(ns));
    let rows = pods.map((p) => ({ p, m: podMetrics(c, p) }));
    if (a.f('sort-by') === 'cpu') rows.sort((x, y) => y.m.cpu - x.m.cpu);
    if (a.f('sort-by') === 'memory') rows.sort((x, y) => y.m.mem - x.m.mem);
    if (a.b('containers')) return R(table([...(ns ? [] : ['NAMESPACE']), 'POD', 'NAME', 'CPU(cores)', 'MEMORY(bytes)'], rows.flatMap(({ p, m }) => p.spec.containers.map((ct, i) => [...(ns ? [] : [p.metadata.namespace]), p.metadata.name, ct.name, `${Math.round(m.cpu / p.spec.containers.length)}m`, `${Math.round(m.mem / p.spec.containers.length)}Mi`]))));
    const tb = table([...(ns ? [] : ['NAMESPACE']), 'NAME', 'CPU(cores)', 'MEMORY(bytes)'], rows.map(({ p, m }) => [...(ns ? [] : [p.metadata.namespace]), p.metadata.name, `${m.cpu}m`, `${m.mem}Mi`]));
    return R(a.b('no-headers') ? tb.split('\n').slice(1).join('\n') : tb);
  }
  return R('', 'error: unknown command "' + what + '" for "kubectl top"');
}

// ─── auth · config · 기타 ──────────────────────────────────────────────────
function cmdAuth(a, io, c) {
  if (a.pos[0] === 'whoami') return R(table(['ATTRIBUTE', 'VALUE'], [['Username', 'kubernetes-admin'], ['Groups', '[kubeadm:cluster-admins system:authenticated]']]));
  if (a.pos[0] !== 'can-i') return R('', `error: unknown command "${a.pos[0]}" for "kubectl auth"`);
  const verb = a.pos[1];
  let res = a.pos[2] || '';
  let name;
  if (res.includes('/') && !res.startsWith('pods/') && !/^\w+\/(log|exec|scale|status|portforward|proxy)$/.test(res)) { [res, name] = res.split('/'); }
  const [base, subr] = res.split('/');
  const r = c.resolve(base.split('.')[0]);
  if (!r && base !== '*') return R('', `Warning: the server doesn't have a resource type '${base}'\nno`);
  const group = base.includes('.') ? base.split('.').slice(1).join('.') : r ? groupOf(r) : '*';
  const plural = (r ? r.plural : '*') + (subr ? '/' + subr : a.f('subresource') ? '/' + a.f('subresource') : '');
  const as = a.f('as');
  const ns = a.b('all-namespaces') ? '' : nsOf(a, c);
  if (!as) return R('yes');
  let subject;
  const m = as.match(/^system:serviceaccount:([^:]+):(.+)$/);
  if (m) subject = { user: as, sa: { ns: m[1], name: m[2] }, groups: ['system:serviceaccounts', `system:serviceaccounts:${m[1]}`, 'system:authenticated'] };
  else subject = { user: as, groups: a.fa('as-group').concat(['system:authenticated']) };
  const ok = c.canI(subject, verb, plural, r && !r.ns ? '' : ns, name || a.pos[3], group);
  return ok ? R('yes') : R('no', '');
}
function cmdConfig(a, io, c) {
  const sub = a.pos[0];
  switch (sub) {
    case 'current-context': return R(c.currentContext);
    case 'get-contexts': return R(table(['CURRENT', 'NAME', 'CLUSTER', 'AUTHINFO', 'NAMESPACE'], c.contexts.filter((x) => !a.pos[1] || x.name === a.pos[1]).map((x) => [x.name === c.currentContext ? '*' : '', x.name, x.cluster, x.user, x.namespace || ''])) + (a.f('output') === 'name' ? '' : ''));
    case 'get-clusters': return R('NAME\n' + [...new Set(c.contexts.map((x) => x.cluster))].join('\n'));
    case 'use-context': case 'use': {
      const n = a.pos[1];
      if (!c.contexts.some((x) => x.name === n)) return R('', `error: no context exists with the name: "${n}"`);
      c.currentContext = n;
      return R(`Switched to context "${n}".`);
    }
    case 'set-context': {
      const n = a.b('current') ? c.currentContext : a.pos[1];
      let ctx = c.contexts.find((x) => x.name === n);
      if (!ctx) { ctx = { name: n, cluster: a.f('cluster') || 'kubernetes', user: a.f('user') || 'kubernetes-admin', namespace: '' }; c.contexts.push(ctx); }
      if (a.f('namespace') !== undefined) ctx.namespace = a.f('namespace');
      if (a.f('cluster')) ctx.cluster = a.f('cluster');
      if (a.f('user')) ctx.user = a.f('user');
      return R(`Context "${n}" modified.`);
    }
    case 'view': return R(`apiVersion: v1\nclusters:\n- cluster:\n    certificate-authority-data: DATA+OMITTED\n    server: https://172.30.1.2:6443\n  name: kubernetes\ncontexts:\n${c.contexts.map((x) => `- context:\n    cluster: ${x.cluster}\n${x.namespace ? `    namespace: ${x.namespace}\n` : ''}    user: ${x.user}\n  name: ${x.name}`).join('\n')}\ncurrent-context: ${c.currentContext}\nkind: Config\npreferences: {}\nusers:\n- name: kubernetes-admin\n  user:\n    client-certificate-data: DATA+OMITTED\n    client-key-data: DATA+OMITTED`);
    default: return R('', `error: unknown command "${sub}" for "kubectl config"`);
  }
}
function cmdApiResources(a, io, c) {
  let rs = c.allResources().filter((r) => r.kind !== 'Event' || true);
  if (a.f('namespaced') !== undefined) rs = rs.filter((r) => String(r.ns) === a.f('namespaced'));
  if (a.f('api-group') !== undefined) rs = rs.filter((r) => groupOf(r) === a.f('api-group'));
  if (a.f('output') === 'name') return R(rs.map((r) => r.plural + (groupOf(r) ? '.' + groupOf(r) : '')).join('\n'));
  return R(table(['NAME', 'SHORTNAMES', 'APIVERSION', 'NAMESPACED', 'KIND'], rs.map((r) => [r.plural, r.short.join(','), r.api, String(r.ns), r.kind])));
}
const EXPLAIN = {
  pod: 'KIND:       Pod\nVERSION:    v1\n\nDESCRIPTION:\n    Pod is a collection of containers that can run on a host. This resource is\n    created by clients and scheduled onto hosts.\n\nFIELDS:\n  apiVersion\t<string>\n  kind\t<string>\n  metadata\t<ObjectMeta>\n  spec\t<PodSpec>\n  status\t<PodStatus>',
  'pod.spec': 'KIND:       Pod\nVERSION:    v1\n\nFIELD: spec <PodSpec>\n\nFIELDS:\n  activeDeadlineSeconds\t<integer>\n  affinity\t<Affinity>\n  automountServiceAccountToken\t<boolean>\n  containers\t<[]Container> -required-\n  dnsPolicy\t<string>\n  hostNetwork\t<boolean>\n  initContainers\t<[]Container>\n  nodeName\t<string>\n  nodeSelector\t<map[string]string>\n  priorityClassName\t<string>\n  restartPolicy\t<string>\n  schedulerName\t<string>\n  securityContext\t<PodSecurityContext>\n  serviceAccountName\t<string>\n  terminationGracePeriodSeconds\t<integer>\n  tolerations\t<[]Toleration>\n  topologySpreadConstraints\t<[]TopologySpreadConstraint>\n  volumes\t<[]Volume>',
  'pod.spec.containers': 'FIELD: containers <[]Container>\n\nFIELDS:\n  args\t<[]string>\n  command\t<[]string>\n  env\t<[]EnvVar>\n  envFrom\t<[]EnvFromSource>\n  image\t<string>\n  imagePullPolicy\t<string>\n  livenessProbe\t<Probe>\n  name\t<string> -required-\n  ports\t<[]ContainerPort>\n  readinessProbe\t<Probe>\n  resources\t<ResourceRequirements>\n  securityContext\t<SecurityContext>\n  startupProbe\t<Probe>\n  volumeMounts\t<[]VolumeMount>\n  workingDir\t<string>',
  'pod.spec.tolerations': 'FIELD: tolerations <[]Toleration>\n\nFIELDS:\n  effect\t<string>\n    enum: NoExecute, NoSchedule, PreferNoSchedule\n  key\t<string>\n  operator\t<string>\n    enum: Equal, Exists\n  tolerationSeconds\t<integer>\n  value\t<string>',
  'pod.spec.affinity.nodeaffinity': 'FIELD: nodeAffinity <NodeAffinity>\n\nFIELDS:\n  preferredDuringSchedulingIgnoredDuringExecution\t<[]PreferredSchedulingTerm>\n  requiredDuringSchedulingIgnoredDuringExecution\t<NodeSelector>',
  'deployment.spec': 'KIND:       Deployment\nVERSION:    apps/v1\n\nFIELD: spec <DeploymentSpec>\n\nFIELDS:\n  minReadySeconds\t<integer>\n  paused\t<boolean>\n  progressDeadlineSeconds\t<integer>\n  replicas\t<integer>\n  revisionHistoryLimit\t<integer>\n  selector\t<LabelSelector> -required-\n  strategy\t<DeploymentStrategy>\n  template\t<PodTemplateSpec> -required-',
  'deployment.spec.strategy.rollingupdate': 'FIELD: rollingUpdate <RollingUpdateDeployment>\n\nFIELDS:\n  maxSurge\t<IntOrString>\n  maxUnavailable\t<IntOrString>',
  'persistentvolumeclaim.spec': 'KIND:       PersistentVolumeClaim\nVERSION:    v1\n\nFIELD: spec <PersistentVolumeClaimSpec>\n\nFIELDS:\n  accessModes\t<[]string>\n  dataSource\t<TypedLocalObjectReference>\n  resources\t<VolumeResourceRequirements>\n  selector\t<LabelSelector>\n  storageClassName\t<string>\n  volumeMode\t<string>\n  volumeName\t<string>',
  'networkpolicy.spec': 'KIND:       NetworkPolicy\nVERSION:    networking.k8s.io/v1\n\nFIELD: spec <NetworkPolicySpec>\n\nFIELDS:\n  egress\t<[]NetworkPolicyEgressRule>\n  ingress\t<[]NetworkPolicyIngressRule>\n  podSelector\t<LabelSelector>\n  policyTypes\t<[]string>',
  'service.spec': 'KIND:       Service\nVERSION:    v1\n\nFIELD: spec <ServiceSpec>\n\nFIELDS:\n  clusterIP\t<string>\n  externalTrafficPolicy\t<string>\n  ports\t<[]ServicePort>\n  selector\t<map[string]string>\n  sessionAffinity\t<string>\n  type\t<string>\n    enum: ClusterIP, ExternalName, LoadBalancer, NodePort',
};
function cmdExplain(a, io, c) {
  const path = (a.pos[0] || '').toLowerCase();
  const [base, ...rest] = path.split('.');
  const r = c.resolve(base);
  if (!r) return R('', `error: the server doesn't have a resource type "${base}"`);
  const k = [r.kind.toLowerCase(), ...rest].join('.');
  if (EXPLAIN[k]) return R(EXPLAIN[k]);
  if (r.crd) {
    const crd = c.get('CustomResourceDefinition', '', r.crd);
    const v = ((crd.spec.versions || []).find((x) => x.storage) || {});
    let node = ((v.schema || {}).openAPIV3Schema) || {};
    for (const seg of rest) node = ((node.properties || {})[Object.keys(node.properties || {}).find((x) => x.toLowerCase() === seg)]) || {};
    const fields = Object.entries(node.properties || {}).map(([n, s]) => `  ${n}\t<${s.type || 'Object'}>${(node.required || []).includes(n) ? ' -required-' : ''}${s.description ? '\n    ' + s.description : ''}`);
    return R(`GROUP:      ${r.group}\nKIND:       ${r.kind}\nVERSION:    ${r.api.split('/')[1]}\n\n${rest.length ? `FIELD: ${rest[rest.length - 1]} <${node.type || 'Object'}>\n\n` : ''}DESCRIPTION:\n    ${node.description || '<empty>'}\n\nFIELDS:\n${fields.join('\n') || '  <none>'}`);
  }
  return R(`KIND:       ${r.kind}\nVERSION:    ${r.api}\n\n${rest.length ? `FIELD: ${rest.join('.')}\n\n` : ''}DESCRIPTION:\n    (시뮬레이터: 이 경로의 상세 설명은 수록하지 않았습니다. 시험장에서는 kubectl explain ${a.pos[0]} --recursive 로 전체 필드를 봅니다.)`);
}
function cmdVersion(a, io, c) {
  const h = c.componentHealth('kube-apiserver');
  const sv = h.ok ? h.container.image.split(':').pop() : null;
  return R(`Client Version: ${c.hosts[io.host || 'controlplane'].pkgs.kubectl}\nKustomize Version: v5.7.1${sv ? `\nServer Version: ${sv}` : ''}`, sv ? '' : 'The connection to the server 172.30.1.2:6443 was refused - did you specify the right host or port?');
}
function cmdClusterInfo() {
  return R('Kubernetes control plane is running at https://172.30.1.2:6443\nCoreDNS is running at https://172.30.1.2:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy\n\nTo further debug and diagnose cluster problems, use \'kubectl cluster-info dump\'.');
}
function cmdAutoscale(a, io, c) {
  const ns = nsOf(a, c);
  const { r, o } = getOne(a, c, ns);
  const max = a.f('max');
  if (!max) return R('', 'error: --max=MAXPODS is required and must be at least 1, max: -1');
  const cpu = a.f('cpu-percent') || (a.f('cpu') || '').replace('%', '');
  const mem = (a.f('memory') || '').replace('%', '');
  const metrics = [];
  if (cpu) metrics.push({ type: 'Resource', resource: { name: 'cpu', target: { type: 'Utilization', averageUtilization: Number(cpu) } } });
  if (mem) metrics.push({ type: 'Resource', resource: { name: 'memory', target: { type: 'Utilization', averageUtilization: Number(mem) } } });
  const hpa = { apiVersion: 'autoscaling/v2', kind: 'HorizontalPodAutoscaler', metadata: { name: a.f('name') || o.metadata.name, namespace: ns }, spec: { maxReplicas: Number(max), ...(a.f('min') ? { minReplicas: Number(a.f('min')) } : {}), ...(metrics.length ? { metrics } : {}), scaleTargetRef: { apiVersion: r.api, kind: r.kind, name: o.metadata.name } }, status: {} };
  return finishCreate(a, c, hpa);
}
function cmdWait(a, io, c) {
  const ns = nsOf(a, c);
  const cond = (a.f('for') || '').replace(/^condition=/, '');
  const ts = targets(a, c);
  const out = [];
  for (const t of ts) {
    const objs = t.name ? [c.get(t.res.kind, ns, t.name)].filter(Boolean) : c.list(t.res.kind, ns).filter((o) => selMatch(o, a.f('selector')));
    for (const o of objs) {
      const ok = (o.status && (o.status.conditions || []).some((x) => x.type.toLowerCase() === cond.toLowerCase() && x.status === 'True')) || (cond === 'delete' && !c.get(o.kind, o.metadata.namespace, o.metadata.name));
      if (!ok) return R(out.join('\n'), `error: timed out waiting for the condition on ${t.res.plural}/${o.metadata.name}`);
      out.push(`${typeName(t.res)}/${o.metadata.name} condition met`);
    }
  }
  return R(out.join('\n'));
}
function cmdKustomize(a, io, c) {
  return R(kustomizeBuild(io, a.pos[0] || '.').map((d) => toYaml(d)).join('\n---\n'));
}
function cmdCertificate() { return R('', 'error: 이 시뮬레이터에는 CSR 과제가 없습니다(2025년 개정 교과과정에서 제외).'); }

const CMDS = {
  get: cmdGet, describe, create: cmdCreate, run: cmdRun, expose: cmdExpose, apply: (a, io, c) => cmdApply(a, io, c, 'apply'), delete: cmdDelete,
  edit: cmdEdit, patch: cmdPatch, replace: cmdReplace, label: (a, io, c) => cmdLabel(a, io, c, 'labels'), annotate: (a, io, c) => cmdLabel(a, io, c, 'annotations'),
  taint: cmdTaint, scale: cmdScale, set: cmdSet, rollout: cmdRollout, cordon: (a, io, c) => cmdCordon(a, io, c, true), uncordon: (a, io, c) => cmdCordon(a, io, c, false),
  drain: cmdDrain, logs: cmdLogs, exec: cmdExec, top: cmdTop, auth: cmdAuth, config: cmdConfig, 'api-resources': cmdApiResources, explain: cmdExplain,
  version: cmdVersion, 'cluster-info': cmdClusterInfo, autoscale: cmdAutoscale, wait: cmdWait, kustomize: cmdKustomize, certificate: cmdCertificate,
  events: (a, io, c) => getEvents(a, c, a.b('all-namespaces') ? null : nsOf(a, c)),
  completion: () => R('# (자동완성 스크립트 — 이 터미널에는 Tab 자동완성이 이미 켜져 있습니다)'),
};

const HELP = `kubectl controls the Kubernetes cluster manager.

 Basic Commands (Beginner):
  create          Create a resource from a file or from stdin
  expose          Take a replication controller, service, deployment or pod and expose it as a new Kubernetes service
  run             Run a particular image on the cluster
  set             Set specific features on objects

 Basic Commands (Intermediate):
  explain         Get documentation for a resource
  get             Display one or many resources
  edit            Edit a resource on the server
  delete          Delete resources by file names, stdin, resources and names, or by resources and label selector

 Deploy Commands:
  rollout         Manage the rollout of a resource
  scale           Set a new size for a deployment, replica set, or replication controller
  autoscale       Auto-scale a deployment, replica set, stateful set, or replication controller

 Cluster Management Commands:
  top             Display resource (CPU/memory) usage
  cordon          Mark node as unschedulable
  uncordon        Mark node as schedulable
  drain           Drain node in preparation for maintenance
  taint           Update the taints on one or more nodes

 Troubleshooting and Debugging Commands:
  describe        Show details of a specific resource or group of resources
  logs            Print the logs for a container in a pod
  exec            Execute a command in a container
  auth            Inspect authorization
  events          List events

 Advanced Commands:
  apply           Apply a configuration to a resource by file name or stdin
  patch           Update fields of a resource
  replace         Replace a resource by file name or stdin
  wait            Experimental: Wait for a specific condition on one or many resources
  kustomize       Build a kustomization target from a directory or URL

 Settings Commands:
  label           Update the labels on a resource
  annotate        Update the annotations on a resource

 Other Commands:
  api-resources   Print the supported API resources on the server
  cluster-info    Display cluster information
  config          Modify kubeconfig files
  version         Print the client and server version information`;
export { okey };
