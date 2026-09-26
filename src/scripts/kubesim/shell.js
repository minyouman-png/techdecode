// 터미널 세션 — bash 흉내(파이프·리다이렉트·&&·heredoc·$VAR·$(…)) + 노드 관리 도구.
//
// ⚠️CKA 시험의 절반은 kubectl 밖에서 일어난다: ssh 로 노드에 들어가 systemctl 로 kubelet 을 살리고,
//   journalctl 로 원인을 읽고, /etc/kubernetes/manifests 를 vi 로 고치고, etcdctl 로 백업한다.
//   그래서 이 파일은 '리눅스 관리자 도구'를 시험에 나오는 만큼만, 대신 결과는 진짜처럼 만든다.
import yaml from 'js-yaml';
import { kubectl, shellSplit } from './kubectl.js';
import { K8S_VERSION, DROPIN_PATH, b64d, b64e } from './engine.js';
import { table } from './format.js';
import { clone } from './resources.js';

const R = (out = '', err = '', code) => ({ out, err, code: code ?? (err && !out ? 1 : 0) });

export class Session {
  constructor(cluster) {
    this.c = cluster;
    this.host = 'controlplane';
    this.cwd = '/root';
    this.env = { HOME: '/root', USER: 'root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', KUBECONFIG: '/root/.kube/config' };
    this.aliases = { k: 'kubectl' };
    this.history = [];
    this.hostStack = [];
    this.pending = null; // heredoc 수집 중
  }
  get h() { return this.c.hosts[this.host]; }
  prompt() { return this.pending ? '> ' : `root@${this.host}:${this.cwd === '/root' ? '~' : this.cwd}# `; }
  kubeletOk() { return this.c.kubeletState(this.host).ok; }

  // ── 파일 ──
  abs(p) {
    if (!p) return this.cwd;
    p = p.replace(/^~(?=\/|$)/, '/root');
    if (!p.startsWith('/')) p = (this.cwd === '/' ? '' : this.cwd) + '/' + p;
    const parts = [];
    for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') parts.pop(); else parts.push(s); }
    return '/' + parts.join('/');
  }
  readFile(p) {
    if (p === '-') return this.stdin ?? '';
    const f = this.h.files[this.abs(p)];
    return f === undefined ? null : f;
  }
  writeFile(p, content) {
    const a = this.abs(p);
    this.h.files[a] = content;
  }
  stat(p) {
    const a = this.abs(p);
    if (this.h.files[a] !== undefined) return 'file';
    const pre = a === '/' ? '/' : a + '/';
    if (a === '/' || Object.keys(this.h.files).some((f) => f.startsWith(pre)) || (this.h.dirs && this.h.dirs.has(a))) return 'dir';
    if (['/root', '/tmp', '/opt'].includes(a)) return 'dir';
    return null;
  }
  listDir(p) {
    const a = this.abs(p);
    const pre = a === '/' ? '/' : a + '/';
    return Object.keys(this.h.files).filter((f) => f.startsWith(pre) && !f.slice(pre.length).includes('/')).sort();
  }
  io() {
    return { cluster: this.c, host: this.host, readFile: (p) => this.readFile(p), writeFile: (p, t) => this.writeFile(p, t), stat: (p) => this.stat(p), listDir: (p) => this.listDir(p), abs: (p) => this.abs(p), fetchUrl: () => null };
  }

  // ── 실행 ──
  /** 한 줄 실행. 편집기를 열어야 하면 { edit } 을 돌려준다 */
  run(line) {
    if (this.pending) {
      if (line.trim() === this.pending.tag) {
        const p = this.pending;
        this.pending = null;
        return this.exec(p.cmd, p.lines.join('\n') + '\n');
      }
      this.pending.lines.push(line);
      return R('');
    }
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return R('');
    this.history.push(trimmed);
    const hd = trimmed.match(/<<-?\s*['"]?(\w+)['"]?/);
    if (hd) {
      this.pending = { tag: hd[1], cmd: trimmed.replace(hd[0], ''), lines: [] };
      return R('');
    }
    return this.exec(trimmed);
  }
  runAll(text) { return text.split('\n').map((l) => this.run(l)); }

  exec(line, stdin) {
    this.c.tick(2);
    const chunks = splitOps(line);
    let last = R('');
    const outs = [], errs = [];
    let edit = null, clear = false;
    for (const ch of chunks) {
      if (ch.op === '&&' && last.code) continue;
      if (ch.op === '||' && !last.code) continue;
      last = this.pipeline(ch.cmd, stdin);
      stdin = undefined;
      if (last.out) outs.push(last.out);
      if (last.err) errs.push(last.err);
      if (last.edit) { edit = last.edit; break; }
      if (last.clear) clear = true;
    }
    return { out: outs.join('\n'), err: errs.join('\n'), code: last.code, edit, clear };
  }

  pipeline(cmd, stdin) {
    const stages = splitPipes(cmd);
    let input = stdin;
    let res = R('');
    const errs = [];
    for (let i = 0; i < stages.length; i++) {
      let s = stages[i].trim();
      let outFile = null, append = false, merge = false, devnullErr = false;
      s = s.replace(/\s2>&1/g, () => { merge = true; return ''; });
      s = s.replace(/\s2>\s*\/dev\/null/g, () => { devnullErr = true; return ''; });
      const rm = matchRedirect(s);
      if (rm) { s = rm.cmd; outFile = rm.file; append = rm.append; }
      const inR = s.match(/\s<\s*(\S+)\s*$/);
      if (inR) { const t = this.readFile(inR[1]); if (t === null) return R('', `bash: ${inR[1]}: No such file or directory`); input = t; s = s.slice(0, inR.index); }
      res = this.simple(s, input);
      if (res.edit || res.clear) return res;
      let out = res.out || '';
      if (merge && res.err) { out = [out, res.err].filter(Boolean).join('\n'); res.err = ''; }
      if (devnullErr) res.err = '';
      if (res.err) errs.push(res.err);
      if (outFile) {
        if (outFile !== '/dev/null') {
          const p = this.abs(outFile);
          const dir = p.slice(0, p.lastIndexOf('/')) || '/';
          if (this.stat(dir) !== 'dir') return R('', `bash: ${outFile}: No such file or directory`, 1);
          const body = out ? out + '\n' : '';
          this.writeFile(p, append ? (this.readFile(p) || '') + body : body);
        }
        out = '';
      }
      input = out;
      res = { ...res, out };
    }
    return { ...res, err: errs.join('\n') };
  }

  expand(s) {
    s = s.replace(/\$\(([^()]*)\)/g, (_, inner) => (this.exec(inner).out || '').trim());
    s = s.replace(/`([^`]*)`/g, (_, inner) => (this.exec(inner).out || '').trim());
    let out = '', q = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "'" && q !== '"') { q = q === "'" ? null : "'"; out += ch; continue; }
      if (ch === '"' && q !== "'") { q = q === '"' ? null : '"'; out += ch; continue; }
      if (ch === '$' && q !== "'") {
        const m = s.slice(i + 1).match(/^\{(\w+)\}|^(\w+)/);
        if (m) { out += this.env[m[1] || m[2]] ?? ''; i += m[0].length; continue; }
      }
      out += ch;
    }
    return out;
  }

  simple(s, stdin) {
    s = this.expand(s.trim());
    let argv = shellSplit(s);
    const envOverride = {};
    while (argv.length > 1 && /^\w+=/.test(argv[0])) { const [k, ...v] = argv.shift().split('='); envOverride[k] = v.join('='); }
    if (argv.length === 1 && /^\w+=/.test(argv[0])) { const [k, ...v] = argv[0].split('='); this.env[k] = v.join('='); return R(''); }
    if (!argv.length) return R('');
    if (argv[0] === 'sudo') { argv = argv.slice(1); if (!argv.length || ['-i', 'su', '-s'].includes(argv[0])) return R(''); }
    if (this.aliases[argv[0]]) argv = shellSplit(this.aliases[argv[0]]).concat(argv.slice(1));
    this.stdin = stdin;
    const fn = BUILTINS[argv[0]];
    if (fn) return fn.call(this, argv.slice(1), stdin, envOverride);
    return R('', `${argv[0]}: command not found`, 127);
  }

  /** Tab 자동완성 후보 */
  complete(line) {
    const toks = line.split(/\s+/);
    const cur = toks[toks.length - 1] || '';
    const first = this.aliases[toks[0]] ? this.aliases[toks[0]].split(' ')[0] : toks[0];
    let cands = [];
    if (toks.length === 1) cands = Object.keys(BUILTINS).concat(Object.keys(this.aliases));
    else if (first === 'kubectl') {
      const subs = ['get', 'describe', 'create', 'run', 'expose', 'apply', 'delete', 'edit', 'patch', 'replace', 'label', 'annotate', 'taint', 'scale', 'set', 'rollout', 'cordon', 'uncordon', 'drain', 'logs', 'exec', 'top', 'auth', 'config', 'api-resources', 'explain', 'version', 'cluster-info', 'autoscale', 'wait', 'kustomize', 'events'];
      const nonFlag = toks.slice(1, -1).filter((t) => !t.startsWith('-'));
      const prev = toks[toks.length - 2];
      if (toks.length === 2) cands = subs;
      else if (cur.startsWith('-')) cands = ['--namespace', '--all-namespaces', '--output=yaml', '--dry-run=client', '--image=', '--replicas=', '--selector', '--show-labels', '--force', '--grace-period=0', '--ignore-daemonsets', '--delete-emptydir-data', '--overwrite', '--port=', '--target-port=', '--type=', '--to-revision='];
      else if (['-f', '--filename', '-k'].includes(prev)) cands = this.fileCands(cur);
      else if (['-n', '--namespace'].includes(prev)) cands = this.c.list('Namespace').map((n) => n.metadata.name);
      else if (nonFlag.length === 1 && ['get', 'describe', 'delete', 'edit', 'label', 'annotate', 'explain', 'scale', 'patch', 'expose'].includes(nonFlag[0])) cands = this.c.allResources().map((r) => r.plural).concat(this.c.allResources().flatMap((r) => r.short), ['all']);
      else if (nonFlag.length === 1 && ['logs', 'exec'].includes(nonFlag[0])) cands = this.c.list('Pod', this.nsHint(toks)).map((p) => p.metadata.name);
      else if (nonFlag.length === 1 && ['cordon', 'uncordon', 'drain'].includes(nonFlag[0])) cands = this.c.list('Node').map((n) => n.metadata.name);
      else if (nonFlag.length === 2 && ['get', 'describe', 'delete', 'edit', 'label', 'annotate', 'scale', 'patch', 'expose'].includes(nonFlag[0])) {
        const r = this.c.resolve(nonFlag[1]);
        if (r) cands = this.c.list(r.kind, r.ns ? this.nsHint(toks) : null).map((o) => o.metadata.name);
      } else if (nonFlag[0] === 'rollout' && nonFlag.length === 1) cands = ['status', 'history', 'undo', 'restart', 'pause', 'resume'];
      else if (nonFlag[0] === 'create' && nonFlag.length === 1) cands = ['deployment', 'service', 'configmap', 'secret', 'serviceaccount', 'role', 'rolebinding', 'clusterrole', 'clusterrolebinding', 'namespace', 'job', 'cronjob', 'ingress', 'priorityclass', 'quota', 'token'];
      else cands = this.fileCands(cur);
    } else if (first === 'ssh') cands = Object.keys(this.c.hosts);
    else cands = this.fileCands(cur);
    return [...new Set(cands)].filter((x) => x.startsWith(cur)).sort();
  }
  nsHint(toks) {
    const i = toks.findIndex((t) => t === '-n' || t === '--namespace');
    return i >= 0 && toks[i + 1] ? toks[i + 1] : this.c.ns;
  }
  fileCands(cur) {
    const dir = cur.includes('/') ? cur.slice(0, cur.lastIndexOf('/') + 1) : '';
    const base = this.abs(dir || '.');
    const pre = base === '/' ? '/' : base + '/';
    const names = new Set();
    for (const f of Object.keys(this.h.files)) if (f.startsWith(pre)) { const rest = f.slice(pre.length); names.add(rest.includes('/') ? rest.split('/')[0] + '/' : rest); }
    return [...names].map((n) => dir + n);
  }
}

function splitOps(line) {
  const out = []; let cur = '', q = null, op = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === q) q = null; cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if ((ch === '&' && line[i + 1] === '&') || (ch === '|' && line[i + 1] === '|')) { out.push({ op, cmd: cur }); op = ch + ch; cur = ''; i++; continue; }
    if (ch === ';') { out.push({ op, cmd: cur }); op = ';'; cur = ''; continue; }
    cur += ch;
  }
  out.push({ op, cmd: cur });
  return out.filter((x) => x.cmd.trim());
}
function splitPipes(cmd) {
  const out = []; let cur = '', q = null, depth = 0;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (q) { if (ch === q) q = null; cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === '|' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
function matchRedirect(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; continue; }
    if (ch === '>' && s[i - 1] !== '2') {
      const append = s[i + 1] === '>';
      const file = shellSplit(s.slice(i + (append ? 2 : 1)).trim())[0];
      return { cmd: s.slice(0, i), file, append };
    }
  }
  return null;
}

// ─── 명령들 ────────────────────────────────────────────────────────────────
const BUILTINS = {
  kubectl(args, stdin) {
    const r = kubectl(args, { ...this.io(), stdin });
    return { ...r, code: r.err && !r.out ? 1 : 0 };
  },
  alias(args) {
    if (!args.length) return R(Object.entries(this.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n'));
    for (const a of args) { const i = a.indexOf('='); if (i > 0) this.aliases[a.slice(0, i)] = a.slice(i + 1); }
    return R('');
  },
  unalias(args) { for (const a of args) delete this.aliases[a]; return R(''); },
  export(args) { for (const a of args) { const i = a.indexOf('='); if (i > 0) this.env[a.slice(0, i)] = a.slice(i + 1); } return R(''); },
  source() { return R(''); }, complete() { return R(''); }, set() { return R(''); },
  echo(args) {
    let e = false;
    while (args[0] === '-n' || args[0] === '-e') { if (args[0] === '-e') e = true; args = args.slice(1); }
    let s = args.join(' ');
    if (e) s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    return R(s);
  },
  pwd() { return R(this.cwd); },
  cd(args) {
    const p = this.abs(args[0] || '/root');
    if (this.stat(p) !== 'dir') return R('', `bash: cd: ${args[0]}: No such file or directory`);
    this.cwd = p; return R('');
  },
  ls(args) {
    const long = args.some((a) => /^-\w*l/.test(a));
    const showAll = args.some((a) => /^-\w*a/.test(a));
    const paths = args.filter((a) => !a.startsWith('-'));
    const outs = [];
    for (const p of paths.length ? paths : ['.']) {
      const st = this.stat(p);
      if (!st) { outs.push(`ls: cannot access '${p}': No such file or directory`); continue; }
      if (st === 'file') { outs.push(long ? `-rw-r--r-- 1 root root ${(this.readFile(p) || '').length} Sep  1 09:00 ${p}` : p); continue; }
      const a = this.abs(p);
      const pre = a === '/' ? '/' : a + '/';
      const names = new Set();
      for (const f of Object.keys(this.h.files)) if (f.startsWith(pre)) { const rest = f.slice(pre.length); names.add(rest.includes('/') ? rest.split('/')[0] + '/' : rest); }
      for (const d of this.h.dirs || []) if (d.startsWith(pre) && !d.slice(pre.length).includes('/')) names.add(d.slice(pre.length) + '/');
      const list = [...names].filter((n) => showAll || !n.startsWith('.')).sort();
      if (paths.length > 1) outs.push(`${p}:`);
      outs.push(long ? list.map((n) => (n.endsWith('/') ? `drwxr-xr-x 2 root root 4096 Sep  1 09:00 ${n.slice(0, -1)}` : `-rw-r--r-- 1 root root ${(this.h.files[pre + n] || '').length} Sep  1 09:00 ${n}`)).join('\n') : list.map((n) => n.replace(/\/$/, '')).join('  '));
    }
    return R(outs.join('\n'));
  },
  cat(args, stdin) {
    const files = args.filter((a) => !a.startsWith('-'));
    if (!files.length) return R((stdin || '').replace(/\n$/, ''));
    const outs = [], errs = [];
    for (const f of files) {
      if (this.stat(f) === 'dir') { errs.push(`cat: ${f}: Is a directory`); continue; }
      const t = this.readFile(f);
      if (t === null) errs.push(`cat: ${f}: No such file or directory`); else outs.push(t.replace(/\n$/, ''));
    }
    return R(outs.join('\n'), errs.join('\n'));
  },
  head(args, stdin) { return headTail.call(this, args, stdin, true); },
  tail(args, stdin) { return headTail.call(this, args, stdin, false); },
  grep(args, stdin) {
    let flags = '', pat = null, ctxA = 0, ctxB = 0;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      const cm = a.match(/^-([ABC])(\d*)$/);
      if (cm) { const n = Number(cm[2] || args[++i]); if (cm[1] !== 'B') ctxA = n; if (cm[1] !== 'A') ctxB = n; continue; }
      if (a === '-e') { pat = args[++i]; continue; }
      if (/^-[A-Za-z]+$/.test(a)) { flags += a.slice(1); continue; }
      if (pat === null) pat = a; else files.push(a);
    }
    if (pat === null) return R('', 'Usage: grep [OPTION]... PATTERNS [FILE]...', 2);
    let text = stdin || '';
    if (files.length) { const t = this.readFile(files[0]); if (t === null) return R('', `grep: ${files[0]}: No such file or directory`, 2); text = t; }
    const src = flags.includes('F') ? pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : flags.includes('E') ? pat : pat.replace(/\\\|/g, '|').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
    let re;
    try { re = new RegExp(flags.includes('w') ? `\\b(?:${src})\\b` : src, flags.includes('i') ? 'i' : ''); } catch { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags.includes('i') ? 'i' : ''); }
    const lines = text.replace(/\n$/, '').split('\n');
    const hit = lines.map((l) => (flags.includes('v') ? !re.test(l) : re.test(l)));
    if (flags.includes('c')) return R(String(hit.filter(Boolean).length));
    const keep = new Set();
    hit.forEach((h, i) => { if (h) for (let j = Math.max(0, i - ctxB); j <= Math.min(lines.length - 1, i + ctxA); j++) keep.add(j); });
    const out = [...keep].sort((a, b) => a - b).map((i) => (flags.includes('n') ? `${i + 1}:` : '') + (flags.includes('o') && !flags.includes('v') ? (lines[i].match(re) || [''])[0] : lines[i]));
    return R(out.join('\n'), '', out.length ? 0 : 1);
  },
  wc(args, stdin) {
    const f = args.find((a) => !a.startsWith('-'));
    const t = f ? this.readFile(f) : stdin || '';
    if (t === null) return R('', `wc: ${f}: No such file or directory`);
    const lines = t ? t.replace(/\n$/, '').split('\n').length : 0;
    if (args.includes('-l')) return R(`${lines}${f ? ' ' + f : ''}`);
    if (args.includes('-w')) return R(String(t.split(/\s+/).filter(Boolean).length));
    return R(`${lines} ${t.split(/\s+/).filter(Boolean).length} ${t.length}${f ? ' ' + f : ''}`);
  },
  sort(args, stdin) {
    const f = args.find((a) => !a.startsWith('-') && !/^\d+$/.test(a));
    let lines = ((f ? this.readFile(f) : stdin) || '').split('\n').filter((l) => l !== '');
    const ki = args.findIndex((a) => a.startsWith('-k'));
    const col = ki >= 0 ? Number(args[ki].slice(2) || args[ki + 1]) - 1 : null;
    const val = (l) => (col !== null ? l.trim().split(/\s+/)[col] || '' : l);
    const num = args.some((a) => /^-\w*[nh]/.test(a));
    lines.sort((a, b) => (num ? parseFloat(val(a)) - parseFloat(val(b)) : val(a).localeCompare(val(b))));
    if (args.some((a) => /^-\w*r/.test(a))) lines.reverse();
    if (args.includes('-u')) lines = [...new Set(lines)];
    return R(lines.join('\n'));
  },
  uniq(args, stdin) { return R((stdin || '').split('\n').filter((l, i, a) => i === 0 || l !== a[i - 1]).join('\n')); },
  awk(args, stdin) {
    const prog = args[0] || '';
    const m = prog.match(/\{\s*print\s+([^}]*)\}/);
    if (!m) return R(stdin || '');
    const cols = m[1].split(',').map((x) => x.trim());
    const cond = prog.match(/^\s*NR\s*>\s*(\d+)/);
    return R((stdin || '').split('\n').filter((l, i) => l && (!cond || i + 1 > Number(cond[1]))).map((l) => { const fs = l.trim().split(/\s+/); return cols.map((c) => (c === '$0' ? l : c.startsWith('$') ? fs[Number(c.slice(1)) - 1] ?? '' : c.replace(/"/g, ''))).join(' '); }).join('\n'));
  },
  base64(args, stdin) {
    const f = args.find((a) => !a.startsWith('-'));
    const t = (f ? this.readFile(f) : stdin) || '';
    if (args.includes('-d') || args.includes('--decode')) return R(b64d(t.trim()));
    return R(b64e(t));
  },
  tee(args, stdin) {
    const app = args.includes('-a');
    for (const f of args.filter((a) => !a.startsWith('-'))) this.writeFile(f, app ? (this.readFile(f) || '') + (stdin || '') + '\n' : (stdin || '') + '\n');
    return R(stdin || '');
  },
  touch(args) { for (const f of args.filter((a) => !a.startsWith('-'))) if (this.readFile(f) === null) this.writeFile(f, ''); return R(''); },
  mkdir(args) {
    this.h.dirs = this.h.dirs || new Set();
    for (const d of args.filter((a) => !a.startsWith('-'))) { const a = this.abs(d); if (this.stat(a) !== 'dir') this.h.dirs.add(a); }
    return R('');
  },
  rm(args) {
    const rec = args.some((a) => /^-\w*r/.test(a));
    const errs = [];
    for (const f of args.filter((a) => !a.startsWith('-'))) {
      const a = this.abs(f);
      if (this.h.files[a] !== undefined) delete this.h.files[a];
      else if (rec && this.stat(a) === 'dir') { for (const k of Object.keys(this.h.files)) if (k.startsWith(a + '/')) delete this.h.files[k]; if (this.h.dirs) this.h.dirs.delete(a); }
      else if (!args.some((x) => /^-\w*f/.test(x))) errs.push(`rm: cannot remove '${f}': No such file or directory`);
    }
    return R('', errs.join('\n'));
  },
  cp(args) {
    const [s, d] = args.filter((a) => !a.startsWith('-'));
    const t = this.readFile(s);
    if (t === null) return R('', `cp: cannot stat '${s}': No such file or directory`);
    this.writeFile(this.stat(d) === 'dir' ? `${this.abs(d)}/${s.split('/').pop()}` : d, t);
    return R('');
  },
  mv(args) {
    const [s, d] = args.filter((a) => !a.startsWith('-'));
    const t = this.readFile(s);
    if (t === null) return R('', `mv: cannot stat '${s}': No such file or directory`);
    const dst = this.stat(d) === 'dir' ? `${this.abs(d)}/${s.split('/').pop()}` : d;
    delete this.h.files[this.abs(s)];
    this.writeFile(dst, t);
    this.c.reconcile();
    return R('');
  },
  vi(args) { return openEditor.call(this, args); }, vim(args) { return openEditor.call(this, args); }, nano(args) { return openEditor.call(this, args); },
  clear() { return { out: '', err: '', clear: true }; },
  history() { return R(this.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n')); },
  hostname() { return R(this.host); },
  whoami() { return R('root'); },
  date() { return R(new Date(this.c.now() * 1000).toUTCString().replace('GMT', 'UTC')); },
  sleep(args) { this.c.tick(Math.min(600, parseFloat(args[0]) || 1)); this.c.reconcile(); return R(''); },
  true() { return R(''); }, false() { return R('', '', 1); },
  which(args) { return BUILTINS[args[0]] ? R(`/usr/bin/${args[0]}`) : R('', '', 1); },
  watch(args) { const i = args.findIndex((a) => !a.startsWith('-') && !/^\d+$/.test(a)); return this.exec(args.slice(i).join(' ')); },
  help() { return R(SHELL_HELP); },
  ssh(args) {
    const target = args.filter((a) => !a.startsWith('-')).pop();
    const host = target && target.replace(/^.*@/, '');
    if (!this.c.hosts[host]) return R('', `ssh: Could not resolve hostname ${host}: Name or service not known`, 255);
    if (host === this.host) return R('');
    this.hostStack.push({ host: this.host, cwd: this.cwd });
    this.host = host; this.cwd = '/root';
    return R(`Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-79-generic x86_64)\nLast login: Tue Sep  1 09:00:00 2026 from 172.30.1.2`);
  },
  exit() {
    const prev = this.hostStack.pop();
    if (!prev) return R('(이미 첫 셸입니다)');
    const from = this.host;
    this.host = prev.host; this.cwd = prev.cwd;
    return R(`logout\nConnection to ${from} closed.`);
  },
  logout() { return BUILTINS.exit.call(this); },
  systemctl(args) { return systemctl.call(this, args); },
  service(args) { return systemctl.call(this, [args[1], args[0]]); },
  journalctl(args) { return journalctl.call(this, args); },
  crictl(args) { return crictl.call(this, args); },
  etcdctl(args, _s, env) { return etcd.call(this, args, env, 'etcdctl'); },
  etcdutl(args, _s, env) { return etcd.call(this, args, env, 'etcdutl'); },
  kubeadm(args) { return kubeadm.call(this, args); },
  'apt-get'(args) { return apt.call(this, args); }, apt(args) { return apt.call(this, args); },
  'apt-mark'(args) { return aptMark.call(this, args); },
  'apt-cache'(args) { return aptCache.call(this, args); },
  helm(args) { return helm.call(this, args); },
  kubelet(args) { if (args.includes('--version')) return R(`Kubernetes ${this.h.pkgs.kubelet}`); return R('', 'kubelet 은 systemd 서비스로 돕니다 — systemctl status kubelet'); },
  ps() { return R(['UID          PID    PPID  C STIME TTY          TIME CMD', ...(this.kubeletOk() ? ['root         812       1  2 09:00 ?        00:01:10 /usr/bin/kubelet --kubeconfig=/etc/kubernetes/kubelet.conf --config=/var/lib/kubelet/config.yaml'] : []), 'root         640       1  0 09:00 ?        00:00:30 /usr/bin/containerd'].join('\n')); },
  swapoff() { return R(''); }, modprobe() { return R(''); },
  sysctl(args) { return R(args.includes('--system') ? '* Applying /etc/sysctl.d/k8s.conf ...\nnet.ipv4.ip_forward = 1' : 'net.ipv4.ip_forward = 1'); },
  free() { return R('               total        used        free      shared  buff/cache   available\nMem:            3.9Gi       1.2Gi       1.1Gi       3.0Mi       1.7Gi       2.7Gi\nSwap:              0B          0B          0B'); },
  df() { return R('Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        39G   12G   27G  31% /'); },
  curl() { return R('', '이 터미널은 노드 셸입니다. 클러스터 안 통신은 kubectl exec 나 임시 파드(kubectl run tmp --rm -it --image=busybox --restart=Never -- wget -qO- -T2 서비스:포트)로 확인하세요.'); },
  wget() { return BUILTINS.curl.call(this); },
  nslookup() { return BUILTINS.curl.call(this); },
};

function headTail(args, stdin, head) {
  let n = 10;
  const files = [];
  for (let i = 0; i < args.length; i++) { if (args[i] === '-n') n = Number(args[++i]); else if (/^-\d+$/.test(args[i])) n = Number(args[i].slice(1)); else if (!args[i].startsWith('-')) files.push(args[i]); }
  const t = files.length ? this.readFile(files[0]) : stdin || '';
  if (t === null) return R('', `${head ? 'head' : 'tail'}: cannot open '${files[0]}' for reading: No such file or directory`);
  const lines = t.replace(/\n$/, '').split('\n');
  return R((head ? lines.slice(0, n) : lines.slice(-n)).join('\n'));
}

function openEditor(args) {
  const f = args.filter((a) => !a.startsWith('-') && !a.startsWith('+'))[0];
  if (!f) return R('', '파일 이름을 주세요: vi 파일.yaml');
  const path = this.abs(f);
  if (this.stat(path) === 'dir') return R('', `"${f}" is a directory`);
  const cur = this.readFile(path);
  return {
    out: '', err: '',
    edit: {
      path, content: cur ?? '', isNew: cur === null,
      save: (text) => {
        this.writeFile(path, text.endsWith('\n') ? text : text + '\n');
        this.c.reconcile();
        return R(`"${f}" ${text.split('\n').length}L, ${text.length}B written`);
      },
    },
  };
}

// ── systemd ──
function systemctl(args) {
  const words = args.filter((a) => !a.startsWith('-'));
  const act = words[0];
  const unit = (words[1] || '').replace(/\.service$/, '');
  const h = this.h;
  if (act === 'daemon-reload') { h.reloadedDropin = h.files[DROPIN_PATH]; return R(''); }
  const svc = h.services[unit];
  if (!svc) return R('', `Unit ${unit}.service could not be found.`, 4);
  const changed = unit === 'kubelet' && h.files[DROPIN_PATH] !== h.reloadedDropin;
  const warn = changed && ['start', 'restart', 'status'].includes(act) ? `Warning: The unit file, source configuration file or drop-ins of kubelet.service changed on disk. Run 'systemctl daemon-reload' to reload units.` : '';
  const up = () => { svc.active = true; if (unit === 'kubelet') h.kubeletRunning = h.pkgs.kubelet; };
  const done = (msg = '') => { this.c.reconcile(); return R(msg, warn); };
  switch (act) {
    case 'start': case 'restart': up(); return done();
    case 'stop': svc.active = false; return done();
    case 'enable': svc.enabled = true; if (args.includes('--now')) up(); return done(`Created symlink /etc/systemd/system/multi-user.target.wants/${unit}.service → /usr/lib/systemd/system/${unit}.service.`);
    case 'disable': svc.enabled = false; if (args.includes('--now')) svc.active = false; return done(`Removed "/etc/systemd/system/multi-user.target.wants/${unit}.service".`);
    case 'is-active': { const ok = svc.active && (unit !== 'kubelet' || this.kubeletOk()); return R(ok ? 'active' : svc.active ? 'activating' : 'inactive', '', ok ? 0 : 3); }
    case 'is-enabled': return R(svc.enabled ? 'enabled' : 'disabled', '', svc.enabled ? 0 : 1);
    case 'status': {
      const k = unit === 'kubelet' ? this.c.kubeletState(this.host) : { ok: true };
      let state; const lines = [];
      if (!svc.active) state = 'inactive (dead) since Tue 2026-09-01 08:40:12 UTC; 20min ago';
      else if (!k.ok) {
        state = 'activating (auto-restart) (Result: exit-code) since Tue 2026-09-01 09:00:05 UTC; 3s ago';
        if (k.reason === 'exec') lines.push(`    Process: 2211 ExecStart=${k.path} $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS (code=exited, status=203/EXEC)`, '   Main PID: 2211 (code=exited, status=203/EXEC)');
        else lines.push('    Process: 2211 ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS (code=exited, status=1/FAILURE)', '   Main PID: 2211 (code=exited, status=1/FAILURE)');
      } else { state = 'active (running) since Tue 2026-09-01 09:00:00 UTC; 2h ago'; lines.push(`   Main PID: 812 (${unit})`, '      Tasks: 12 (limit: 4598)', '     Memory: 46.2M', `     CGroup: /system.slice/${unit}.service`, `             └─812 /usr/bin/${unit}`); }
      const drop = unit === 'kubelet' ? '\n    Drop-In: /usr/lib/systemd/system/kubelet.service.d\n             └─10-kubeadm.conf' : '';
      const ok = svc.active && k.ok;
      return R(`${ok ? '●' : '○'} ${unit}.service - ${unit === 'kubelet' ? 'kubelet: The Kubernetes Node Agent' : 'containerd container runtime'}\n     Loaded: loaded (/usr/lib/systemd/system/${unit}.service; ${svc.enabled ? 'enabled' : 'disabled'}; preset: enabled)${drop}\n     Active: ${state}\n       Docs: https://kubernetes.io/docs/\n${lines.join('\n')}`, warn, ok ? 0 : 3);
    }
  }
  return R('', `Unknown command verb ${act}.`);
}
function journalctl(args) {
  const i = args.indexOf('-u');
  const unit = (i >= 0 ? args[i + 1] || '' : (args.find((a) => a.startsWith('--unit=')) || '').slice(7)).replace(/\.service$/, '');
  if (unit !== 'kubelet') return R('-- No entries --');
  const k = this.c.kubeletState(this.host);
  const svc = this.h.services.kubelet;
  const H = this.host;
  const L = [`Sep 01 08:30:01 ${H} systemd[1]: Started kubelet.service - kubelet: The Kubernetes Node Agent.`, `Sep 01 08:30:02 ${H} kubelet[812]: I0901 08:30:02 server.go:530] "Kubelet version" kubeletVersion="${this.h.kubeletRunning}"`];
  if (!svc.active) L.push(`Sep 01 08:40:12 ${H} systemd[1]: Stopping kubelet.service - kubelet: The Kubernetes Node Agent...`, `Sep 01 08:40:12 ${H} systemd[1]: kubelet.service: Deactivated successfully.`, `Sep 01 08:40:12 ${H} systemd[1]: Stopped kubelet.service - kubelet: The Kubernetes Node Agent.`);
  else if (k.reason === 'exec') L.push(`Sep 01 09:00:05 ${H} (${k.path.split('/').pop()})[2211]: kubelet.service: Unable to locate executable '${k.path}': No such file or directory`, `Sep 01 09:00:05 ${H} (${k.path.split('/').pop()})[2211]: kubelet.service: Failed at step EXEC spawning ${k.path}: No such file or directory`, `Sep 01 09:00:05 ${H} systemd[1]: kubelet.service: Main process exited, code=exited, status=203/EXEC`, `Sep 01 09:00:05 ${H} systemd[1]: kubelet.service: Failed with result 'exit-code'.`);
  else if (k.reason === 'ca') L.push(`Sep 01 09:00:05 ${H} kubelet[2211]: E0901 09:00:05 run.go:72] "command failed" err="failed to construct kubelet dependencies: unable to load client CA file ${k.path}: open ${k.path}: no such file or directory"`, `Sep 01 09:00:05 ${H} systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE`);
  else if (k.reason === 'config') L.push(`Sep 01 09:00:05 ${H} kubelet[2211]: E0901 09:00:05 run.go:72] "command failed" err="failed to load kubelet config file, path: /var/lib/kubelet/config.yaml, error: ${k.err}"`, `Sep 01 09:00:05 ${H} systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE`);
  else L.push(`Sep 01 09:00:10 ${H} kubelet[812]: I0901 09:00:10 kubelet_node_status.go:75] "Successfully registered node" node="${H}"`);
  const n = args.indexOf('-n');
  return R((n >= 0 ? L.slice(-Number(args[n + 1])) : L).join('\n'));
}
function crictl(args) {
  const sub = args[0];
  const pods = this.c.list('Pod').filter((p) => p.spec.nodeName === this.host);
  const id = (name, ct) => { let h = 0; for (const ch of name + ct) h = (h * 131 + ch.charCodeAt(0)) >>> 0; return h.toString(16).padStart(8, '0') + 'a3f19c0'; };
  const rows = [];
  for (const p of pods) for (const ct of p.spec.containers) {
    const st = ((p.status || {}).containerStatuses || []).find((x) => x.name === ct.name) || {};
    rows.push({ p, ct, id: id(p.metadata.name, ct.name), running: !!(st.state && st.state.running), attempt: st.restartCount || 0 });
  }
  // 망가진 static pod 은 kubectl 에 안 보여도 crictl 에는 Exited 로 남는다
  if (this.host === 'controlplane') {
    for (const comp of ['kube-apiserver', 'kube-scheduler', 'kube-controller-manager', 'etcd']) {
      const hh = this.c.componentHealth(comp);
      if (!hh.ok && !hh.missing && !rows.some((r) => r.ct.name === comp)) rows.push({ p: { metadata: { name: `${comp}-controlplane`, namespace: 'kube-system' } }, ct: { name: comp, image: 'registry.k8s.io/' + comp }, id: id(comp, comp), running: false, attempt: 6, health: hh });
      else { const r = rows.find((x) => x.ct.name === comp); if (r && !hh.ok) r.health = hh; }
    }
  }
  if (sub === 'ps') {
    const all = args.includes('-a');
    let list = rows.filter((r) => all || r.running);
    const nameF = args.indexOf('--name');
    if (nameF >= 0) list = list.filter((r) => r.ct.name.includes(args[nameF + 1]));
    if (args.includes('-q')) return R(list.map((r) => r.id.slice(0, 13)).join('\n'));
    return R(table(['CONTAINER', 'IMAGE', 'CREATED', 'STATE', 'NAME', 'ATTEMPT', 'POD ID', 'POD', 'NAMESPACE'], list.map((r) => [r.id.slice(0, 13), (r.ct.image || '').split('/').pop().slice(0, 20), r.running ? '2 hours ago' : '12 seconds ago', r.running ? 'Running' : 'Exited', r.ct.name, r.attempt, r.id.slice(3, 16), r.p.metadata.name, r.p.metadata.namespace])) || 'CONTAINER           IMAGE               CREATED             STATE               NAME                ATTEMPT             POD ID              POD');
  }
  if (sub === 'pods') return R(table(['POD ID', 'CREATED', 'STATE', 'NAME', 'NAMESPACE', 'ATTEMPT', 'RUNTIME'], [...new Map(rows.map((r) => [r.p.metadata.name, r])).values()].map((r) => [r.id.slice(3, 16), '2 hours ago', 'Ready', r.p.metadata.name, r.p.metadata.namespace, 0, '(default)'])));
  if (sub === 'logs') {
    const cid = args.filter((a) => !a.startsWith('-'))[1] || '';
    const r = rows.find((x) => cid && x.id.startsWith(cid));
    if (!r) return R('', `E0901 09:00:00 remote_runtime.go:432] "ContainerStatus from runtime service failed" err="rpc error: code = NotFound desc = an error occurred when try to find container \\"${cid}\\": not found"`);
    if (r.health) return R((r.health.log || []).join('\n'));
    return R((this.c.evalContainer(r.ct, r.p.spec, r.p.metadata.namespace, r.p.metadata.name).logs || []).join('\n'));
  }
  if (sub === 'images') return R(table(['IMAGE', 'TAG', 'IMAGE ID', 'SIZE'], [...new Set(rows.map((r) => r.ct.image))].map((im) => [im.split(':')[0], im.split(':')[1] || 'latest', '3b1f2c9d4e5a6', '52.1MB'])));
  if (sub === 'info' || sub === 'version') return R('Version:  0.1.0\nRuntimeName:  containerd\nRuntimeVersion:  v2.1.4\nRuntimeApiVersion:  v1');
  return R('', `crictl: '${sub}' 는 이 시뮬레이터에서 지원하지 않습니다 (ps, ps -a, pods, logs, images).`);
}

// ── etcd ──
function etcdFlags(args) {
  const f = {}, pos = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) { const eq = a.indexOf('='); if (eq > 0) f[a.slice(2, eq)] = a.slice(eq + 1); else if (i + 1 < args.length && !args[i + 1].startsWith('--')) f[a.slice(2)] = args[++i]; else f[a.slice(2)] = 'true'; }
    else if (a === '-w') f['write-out'] = args[++i];
    else pos.push(a);
  }
  return { f, pos };
}
function etcd(args, env, bin) {
  const { f, pos } = etcdFlags(args);
  const c = this.c;
  if (pos[0] === 'version' || f.version) return R(`${bin} version: 3.6.4\nAPI version: 3.6`);
  const g = (k, e) => f[k] || env[e] || this.env[e];
  const needTLS = () => {
    if (this.host !== 'controlplane') return 'Error: context deadline exceeded (etcd 는 controlplane 노드에서 돕니다 — ssh controlplane)';
    const ca = g('cacert', 'ETCDCTL_CACERT'), cert = g('cert', 'ETCDCTL_CERT'), key = g('key', 'ETCDCTL_KEY');
    const ep = g('endpoints', 'ETCDCTL_ENDPOINTS') || '127.0.0.1:2379';
    if (!/^(https:\/\/)?(127\.0\.0\.1|localhost|172\.30\.1\.2):2379$/.test(ep)) return `{"level":"warn","msg":"retrying of unary invoker failed","error":"rpc error: code = DeadlineExceeded desc = latest balancer error: last connection error: connection error: desc = \\"transport: Error while dialing: dial tcp ${ep.replace('https://', '')}: connect: connection refused\\""}\nError: context deadline exceeded`;
    if (!ca || !cert || !key) return '{"level":"warn","msg":"retrying of unary invoker failed","error":"rpc error: code = DeadlineExceeded desc = context deadline exceeded"}\nError: context deadline exceeded';
    for (const p of [ca, cert, key]) if (this.readFile(p) === null) return `Error: open ${p}: no such file or directory`;
    if (!/etcd\/ca\.crt$/.test(ca)) return 'Error: context deadline exceeded (tls: failed to verify certificate: x509: certificate signed by unknown authority)';
    if (cert.replace(/\.crt$/, '') !== key.replace(/\.key$/, '')) return 'Error: tls: private key does not match public key';
    if (!/(etcd\/(server|peer|healthcheck-client)|apiserver-etcd-client)$/.test(cert.replace(/\.crt$/, ''))) return 'Error: context deadline exceeded (remote error: tls: bad certificate)';
    if (!c.componentHealth('etcd').ok) return 'Error: context deadline exceeded';
    return null;
  };
  if (pos[0] === 'snapshot') {
    const sub = pos[1], path = pos[2];
    if (sub === 'save') {
      if (bin === 'etcdutl') return R('', 'Error: unknown command "save" for "etcdutl snapshot" — 저장은 etcdctl(서버에 접속), 상태·복구는 etcdutl(파일만 다룸)입니다.');
      if (!path) return R('', 'Error: snapshot save expects one argument');
      const e = needTLS(); if (e) return R('', e, 1);
      const p = this.abs(path);
      const dir = p.slice(0, p.lastIndexOf('/')) || '/';
      if (this.stat(dir) !== 'dir' && !['/var/lib', '/srv'].includes(dir)) return R('', `Error: could not open ${p}.part (open ${p}.part: no such file or directory)`, 1);
      c.etcd.snapshots[p] = c.snapshotData();
      this.writeFile(p, `ETCD-SNAPSHOT(simulated) keys=${c.objs.size}\n`);
      return R(`{"level":"info","ts":"2026-09-01T09:00:00Z","caller":"snapshot/v3_snapshot.go:65","msg":"created temporary db file","path":"${p}.part"}\n{"level":"info","ts":"2026-09-01T09:00:00Z","caller":"snapshot/v3_snapshot.go:97","msg":"fetched snapshot","endpoint":"https://127.0.0.1:2379","size":"6.1 MB"}\n{"level":"info","ts":"2026-09-01T09:00:00Z","caller":"snapshot/v3_snapshot.go:106","msg":"saved","path":"${p}"}\nSnapshot saved at ${path}`);
    }
    if (sub === 'status') {
      const s = c.etcd.snapshots[this.abs(path || '')];
      if (!s) return R('', `Error: stat ${path}: no such file or directory`, 1);
      const warn = bin === 'etcdctl' ? 'Deprecated: Use `etcdutl snapshot status` instead.\n\n' : '';
      if ((f['write-out'] || '') === 'table') return R(warn + `+----------+----------+------------+------------+\n|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |\n+----------+----------+------------+------------+\n| 7a1f3c2e | ${String(4000 + s.objs.length * 7).padStart(8)} | ${String(s.objs.length).padStart(10)} |     6.1 MB |\n+----------+----------+------------+------------+`);
      return R(warn + `7a1f3c2e, ${4000 + s.objs.length * 7}, ${s.objs.length}, 6.1 MB`);
    }
    if (sub === 'restore') {
      const p = this.abs(path || '');
      const s = c.etcd.snapshots[p];
      if (!s) return R('', `Error: stat ${path}: no such file or directory`, 1);
      const dd = this.abs(f['data-dir'] || `${this.cwd}/default.etcd`);
      if (this.stat(dd) === 'dir' || c.etcd.dataDirs[dd]) return R('', `Error: data-dir "${dd}" not empty or could not be read`, 1);
      c.etcd.dataDirs[dd] = clone(s);
      this.h.files[`${dd}/member/snap/db`] = '(restored)';
      const warn = bin === 'etcdctl' ? 'Deprecated: Use `etcdutl snapshot restore` instead.\n\n' : '';
      return R(`${warn}2026-09-01T09:00:00Z\tinfo\tsnapshot/v3_snapshot.go:265\trestoring snapshot\t{"path": "${p}", "data-dir": "${dd}"}\n2026-09-01T09:00:00Z\tinfo\tsnapshot/v3_snapshot.go:293\trestored snapshot\t{"path": "${p}", "data-dir": "${dd}"}`);
    }
  }
  if (pos[0] === 'member' && pos[1] === 'list') { const e = needTLS(); if (e) return R('', e, 1); return R('c3b8e4d59e7a1f02, started, controlplane, https://172.30.1.2:2380, https://172.30.1.2:2379, false'); }
  if (pos[0] === 'endpoint') { const e = needTLS(); if (e) return R('', e, 1); return R(pos[1] === 'health' ? 'https://127.0.0.1:2379 is healthy: successfully committed proposal: took = 9.8ms' : 'https://127.0.0.1:2379, c3b8e4d59e7a1f02, 3.6.4, 6.1 MB, true, false, 4, 5210, 5210,'); }
  return R('', `Error: unknown command "${pos.join(' ')}" for "${bin}"`);
}

// ── kubeadm · apt ──
function repoMinor(h) { const m = (h.files['/etc/apt/sources.list.d/kubernetes.list'] || '').match(/stable:\/(v\d+\.\d+)\//); return m ? m[1] : null; }
function repoVersions(h) {
  const m = repoMinor(h);
  if (!m) return [];
  const top = { 35: 2, 36: 1 }[Number(m.split('.')[1])] ?? 3;
  return Array.from({ length: top + 1 }, (_, i) => `${m.slice(1)}.${i}-1.1`);
}
const vnum = (v) => v.replace(/^v/, '').split(/[.-]/).slice(0, 3).map(Number);
const vcmp = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
export function serverVersion(c) { return ((c.componentHealth('kube-apiserver').container) || { image: ':' + K8S_VERSION }).image.split(':').pop(); }
function kubeadm(args) {
  const c = this.c, h = this.h;
  const sub = args[0];
  if (sub === 'version') { const v = h.pkgs.kubeadm; const [ma, mi] = v.slice(1).split('.'); return R(`kubeadm version: &version.Info{Major:"${ma}", Minor:"${mi}", GitVersion:"${v}", GitTreeState:"clean", GoVersion:"go1.24.6", Compiler:"gc", Platform:"linux/amd64"}`); }
  if (sub === 'upgrade') {
    const what = args[1];
    const cur = serverVersion(c);
    if (what === 'plan') {
      if (h.role !== 'controlplane') return R('', 'error: 컨트롤 플레인 노드에서 실행하세요 (ssh controlplane)');
      const target = vcmp(h.pkgs.kubeadm, cur) > 0 ? h.pkgs.kubeadm : cur;
      return R(`[preflight] Running pre-flight checks.\n[upgrade/config] Reading configuration from the "kubeadm-config" ConfigMap in namespace "kube-system"...\n[upgrade] Running cluster health checks\n[upgrade] Fetching available versions to upgrade to\n[upgrade/versions] Cluster version: ${cur}\n[upgrade/versions] kubeadm version: ${h.pkgs.kubeadm}\n\nComponents that must be upgraded manually after you have upgraded the control plane with 'kubeadm upgrade apply':\nCOMPONENT   NODE           CURRENT   TARGET\nkubelet     controlplane   ${c.hosts.controlplane.kubeletRunning}   ${target}\nkubelet     node01         ${c.hosts.node01.kubeletRunning}   ${target}\nkubelet     node02         ${c.hosts.node02.kubeletRunning}   ${target}\n\nUpgrade to the latest version in the ${target.split('.').slice(0, 2).join('.')} series:\n\nCOMPONENT                 NODE           CURRENT   TARGET\nkube-apiserver            controlplane   ${cur}   ${target}\nkube-controller-manager   controlplane   ${cur}   ${target}\nkube-scheduler            controlplane   ${cur}   ${target}\nkube-proxy                               ${cur}   ${target}\nCoreDNS                                  v1.12.1   v1.12.1\netcd                      controlplane   3.6.4-0   3.6.4-0\n\nYou can now apply the upgrade by executing the following command:\n\n\tkubeadm upgrade apply ${target}\n\n_____________________________________________________________________`);
    }
    if (what === 'apply') {
      if (h.role !== 'controlplane') return R('', 'error: 컨트롤 플레인 노드에서 실행하세요. 워커 노드는 kubeadm upgrade node 입니다.');
      const target = args.find((a) => /^v\d/.test(a));
      if (!target) return R('', 'error: missing version argument');
      if (vcmp(target, h.pkgs.kubeadm) > 0) return R('', `[upgrade/version] FATAL: the --version argument is invalid due to these errors:\n\n\t- Specified version to upgrade to "${target}" is higher than the kubeadm version "${h.pkgs.kubeadm}". Upgrade kubeadm first using the tool you used to install kubeadm\n\nCan be bypassed if you pass the --force flag`, 1);
      if (vnum(target)[1] - vnum(cur)[1] > 1) return R('', `[upgrade/version] FATAL: Specified version to upgrade to "${target}" is too high; kubeadm can upgrade only 1 minor version at a time`, 1);
      for (const comp of ['kube-apiserver', 'kube-controller-manager', 'kube-scheduler']) {
        const p = `/etc/kubernetes/manifests/${comp}.yaml`;
        h.files[p] = (h.files[p] || '').replace(new RegExp(`(registry\\.k8s\\.io/${comp}:)v[\\d.]+`), `$1${target}`);
      }
      const kp = c.get('DaemonSet', 'kube-system', 'kube-proxy');
      if (kp) kp.spec.template.spec.containers[0].image = `registry.k8s.io/kube-proxy:${target}`;
      c.reconcile();
      return R(`[upgrade] Reading configuration from the "kubeadm-config" ConfigMap in namespace "kube-system"...\n[preflight] Running pre-flight checks.\n[upgrade/version] You have chosen to upgrade to version "${target}"\n[upgrade/versions] Cluster version: ${cur}\n[upgrade/versions] kubeadm version: ${h.pkgs.kubeadm}\n[upgrade/staticpods] Component "kube-apiserver" upgraded successfully!\n[upgrade/staticpods] Component "kube-controller-manager" upgraded successfully!\n[upgrade/staticpods] Component "kube-scheduler" upgraded successfully!\n[upgrade/addons] Applied essential addon: CoreDNS\n[upgrade/addons] Applied essential addon: kube-proxy\n\n[upgrade] SUCCESS! A control plane node of your cluster was upgraded to "${target}".\n\n[upgrade] Now please proceed with upgrading the rest of the nodes by following the right order.`);
    }
    if (what === 'node') {
      if (h.role === 'worker' && vcmp(h.pkgs.kubeadm, cur) < 0) return R('', `error: kubeadm ${h.pkgs.kubeadm} 이 컨트롤 플레인(${cur})보다 낮습니다 — 먼저 kubeadm 패키지를 올리세요.`);
      c.upgradedNodes.add(this.host);
      return R('[upgrade] Reading configuration from the "kubeadm-config" ConfigMap in namespace "kube-system"...\n[preflight] Running pre-flight checks\n[preflight] Skipping prepull. Not a control plane node.\n[upgrade] Skipping phase. Not a control plane node.\n[upgrade/kubelet-config] The kubelet configuration for this node was successfully upgraded!');
    }
  }
  if (sub === 'token' && args[1] === 'create') return R('kubeadm join 172.30.1.2:6443 --token 8z4q1m.wd2lkyh6v5r7s0cx --discovery-token-ca-cert-hash sha256:5c1f2d73c0a6c8b1e4e8f5a0d9e7b3a2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8');
  if (sub === 'certs' && args[1] === 'check-expiration') return R('CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED\nadmin.conf                 Aug 20, 2027 09:00 UTC   353d            ca                      no\napiserver                  Aug 20, 2027 09:00 UTC   353d            ca                      no\napiserver-etcd-client      Aug 20, 2027 09:00 UTC   353d            etcd-ca                 no\napiserver-kubelet-client   Aug 20, 2027 09:00 UTC   353d            ca                      no\ncontroller-manager.conf    Aug 20, 2027 09:00 UTC   353d            ca                      no\netcd-server                Aug 20, 2027 09:00 UTC   353d            etcd-ca                 no\nscheduler.conf             Aug 20, 2027 09:00 UTC   353d            ca                      no\n\nCERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED\nca                      Aug 18, 2036 09:00 UTC   9y              no\netcd-ca                 Aug 18, 2036 09:00 UTC   9y              no');
  if (sub === 'certs' && args[1] === 'renew') return R(`certificate ${args[2] || ''} renewed\n\nDone renewing certificates. You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd, so that they can use the new certificates.`);
  if (['init', 'join', 'reset'].includes(sub)) return R('', `kubeadm ${sub}: 이 실습 클러스터는 이미 구성돼 있습니다. 설치 절차는 '실습환경 만들기' 강의대로 가상머신에서 직접 해 보세요.`);
  return R('', `error: unknown command "${sub}" for "kubeadm"`);
}
function apt(args) {
  const h = this.h;
  const sub = args.find((a) => !a.startsWith('-'));
  if (sub === 'update') { h.aptUpdated = true; return R(`Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nGet:2 https://prod-cdn.packages.k8s.io/repositories/isv:/kubernetes:/core:/stable:/${repoMinor(h)}/deb  InRelease [1,186 B]\nReading package lists... Done`); }
  if (sub === 'install' || sub === 'upgrade') {
    const pk = args.filter((a) => !a.startsWith('-') && a !== sub);
    const allow = args.includes('--allow-change-held-packages');
    const out = ['Reading package lists... Done', 'Building dependency tree... Done'];
    for (const spec of pk) {
      const [name, ver] = spec.replace(/['"]/g, '').split('=');
      if (!['kubeadm', 'kubelet', 'kubectl'].includes(name)) { out.push(`${name} is already the newest version.`); continue; }
      if (!ver) return R(out.join('\n'), `E: 버전을 지정하세요 — 예: apt-get install -y ${name}='${repoVersions(h).slice(-1)[0] || '1.36.1-1.1'}' (버전 없이 설치하면 원치 않는 판이 깔린다)`, 100);
      if (!h.aptUpdated || !repoVersions(h).includes(ver)) return R(out.join('\n'), `E: Version '${ver}' for '${name}' was not found${h.aptUpdated ? '' : ' (apt-get update 를 먼저 했나요?)'}`, 100);
      if (h.held.has(name) && !allow) return R(out.join('\n'), 'E: Held packages were changed and -y was used without --allow-change-held-packages.', 100);
      h.pkgs[name] = 'v' + ver.split('-')[0];
      out.push(`Setting up ${name} (${ver}) ...`);
    }
    return R(out.join('\n'));
  }
  return R('', `E: Invalid operation ${sub}`, 100);
}
function aptMark(args) {
  const [sub, ...pk] = args;
  if (sub === 'showhold') return R([...this.h.held].join('\n'));
  for (const p of pk) { if (sub === 'hold') this.h.held.add(p); else if (sub === 'unhold') this.h.held.delete(p); }
  return R(pk.map((p) => (sub === 'hold' ? `${p} set on hold.` : `Canceled hold on ${p}.`)).join('\n'));
}
function aptCache(args) {
  const [sub, name] = args;
  const vs = this.h.aptUpdated ? repoVersions(this.h) : repoVersions(this.h).slice(0, 1);
  if (sub === 'madison') return R(vs.slice().reverse().map((v) => `   ${name} | ${v} | https://pkgs.k8s.io/core:/stable:/${repoMinor(this.h)}/deb  Packages`).join('\n'));
  if (sub === 'policy') return R(`${name}:\n  Installed: ${this.h.pkgs[name].slice(1)}-1.1\n  Candidate: ${vs.slice(-1)[0]}`);
  return R('', `E: Invalid operation ${sub}`);
}

// ── helm ──
export const CHARTS = {
  'bitnami/nginx': { url: 'https://charts.bitnami.com/bitnami', version: '21.1.2', app: '1.29.1', image: 'bitnami/nginx:1.29.1', port: 8080, svcType: 'LoadBalancer' },
  'ingress-nginx/ingress-nginx': { url: 'https://kubernetes.github.io/ingress-nginx', version: '4.13.1', app: '1.13.1', image: 'registry.k8s.io/ingress-nginx/controller:v1.13.1', port: 80, svcType: 'LoadBalancer', name: 'controller' },
  'argo/argo-cd': { url: 'https://argoproj.github.io/argo-helm', version: '8.3.0', app: 'v3.1.1', image: 'quay.io/argoproj/argocd:v3.1.1', port: 8080, svcType: 'ClusterIP', name: 'server', relOnly: true, crds: [['applications.argoproj.io', 'Application'], ['applicationsets.argoproj.io', 'ApplicationSet'], ['appprojects.argoproj.io', 'AppProject']] },
  'metrics-server/metrics-server': { url: 'https://kubernetes-sigs.github.io/metrics-server/', version: '3.13.0', app: '0.8.0', image: 'registry.k8s.io/metrics-server/metrics-server:v0.8.0', port: 10250, svcType: 'ClusterIP' },
  'podinfo/podinfo': { url: 'https://stefanprodan.github.io/podinfo', version: '6.9.1', app: '6.9.1', image: 'nginx:1.27', port: 80, svcType: 'ClusterIP' },
};
function setPath(o, path, v) { const ks = path.split('.'); let cur = o; for (const k of ks.slice(0, -1)) cur = cur[k] = cur[k] || {}; cur[ks[ks.length - 1]] = /^\d+$/.test(v) ? Number(v) : v === 'true' ? true : v === 'false' ? false : v; }
function renderChart(rel, ref, vals, ns) {
  const ch = CHARTS[ref];
  const cname = ref.split('/')[1];
  // 차트마다 이름 규칙이 다르다 — argo-cd 는 릴리스 이름만 쓴다(argocd-server), 보통은 <릴리스>-<차트>
  const full = ch.relOnly || rel.includes(cname) ? rel : `${rel}-${cname}`;
  const name = ch.name ? `${full}-${ch.name}` : full;
  const labels = { 'app.kubernetes.io/instance': rel, 'app.kubernetes.io/name': cname };
  const meta = (n) => ({ name: n, namespace: ns, labels: { ...labels, 'app.kubernetes.io/managed-by': 'Helm', 'helm.sh/chart': `${cname}-${ch.version}` }, annotations: { 'meta.helm.sh/release-name': rel, 'meta.helm.sh/release-namespace': ns } });
  const docs = [];
  if (ch.crds && !(vals.crds && vals.crds.install === false)) for (const [crd, kind] of ch.crds) docs.push({ apiVersion: 'apiextensions.k8s.io/v1', kind: 'CustomResourceDefinition', metadata: { name: crd, labels: { 'app.kubernetes.io/part-of': 'argocd' } }, spec: { group: 'argoproj.io', names: { kind, plural: crd.split('.')[0] }, scope: 'Namespaced', versions: [{ name: 'v1alpha1', served: true, storage: true }] } });
  docs.push({ apiVersion: 'v1', kind: 'ServiceAccount', metadata: meta(name) });
  docs.push({ apiVersion: 'apps/v1', kind: 'Deployment', metadata: meta(name), spec: { replicas: vals.replicaCount ?? 1, selector: { matchLabels: labels }, template: { metadata: { labels }, spec: { serviceAccountName: name, containers: [{ name: ch.name || cname, image: vals.image && vals.image.tag ? `${ch.image.split(':')[0]}:${vals.image.tag}` : ch.image, ports: [{ containerPort: ch.port, name: 'http' }] }] } } } });
  docs.push({ apiVersion: 'v1', kind: 'Service', metadata: meta(name), spec: { type: (vals.service && vals.service.type) || ch.svcType, selector: labels, ports: [{ name: 'http', port: (vals.service && vals.service.port) || 80, targetPort: 'http', protocol: 'TCP' }] } });
  return docs;
}
function helm(args) {
  const c = this.c, H = c.helm;
  const flags = {}, pos = [], sets = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--set' || a === '--set-string') { sets.push(args[++i]); continue; }
    if (a.startsWith('--set=')) { sets.push(a.slice(6)); continue; }
    if (a === '-n' || a === '--namespace') { flags.ns = args[++i]; continue; }
    if (a.startsWith('--namespace=')) { flags.ns = a.slice(12); continue; }
    if (a === '-f' || a === '--values') { flags.values = args[++i]; continue; }
    if (a === '--version') { flags.version = args[++i]; continue; }
    if (a.startsWith('--version=')) { flags.version = a.slice(10); continue; }
    if (a === '-A' || a === '--all-namespaces') { flags.all = true; continue; }
    if (a === '--create-namespace') { flags.createNs = true; continue; }
    if (a === '--skip-crds') { flags.skipCrds = true; continue; }
    if (a === '--install' || a === '-i') { flags.install = true; continue; }
    if (a === '--dry-run' || a.startsWith('--dry-run=')) { flags.dry = true; continue; }
    if (a.startsWith('-')) continue;
    pos.push(a);
  }
  const ns = flags.ns || c.ns;
  const sub = pos[0];
  const vals = {};
  if (flags.values) { const t = this.readFile(flags.values); if (t === null) return R('', `Error: open ${flags.values}: no such file or directory`); Object.assign(vals, yaml.load(t) || {}); }
  for (const s of sets) for (const kv of s.split(',')) { const i = kv.indexOf('='); setPath(vals, kv.slice(0, i), kv.slice(i + 1)); }
  const chartErr = (ref) => {
    const [repo, chart] = ref.split('/');
    if (!H.repos[repo]) return `repo ${repo} not found`;
    if (!CHARTS[ref]) return `chart "${chart}" not found in ${repo} index. (try 'helm repo update')`;
    if (flags.version && flags.version !== CHARTS[ref].version) return `chart "${chart}" matching ${flags.version} not found in ${repo} index. (try 'helm repo update')`;
    return null;
  };
  switch (sub) {
    case 'version': return R('version.BuildInfo{Version:"v3.18.6", GitCommit:"b76a950f", GitTreeState:"clean", GoVersion:"go1.24.6"}');
    case 'repo': {
      const act = pos[1];
      if (act === 'add') {
        const [name, url] = [pos[2], pos[3]];
        if (H.repos[name]) return R(`"${name}" already exists with the same configuration, skipping`);
        if (!Object.values(CHARTS).some((ch) => ch.url.replace(/\/$/, '') === (url || '').replace(/\/$/, ''))) return R('', `Error: looks like "${url}" is not a valid chart repository or cannot be reached: failed to fetch ${url}/index.yaml : 404 Not Found`);
        H.repos[name] = url;
        return R(`"${name}" has been added to your repositories`);
      }
      if (act === 'list' || act === 'ls') { const e = Object.entries(H.repos); if (!e.length) return R('', 'Error: no repositories to show'); return R(table(['NAME', 'URL'], e)); }
      if (act === 'update') return R(`Hang tight while we grab the latest from your chart repositories...\n${Object.keys(H.repos).map((r) => `...Successfully got an update from the "${r}" chart repository`).join('\n')}\nUpdate Complete. ⎈Happy Helming!⎈`);
      if (act === 'remove' || act === 'rm') { delete H.repos[pos[2]]; return R(`"${pos[2]}" has been removed from your repositories`); }
      return R('', 'Error: unknown command');
    }
    case 'search': {
      const q = pos[2] || '';
      const rows = Object.entries(CHARTS).filter(([k]) => H.repos[k.split('/')[0]] && k.includes(q)).map(([k, v]) => [k, v.version, v.app, '']);
      return rows.length ? R(table(['NAME', 'CHART VERSION', 'APP VERSION', 'DESCRIPTION'], rows)) : R('No results found');
    }
    case 'install': case 'upgrade': case 'template': {
      const rel = pos[1], ref = pos[2] || '';
      const e = chartErr(ref);
      if (e) return R('', `Error: ${sub === 'template' ? '' : sub === 'upgrade' ? 'UPGRADE FAILED: ' : 'INSTALLATION FAILED: '}${e}`);
      const docs = renderChart(rel, ref, vals, ns).filter((d) => !(flags.skipCrds && d.kind === 'CustomResourceDefinition'));
      if (sub === 'template') return R(docs.map((d) => `---\n# Source: ${ref.split('/')[1]}/templates/${d.kind.toLowerCase()}.yaml\n` + yaml.dump(d, { lineWidth: -1 })).join('').trimEnd());
      const existing = H.releases.find((r) => r.name === rel && r.ns === ns);
      if (sub === 'install' && existing) return R('', 'Error: INSTALLATION FAILED: cannot re-use a name that is still in use');
      if (sub === 'upgrade' && !existing && !flags.install) return R('', `Error: UPGRADE FAILED: "${rel}" has no deployed releases`);
      if (!c.get('Namespace', '', ns)) {
        if (!flags.createNs) return R('', `Error: INSTALLATION FAILED: create: failed to create: namespaces "${ns}" not found`);
        kubectl(['create', 'namespace', ns], this.io());
      }
      if (flags.dry) return R(`NAME: ${rel}\nNAMESPACE: ${ns}\nSTATUS: pending-install\nREVISION: 1\nMANIFEST:\n` + docs.map((d) => yaml.dump(d)).join('---\n'));
      for (const d of docs) {
        const r = c.resolve(d.kind);
        const cur = c.get(r.kind, r.ns ? ns : '', d.metadata.name);
        if (cur) c.remove(cur);
        this.writeFile('/tmp/.helm-render.yaml', yaml.dump(d));
        const res = kubectl(['apply', '-f', '/tmp/.helm-render.yaml', ...(r.ns ? ['-n', ns] : [])], this.io());
        if (res.err) return R('', `Error: INSTALLATION FAILED: ${res.err}`);
      }
      delete this.h.files['/tmp/.helm-render.yaml'];
      const rev = existing ? existing.rev + 1 : 1;
      if (existing) Object.assign(existing, { rev, vals, chart: ref, version: CHARTS[ref].version });
      else H.releases.push({ name: rel, ns, chart: ref, rev, vals, version: CHARTS[ref].version, app: CHARTS[ref].app });
      kubectl(['create', 'secret', 'generic', `sh.helm.release.v1.${rel}.v${rev}`, '-n', ns, '--from-literal=release=H4sIAAAAAAAC', '--type=helm.sh/release.v1'], this.io());
      c.reconcile();
      return R(`${sub === 'upgrade' ? `Release "${rel}" has been upgraded. Happy Helming!\n` : ''}NAME: ${rel}\nLAST DEPLOYED: Tue Sep  1 09:00:00 2026\nNAMESPACE: ${ns}\nSTATUS: deployed\nREVISION: ${rev}\nTEST SUITE: None`);
    }
    case 'list': case 'ls': {
      const rs = H.releases.filter((r) => flags.all || r.ns === ns);
      return R(table(['NAME', 'NAMESPACE', 'REVISION', 'UPDATED', 'STATUS', 'CHART', 'APP VERSION'], rs.map((r) => [r.name, r.ns, r.rev, '2026-09-01 09:00:00 +0000 UTC', 'deployed', `${r.chart.split('/')[1]}-${r.version}`, r.app])) || 'NAME\tNAMESPACE\tREVISION\tUPDATED\tSTATUS\tCHART\tAPP VERSION');
    }
    case 'uninstall': case 'delete': {
      const rel = pos[1];
      const r = H.releases.find((x) => x.name === rel && x.ns === ns);
      if (!r) return R('', `Error: uninstall: Release not loaded: ${rel}: release: not found`);
      for (const o of [...c.objs.values()]) if ((o.metadata.annotations || {})['meta.helm.sh/release-name'] === rel && (o.metadata.annotations || {})['meta.helm.sh/release-namespace'] === ns) c.remove(o);
      for (const s of c.list('Secret', ns)) if (s.metadata.name.startsWith(`sh.helm.release.v1.${rel}.`)) c.remove(s);
      H.releases = H.releases.filter((x) => x !== r);
      c.reconcile();
      return R(`release "${rel}" uninstalled`);
    }
    case 'status': { const r = H.releases.find((x) => x.name === pos[1] && x.ns === ns); if (!r) return R('', 'Error: release: not found'); return R(`NAME: ${r.name}\nLAST DEPLOYED: Tue Sep  1 09:00:00 2026\nNAMESPACE: ${r.ns}\nSTATUS: deployed\nREVISION: ${r.rev}`); }
    case 'get': { const r = H.releases.find((x) => x.name === pos[2] && x.ns === ns); if (!r) return R('', 'Error: release: not found'); return R('USER-SUPPLIED VALUES:\n' + (Object.keys(r.vals).length ? yaml.dump(r.vals).trimEnd() : 'null')); }
    case 'show': { const ref = pos[2]; if (!CHARTS[ref]) return R('', `Error: failed to download "${ref}"`); return R(pos[1] === 'values' ? `replicaCount: 1\nimage:\n  tag: ""\nservice:\n  type: ${CHARTS[ref].svcType}\n  port: 80\n${CHARTS[ref].crds ? 'crds:\n  install: true\n' : ''}resources: {}` : `apiVersion: v2\nname: ${ref.split('/')[1]}\nversion: ${CHARTS[ref].version}\nappVersion: ${CHARTS[ref].app}`); }
  }
  return R('', `Error: unknown command "${sub}" for "helm"`);
}

const SHELL_HELP = `이 터미널은 CKA 실습용 시뮬레이터입니다. 쓸 수 있는 명령:

  kubectl (별칭 k)   get describe create run expose apply delete edit patch replace
                     label annotate taint scale set rollout cordon uncordon drain
                     logs exec top auth config api-resources explain autoscale wait kustomize
  helm               repo add/update/list · search repo · install · upgrade · list · uninstall · template
  노드               ssh node01 · exit · systemctl · journalctl -u kubelet · crictl ps -a / logs
  etcd               etcdctl snapshot save … · etcdutl snapshot restore … --data-dir …
  업그레이드         kubeadm upgrade plan/apply/node · apt-get update · apt-mark unhold · apt-get install
  파일               ls cat vi(=vim, nano) cp mv rm mkdir touch · echo … > 파일 · grep wc sort head tail base64
  셸                 | 파이프 · > >> 리다이렉트 · && ; · $VAR · export · alias · cat <<EOF … EOF

단축키: Tab 자동완성 · ↑/↓ 이전 명령 · Ctrl+L 화면 지우기`;
