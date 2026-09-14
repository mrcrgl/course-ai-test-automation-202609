#!/usr/bin/env node
'use strict';

/**
 * Executes every automated test case and writes a structured run report to
 * tests/runs/<ISO timestamp>.md.
 *
 *   node .claude/skills/run-test-cases/scripts/run-tests.js [--allow-dirty] [--dry-run]
 *
 * Exit codes: 0 all passed | 1 tests failed | 2 not a git repository
 *             3 working tree dirty | 4 no executable cases found
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '../../../..');
const CASE_DIR = path.join(REPO, 'tests', 'cases');
const RUN_DIR = path.join(REPO, 'tests', 'runs');

const allowDirty = process.argv.includes('--allow-dirty');
const dryRun = process.argv.includes('--dry-run');

// ---------------------------------------------------------------- git state

function git(...args) {
  const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function repoState() {
  if (git('rev-parse', '--is-inside-work-tree') !== 'true') {
    console.error(
      'FATAL: not a git repository.\n' +
        'The run report records the commit a result belongs to, which requires git.\n' +
        `Run 'git init && git add -A && git commit' in ${REPO}, then retry.`
    );
    process.exit(2);
  }

  // tests/runs/ holds this runner's own output. A previous report sitting there
  // uncommitted says nothing about what is being executed now, so it must not block
  // the run - otherwise two runs in a row are impossible without a commit between them.
  const dirty = (git('status', '--porcelain') || '')
    .split('\n')
    .filter(Boolean)
    .filter((line) => !line.slice(3).replace(/^.* -> /, '').startsWith('tests/runs/'));

  if (dirty.length && !allowDirty) {
    console.error(
      `FATAL: working tree is dirty (${dirty.length} entr${dirty.length === 1 ? 'y' : 'ies'}).\n` +
        'A result recorded against a commit must describe that commit exactly.\n' +
        'Commit or stash first, or pass --allow-dirty to record the run as unreproducible.\n\n' +
        dirty.map((l) => `  ${l}`).join('\n')
    );
    process.exit(3);
  }

  return {
    dirty,
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    hash: git('rev-parse', 'HEAD'),
    short: git('rev-parse', '--short', 'HEAD'),
    subject: git('log', '-1', '--pretty=%s'),
    body: git('log', '-1', '--pretty=%b'),
    author: git('log', '-1', '--pretty=%an <%ae>'),
    committed: git('log', '-1', '--pretty=%cI'),
  };
}

// ------------------------------------------------------------------- cases

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2];
  }
  return fm;
}

function loadCases() {
  if (!fs.existsSync(CASE_DIR)) return [];
  return fs
    .readdirSync(CASE_DIR)
    .filter((f) => /^TC-.*\.md$/.test(f))
    .map((file) => {
      const fm = frontMatter(fs.readFileSync(path.join(CASE_DIR, file), 'utf8')) || {};
      const scriptRel = fm.script && fm.script !== 'none' ? fm.script : null;
      const scriptExists = scriptRel ? fs.existsSync(path.join(REPO, scriptRel)) : false;
      let skipReason = null;
      if (fm.status === 'deprecated') skipReason = 'case is deprecated';
      else if (fm.automation === 'manual') skipReason = 'manual case, no script';
      else if (fm.automation === 'planned') skipReason = 'automation planned, script is a stub';
      else if (!scriptRel) skipReason = 'no script declared';
      else if (!scriptExists) skipReason = `script missing: ${scriptRel}`;
      return { file, ...fm, scriptRel, executable: !skipReason, skipReason };
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

// --------------------------------------------------------------- TAP parse

/** Parses node:test TAP, timestamping each result as its line arrives. */
function makeTapParser(results) {
  let current = null;
  return (line) => {
    const head = line.match(/^(not )?ok (\d+) - (.*)$/);
    if (head) {
      let name = head[3];
      let status = head[1] ? 'fail' : 'pass';
      const directive = name.match(/\s+#\s+(SKIP|TODO)\b(.*)$/i);
      if (directive) {
        name = name.slice(0, directive.index).trim();
        if (directive[1].toUpperCase() === 'SKIP') status = 'skip';
        if (directive[1].toUpperCase() === 'TODO') status = 'todo';
      }
      current = {
        name: name.trim(),
        status,
        durationMs: null,
        completedAt: new Date().toISOString(),
        diagnostics: [],
      };
      results.push(current);
      return;
    }
    if (!current) return;
    const dur = line.match(/^\s+duration_ms:\s*([\d.]+)/);
    if (dur) {
      current.durationMs = Number(dur[1]);
      return;
    }
    if (/^\s+\.\.\.\s*$/.test(line)) {
      current = null;
      return;
    }
    if (/^\s/.test(line) && current.status === 'fail') current.diagnostics.push(line);
  };
}

// ------------------------------------------------------------------- stats

const pct = (sorted, p) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0;

const ms = (v) => (v == null ? '—' : v < 1000 ? `${Math.round(v)} ms` : `${(v / 1000).toFixed(2)} s`);

// -------------------------------------------------------------------- main

async function main() {
  const state = repoState();
  const cases = loadCases();
  const executable = cases.filter((c) => c.executable);

  if (!executable.length) {
    console.error('FATAL: no executable test cases found in tests/cases/.');
    process.exit(4);
  }

  const files = [...new Set(executable.map((c) => c.scriptRel))];
  const command = `node --test --test-reporter=tap ${files.join(' ')}`;
  const commandDisplay =
    `node --test --test-reporter=tap <${files.length} file(s) in tests/scripts/>`;

  if (dryRun) {
    console.log(`Would run ${executable.length} case(s):\n  ${command}`);
    return 0;
  }

  const results = [];
  const feed = makeTapParser(results);
  const startedAt = new Date();
  const t0 = process.hrtime.bigint();

  const exitCode = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', '--test-reporter=tap', ...files], {
      cwd: REPO,
    });
    let buf = '';
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const l of lines) feed(l);
    });
    child.stderr.on('data', (d) => process.stderr.write(d));
    child.on('close', (code) => {
      if (buf) feed(buf);
      resolve(code);
    });
  });

  const finishedAt = new Date();
  const wallMs = Number(process.hrtime.bigint() - t0) / 1e6;

  // Attach each TAP result to the case whose ID prefixes the test name.
  const byId = new Map(cases.map((c) => [c.id, c]));
  const untraceable = [];
  for (const r of results) {
    const id = (r.name.match(/^(TC-[A-Z]+-\d+)/) || [])[1];
    const c = id && byId.get(id);
    if (c) {
      c.result = r;
    } else {
      untraceable.push(r);
    }
  }
  const notReported = executable.filter((c) => !c.result);

  const ran = executable.filter((c) => c.result);
  const passed = ran.filter((c) => c.result.status === 'pass');
  const failed = ran.filter((c) => c.result.status === 'fail');
  const skippedByRunner = ran.filter((c) => ['skip', 'todo'].includes(c.result.status));
  const skipped = cases.filter((c) => !c.executable);
  const manual = cases.filter((c) => c.automation === 'semi-automated');

  const lat = ran.map((c) => c.result.durationMs ?? 0).sort((a, b) => a - b);
  const sum = lat.reduce((a, b) => a + b, 0);
  const slowest = [...ran].sort((a, b) => (b.result.durationMs ?? 0) - (a.result.durationMs ?? 0))[0];
  const fastest = [...ran].sort((a, b) => (a.result.durationMs ?? 0) - (b.result.durationMs ?? 0))[0];

  const ok = failed.length === 0 && notReported.length === 0 && exitCode === 0;
  const verdict = ok ? 'PASS' : 'FAIL';

  // ISO 8601 second precision; ':' -> '-' so the name is filesystem-safe.
  const stamp = startedAt.toISOString().replace(/\.\d+Z$/, 'Z');
  const runId = stamp.replace(/:/g, '-');

  const bySuite = new Map();
  for (const c of ran) {
    const s = c.suite || 'unassigned';
    if (!bySuite.has(s)) bySuite.set(s, []);
    bySuite.get(s).push(c.result.durationMs ?? 0);
  }

  const link = (c) => `[${c.id}](../cases/${c.file})`;
  const RESULT_ICON = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP', todo: 'TODO' };

  const out = [];
  out.push(`# Test run — ${stamp}`, '');
  out.push(
    `**${verdict}** — ${ran.length} of ${cases.length} case(s) executed, ` +
      `${passed.length} passed, ${failed.length} failed, ` +
      `${skipped.length + skippedByRunner.length} skipped.`,
    ''
  );

  if (state.dirty.length) {
    out.push(
      `> **This run is not reproducible.** The working tree had ${state.dirty.length} uncommitted ` +
        `change${state.dirty.length === 1 ? '' : 's'}, so the results describe the files on disk, ` +
        `not commit \`${state.short}\`. ` +
        'See Repository state.',
      ''
    );
  }

  out.push('## Run context', '');
  out.push('| Field | Value |', '| --- | --- |');
  out.push(`| Run ID | \`${runId}\` |`);
  out.push(`| Started | ${startedAt.toISOString()} |`);
  out.push(`| Finished | ${finishedAt.toISOString()} |`);
  out.push(`| Wall clock | ${ms(wallMs)} |`);
  out.push(`| Command | \`${commandDisplay}\` |`);
  out.push(`| Runner exit code | ${exitCode} |`);
  out.push(`| Node | ${process.version} |`);
  out.push(`| Platform | ${process.platform} ${process.arch} |`);
  out.push(`| Host | ${os.hostname()} |`, '');

  out.push('## Repository state', '');
  out.push('| Field | Value |', '| --- | --- |');
  const dirtyN = state.dirty.length;
  out.push(
    `| Working tree | ${dirtyN ? `**dirty** (${dirtyN} ${dirtyN === 1 ? 'entry' : 'entries'})` : 'clean'} |`
  );
  out.push(`| Branch | ${state.branch} |`);
  out.push(`| Commit | \`${state.short}\` |`);
  out.push(`| Full hash | \`${state.hash}\` |`);
  out.push(`| Commit message | ${state.subject} |`);
  out.push(`| Committed | ${state.committed} |`);
  out.push(`| Author | ${state.author} |`, '');
  if (state.dirty.length) {
    out.push('Uncommitted changes at run time:', '', '```');
    out.push(...state.dirty, '```', '');
  }

  out.push('## Summary', '');
  out.push('| Metric | Value |', '| --- | --- |');
  out.push(`| Cases available | ${cases.length} |`);
  out.push(`| Executed | ${ran.length} |`);
  out.push(`| Passed | ${passed.length} |`);
  out.push(`| Failed | ${failed.length} |`);
  out.push(`| Skipped | ${skipped.length + skippedByRunner.length} |`);
  out.push(`| Not reported | ${notReported.length} |`);
  out.push(`| Manual steps outstanding | ${manual.length} |`);
  out.push(`| Total latency (sum of cases) | ${ms(sum)} |`);
  out.push(`| Wall clock (parallel) | ${ms(wallMs)} |`);
  out.push(`| Mean latency | ${ms(lat.length ? sum / lat.length : null)} |`);
  out.push(`| Median latency | ${ms(pct(lat, 50))} |`);
  out.push(`| p95 latency | ${ms(pct(lat, 95))} |`);
  out.push(`| Fastest | ${fastest ? `${fastest.id} (${ms(fastest.result.durationMs)})` : '—'} |`);
  out.push(`| Slowest | ${slowest ? `${slowest.id} (${ms(slowest.result.durationMs)})` : '—'} |`, '');

  out.push('### Latency by suite', '');
  out.push('| Suite | Cases | Total | Mean | Max |', '| --- | --- | --- | --- | --- |');
  for (const [suite, xs] of [...bySuite].sort()) {
    const s = xs.reduce((a, b) => a + b, 0);
    out.push(`| ${suite} | ${xs.length} | ${ms(s)} | ${ms(s / xs.length)} | ${ms(Math.max(...xs))} |`);
  }
  out.push('');

  out.push('## Results', '');
  out.push(
    '| Case | Title | Result | Latency | Completed | Suite | Priority |',
    '| --- | --- | --- | --- | --- | --- | --- |'
  );
  for (const c of cases) {
    if (!c.result) continue;
    out.push(
      `| ${link(c)} | ${c.title} | ${RESULT_ICON[c.result.status]} | ` +
        `${ms(c.result.durationMs)} | ${c.result.completedAt} | ${c.suite} | ${c.priority} |`
    );
  }
  out.push('');

  out.push('## Skipped', '');
  const allSkipped = [...skipped, ...skippedByRunner];
  if (!allSkipped.length) {
    out.push('None — every available case was executed.', '');
  } else {
    out.push('| Case | Title | Reason | Automation |', '| --- | --- | --- | --- |');
    for (const c of allSkipped) {
      out.push(`| ${link(c)} | ${c.title} | ${c.skipReason || 'skipped by the runner'} | ${c.automation} |`);
    }
    out.push('');
  }

  out.push('## Failures', '');
  if (!failed.length && !notReported.length) {
    out.push('None.', '');
  } else {
    for (const c of failed) {
      out.push(`### ${c.id} — ${c.title}`, '');
      out.push(`Case: ${link(c)} · Script: \`${c.scriptRel}\` · Latency: ${ms(c.result.durationMs)}`, '');
      out.push('```');
      out.push(
        ...c.result.diagnostics
          .map((l) => l.replace(/^\s{2}/, ''))
          .filter((l, i) => !(i === 0 && l.trim() === '---'))
      );
      out.push('```', '');
    }
    for (const c of notReported) {
      out.push(`### ${c.id} — ${c.title}`, '');
      out.push(
        `Case: ${link(c)} · Script: \`${c.scriptRel}\``,
        '',
        'The script produced no TAP result. It most likely crashed before the test ran ' +
          '(a syntax error or a throw at module load). Run it on its own to see the error.',
        ''
      );
    }
  }

  if (manual.length) {
    out.push('## Manual follow-up', '');
    out.push(
      'These cases are `semi-automated`: the script covers part of the scenario, and the ' +
        'remaining steps must be confirmed by a person. An automated PASS above does not ' +
        'mean the whole case passed.',
      ''
    );
    out.push('| Case | Title | Automated result |', '| --- | --- | --- |');
    for (const c of manual) {
      out.push(`| ${link(c)} | ${c.title} | ${c.result ? RESULT_ICON[c.result.status] : '—'} |`);
    }
    out.push('');
  }

  if (untraceable.length) {
    out.push('## Untraceable tests', '');
    out.push(
      'These tests ran but their names do not begin with a known case ID, so they cannot ' +
        'be traced to a specification.',
      ''
    );
    for (const r of untraceable) out.push(`- \`${r.name}\` (${RESULT_ICON[r.status]})`);
    out.push('');
  }

  fs.mkdirSync(RUN_DIR, { recursive: true });
  const outPath = path.join(RUN_DIR, `${runId}.md`);
  fs.writeFileSync(outPath, out.join('\n'));

  const parts = [`${passed.length} passed`];
  if (failed.length) parts.push(`${failed.length} failed`);
  if (notReported.length) parts.push(`${notReported.length} not reported`);
  if (skipped.length + skippedByRunner.length) {
    parts.push(`${skipped.length + skippedByRunner.length} skipped`);
  }
  console.log(
    `${verdict}  ${parts.join(', ')}  of ${cases.length} case(s)  ` +
      `${ms(wallMs)} wall  ->  ${path.relative(REPO, outPath)}`
  );
  return ok ? 0 : 1;
}

main().then((c) => process.exit(c));
