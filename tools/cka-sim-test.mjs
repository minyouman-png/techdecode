#!/usr/bin/env node
// CKA 실습 과제 자가검증 — 과제마다:
//   ① 준비 직후에는 채점이 **만점이 아니어야** 한다(문제가 이미 풀려 있으면 과제가 아니다)
//   ② 모범 답안을 재생하면 **모든 항목이 통과**해야 한다(답안이 틀리면 학습자를 속인다)
//   ③ 답안 재생 중 예상 밖 오류가 없어야 한다(허용: `expectErr` 로 표시한 단계 — 일부러 틀려 보는 단계)
// + 시뮬레이터 핵심 동작 회귀 검사(아래 SMOKE).
//
//   node tools/cka-sim-test.mjs          # 전부
//   node tools/cka-sim-test.mjs w3 t6    # 일부
//   node tools/cka-sim-test.mjs -v       # 답안 재생 출력까지
import { Cluster } from '../src/scripts/kubesim/engine.js';
import { Session } from '../src/scripts/kubesim/shell.js';
import { TASKS, prepareTask, applyStep, score } from '../src/scripts/kubesim/tasks.js';

const args = process.argv.slice(2);
const verbose = args.includes('-v');
const only = args.filter((a) => !a.startsWith('-'));
let bad = 0;

// 일부러 오류를 보여 주는 단계(학습용) — 답안에서 오류가 나도 된다
const EXPECTED_ERR = [/drain node02 --ignore-daemonsets$/, /exec client -- nslookup kubernetes$/, /^kubectl get nodes$/, /grep -c "kind: CustomResourceDefinition"/, /auth can-i (delete pods|delete nodes)/];

for (const t of TASKS) {
  if (only.length && !only.includes(t.id)) continue;
  const { cluster: c, session: s } = prepareTask(t, Cluster, Session);
  const before = score(t, c, s);
  const errs = [];
  for (const step of t.solution) {
    const r = applyStep(s, step);
    const label = typeof step === 'string' ? step : `vi ${step.vi}`;
    if (verbose) console.log(`   $ ${label}\n${(r.out || '').split('\n').slice(0, 6).map((l) => '     ' + l).join('\n')}${r.err ? '\n     ERR ' + r.err.split('\n')[0] : ''}`);
    if (r.err && !/^Warning|^Defaulted|Deprecated|deleted from|^\(/.test(r.err) && !EXPECTED_ERR.some((re) => re.test(label))) errs.push(`${label} → ${r.err.split('\n')[0]}`);
  }
  const after = score(t, c, s);
  const ok = before.got < before.total && after.got === after.total && !errs.length;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${t.id.padEnd(4)} ${t.title}  (준비 ${before.got}/${before.total} → 답안 ${after.got}/${after.total})`);
  if (!ok) {
    if (before.got === before.total) console.log('      · 준비 직후 이미 만점 — 과제가 성립하지 않음');
    for (const it of after.items) if (!it.ok) console.log(`      · 미통과: ${it.t}`);
    for (const e of errs) console.log(`      · 답안 오류: ${e}`);
  }
}

// ── 시뮬레이터 동작 회귀(과제 밖에서 학습자가 자주 치는 것) ──
const SMOKE = [
  ['k get nodes', /controlplane\s+Ready\s+control-plane/],
  ['k get pods -n kube-system', /kube-apiserver-controlplane\s+1\/1\s+Running/],
  ['k run x --image=nginx --dry-run=client -o yaml', /^apiVersion: v1\nkind: Pod/],
  ['k create deploy d --image=nginx:1.27 --replicas=2 && k get deploy d', /d\s+2\/2/],
  ['k get deploy d -o jsonpath=\'{.spec.replicas}\'', /^2$/],
  ['k run bad --image=ngnix && k get pod bad', /ImagePullBackOff|ErrImagePull/],
  ['k apply -f /nope.yaml', /the path "\/nope.yaml" does not exist/, true],
  ['k get podz', /doesn't have a resource type "podz"/, true],
  ['k expose deploy d --port=80 && k get ep d', /10\.244\.\d+\.\d+:80/],
  ['k run t --rm -it --image=busybox:1.37 --restart=Never -- wget -qO- -T2 d', /Welcome to nginx/],
  ['k exec deploy/d -- curl -s d', /Welcome to nginx/],
  ['echo hello > /root/a.txt && cat /root/a.txt', /^hello$/],
  ['k get pods -A | grep -c Running', /^\d{2}$/],
  ['ssh node01 && hostname', /node01/],
  ['exit', /closed/],
  ['k top nodes', /node01\s+\d+m/],
  ['k auth can-i create pods --as=system:serviceaccount:default:default', /^no$/],
  ['k config set-context --current --namespace=kube-system && k get deploy coredns', /coredns\s+2\/2/],
  ['k config set-context --current --namespace=default', /modified/],
];
{
  const s = new Session(new Cluster());
  for (const [cmd, re, wantErr] of SMOKE) {
    const r = s.run(cmd);
    const text = wantErr ? r.err : r.out;
    const ok = re.test(text || '');
    if (!ok) bad++;
    if (!ok || verbose) console.log(`${ok ? 'OK  ' : 'FAIL'} smoke  ${cmd}${ok ? '' : `\n      out: ${(r.out || '').slice(0, 200)}\n      err: ${(r.err || '').slice(0, 200)}`}`);
  }
  // YAML 오타 → strict decoding
  s.writeFile('/root/typo.yaml', 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: typo\nspec:\n  containers:\n  - name: a\n    imagee: nginx\n');
  const r = s.run('k apply -f typo.yaml');
  const ok = /unknown field "spec.containers\[0\].imagee"/.test(r.err);
  if (!ok) { bad++; console.log('FAIL smoke  strict decoding\n      ' + r.err); }
  // kubectl edit 로 파드 spec 을 바꾸면 거부 + /tmp 에 사본
  s.run('k run e --image=nginx');
  const ed = s.run('k edit pod e');
  const res = ed.edit && ed.edit.save(ed.edit.content.replace('restartPolicy: Always', 'restartPolicy: Always\n  hostname: zz'));
  const ok2 = !!res && /pod updates may not change fields/.test(res.err) && /stored to "\/tmp\/kubectl-edit-/.test(res.err);
  if (!ok2) { bad++; console.log('FAIL smoke  kubectl edit 불변 필드\n      ' + JSON.stringify(res)); }
}

console.log(bad ? `\n⛔ ${bad}건 실패` : `\n✅ 과제 ${only.length || TASKS.length}개 + 시뮬레이터 회귀 전부 통과`);
process.exit(bad ? 1 : 0);
