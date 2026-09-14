'use strict';

// Reads the test cases and run reports straight off disk. There is no
// database, no cache and no index: every request re-reads the files, so the
// pages always show what is actually committed. Nothing here writes.

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.join(__dirname, '..');

// TESTS_DIR lets a test point the pages at a fixture directory (an empty
// tests/runs/, a deliberately malformed case) without touching the real files.
function testsDir() {
  return process.env.TESTS_DIR ? path.resolve(process.env.TESTS_DIR) : path.join(REPO, 'tests');
}

const casesDir = () => path.join(testsDir(), 'cases');
const runsDir = () => path.join(testsDir(), 'runs');

// Identifiers are matched, never joined blindly: anything that is not exactly
// one of these shapes never reaches the filesystem, so `..` and absolute paths
// cannot address a file outside the two directories.
const CASE_ID = /^TC-[A-Z]+-\d{3}$/;
const RUN_ID = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/;

const isCaseId = (id) => CASE_ID.test(String(id));
const isRunId = (id) => RUN_ID.test(String(id));

// ------------------------------------------------------------- front matter

const unquote = (v) => v.replace(/^["'](.*)["']$/, '$1');

/**
 * Parses the YAML subset the case format actually uses: flat `key: value`
 * pairs plus one list of objects under `references`.
 */
function parseFrontMatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return null;

  const data = {};
  let listKey = null;
  let item = null;

  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;

    if (/^\s/.test(line)) {
      if (!listKey) continue;
      const entry = line.match(/^\s*-\s+([a-z_]+):\s*(.*)$/);
      if (entry) {
        item = { [entry[1]]: unquote(entry[2]) };
        data[listKey].push(item);
        continue;
      }
      const kv = line.match(/^\s+([a-z_]+):\s*(.*)$/);
      if (kv && item) item[kv[1]] = unquote(kv[2]);
      continue;
    }

    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) {
      listKey = null;
      continue;
    }
    if (kv[2] === '') {
      listKey = kv[1];
      data[listKey] = [];
      item = null;
    } else {
      listKey = null;
      data[kv[1]] = unquote(kv[2]);
    }
  }

  return { data, body: text.slice(m[0].length) };
}

/** Splits a case body into its `## ` sections, ignoring fenced code. */
function splitSections(body) {
  const sections = [];
  let current = null;
  let fenced = false;

  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && line.match(/^##\s+(.*)$/);
    if (heading) {
      current = { title: heading[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }

  return sections.map((s) => ({
    title: s.title,
    slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    body: s.lines.join('\n').trim(),
  }));
}

// -------------------------------------------------------------------- cases

function caseFiles() {
  const dir = casesDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^TC-.*\.md$/.test(f)).sort();
}

function readCaseFile(file) {
  const text = fs.readFileSync(path.join(casesDir(), file), 'utf8');
  const parsed = parseFrontMatter(text);
  if (!parsed || !parsed.data.id || !parsed.data.title) {
    return { file, error: 'The front matter of this file is missing or could not be parsed.' };
  }
  return { file, error: null, meta: parsed.data, body: parsed.body };
}

/**
 * Every case file, in filename order. A file whose front matter cannot be read
 * is kept in the list and flagged, never dropped - a case that silently
 * disappears from the index is a case nobody notices has stopped being run.
 */
function listCases() {
  return caseFiles().map((file) => {
    const entry = readCaseFile(file);
    if (entry.error) return { file, id: null, error: entry.error };
    const m = entry.meta;
    return {
      file,
      id: m.id,
      title: m.title,
      test_type: m.test_type,
      priority: m.priority,
      suite: m.suite,
      automation: m.automation,
      error: null,
    };
  });
}

/** One case by ID, or null if the ID is unknown or malformed. */
function loadCase(id) {
  if (!isCaseId(id)) return null;
  const file = caseFiles().find((f) => f.startsWith(`${id}-`));
  if (!file) return null;
  const entry = readCaseFile(file);
  if (entry.error) return { file, id, error: entry.error, sections: [] };
  return {
    file,
    id: entry.meta.id,
    title: entry.meta.title,
    meta: entry.meta,
    references: Array.isArray(entry.meta.references) ? entry.meta.references : [],
    sections: splitSections(entry.body),
    error: null,
  };
}

// --------------------------------------------------------------------- runs

function runFiles() {
  const dir = runsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && isRunId(f.slice(0, -3)))
    .sort()
    .reverse(); // the run ID is an ISO timestamp, so name order is time order
}

/** `2026-09-14T12-37-03Z` -> `2026-09-14T12:37:03Z` */
function runTimestamp(id) {
  return id.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z');
}

/** Two-column `| key | value |` rows, first occurrence wins. */
function tableFields(text) {
  const fields = {};
  for (const m of text.matchAll(/^\|([^|\n]*)\|([^|\n]*)\|[ \t]*$/gm)) {
    const key = m[1].trim();
    const value = m[2].trim().replace(/^`(.*)`$/, '$1');
    if (!key || /^-+$/.test(key) || key in fields) continue;
    fields[key] = value;
  }
  return fields;
}

/** The rows of the `## Results` table: one per executed case. */
function resultRows(text) {
  const section = /\n## Results\n([\s\S]*?)(?:\n## |$)/.exec(text);
  if (!section) return [];
  const rows = [];
  for (const line of section[1].split('\n')) {
    if (!line.startsWith('|')) continue;
    const cols = line.slice(1).replace(/\|[ \t]*$/, '').split('|').map((c) => c.trim());
    if (cols.length < 7) continue;
    const id = (cols[0].match(/TC-[A-Z]+-\d+/) || [])[0];
    if (!id) continue;
    rows.push({
      id,
      title: cols[1],
      result: cols[2],
      latency: cols[3],
      completed: cols[4],
      suite: cols[5],
      priority: cols[6],
    });
  }
  return rows;
}

function summarise(id, text) {
  const fields = tableFields(text);
  const verdict = (/^\*\*(PASS|FAIL)\*\*/m.exec(text) || [])[1] || 'UNKNOWN';
  return {
    id,
    timestamp: runTimestamp(id),
    verdict,
    executed: fields.Executed ?? '—',
    passed: fields.Passed ?? '—',
    failed: fields.Failed ?? '—',
    skipped: fields.Skipped ?? '—',
    commit: fields.Commit ?? '—',
    commitMessage: fields['Commit message'] ?? '',
    wallClock: fields['Wall clock'] ?? '—',
  };
}

/** Every recorded run, newest first. */
function listRuns() {
  return runFiles().map((file) => {
    const id = file.slice(0, -3);
    return summarise(id, fs.readFileSync(path.join(runsDir(), file), 'utf8'));
  });
}

/** One run by ID, with its report body, or null if unknown or malformed. */
function loadRun(id) {
  if (!isRunId(id)) return null;
  const dir = runsDir();
  const file = path.join(dir, `${id}.md`);
  // The pattern above already rules traversal out; this is the second lock on
  // the same door, because the pattern is one edit away from being loosened.
  if (path.dirname(path.resolve(file)) !== path.resolve(dir)) return null;
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  return { ...summarise(id, text), file: `${id}.md`, body: text.replace(/^# .*\n/, '') };
}

/**
 * The most recent results recorded for one case, newest first. This is the
 * other half of the link between a specification and its evidence: the run
 * report links to the case, and the case links back to the runs it appeared
 * in.
 */
function recentResultsFor(caseId, limit = 5) {
  if (!isCaseId(caseId)) return [];
  const out = [];
  for (const file of runFiles()) {
    if (out.length >= limit) break;
    const id = file.slice(0, -3);
    const row = resultRows(fs.readFileSync(path.join(runsDir(), file), 'utf8')).find(
      (r) => r.id === caseId
    );
    if (row) out.push({ run: id, timestamp: runTimestamp(id), ...row });
  }
  return out;
}

module.exports = {
  isCaseId,
  isRunId,
  listCases,
  loadCase,
  listRuns,
  loadRun,
  recentResultsFor,
  parseFrontMatter,
  splitSections,
};
