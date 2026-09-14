'use strict';

// Reads .github/workflows/tests.yml for the TC-CI cases. Not a test file itself (the
// `*.test.js` glob skips it).
//
// The repository deliberately has no test dependencies, so rather than pulling in a YAML
// parser for a handful of assertions, this parses the subset of YAML that a workflow file
// actually uses: nested mappings, block and flow sequences, block scalars (`|`), quoted and
// bare scalars, and comments. Anything beyond that subset - anchors, multi-document files,
// flow mappings - is out of scope and throws rather than guessing.

const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = '.github/workflows/tests.yml';
const REPO = path.join(__dirname, '..', '..');

const indentOf = (line) => line.match(/^ */)[0].length;
const isBlank = (line) => line.trim() === '' || line.trim().startsWith('#');

/** Strips a trailing `# comment`, but only outside quotes. */
function stripComment(s) {
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) {
      return s.slice(0, i);
    }
  }
  return s;
}

function scalar(raw) {
  const s = stripComment(raw).trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    return inner === '' ? [] : inner.split(',').map(scalar);
  }
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  if (s === 'true' || s === 'false') return s === 'true';
  if (s === 'null' || s === '~' || s === '') return null;
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}

class Parser {
  constructor(text) {
    this.lines = text.split('\n');
    this.i = 0;
  }

  /** Advances past blank and comment-only lines. */
  skipBlank() {
    while (this.i < this.lines.length && isBlank(this.lines[this.i])) this.i++;
  }

  /** Collects the body of a `|` block scalar, dedented to its own least-indented line. */
  blockScalar(parentIndent) {
    const body = [];
    while (this.i < this.lines.length) {
      const line = this.lines[this.i];
      if (line.trim() !== '' && indentOf(line) <= parentIndent) break;
      body.push(line);
      this.i++;
    }
    while (body.length && body[body.length - 1].trim() === '') body.pop();
    const inner = Math.min(...body.filter((l) => l.trim() !== '').map(indentOf));
    return body.map((l) => l.slice(inner)).join('\n') + '\n';
  }

  /** Parses whatever structure starts at the current line, at exactly `indent` columns. */
  parse(indent) {
    this.skipBlank();
    if (this.i >= this.lines.length) return null;
    if (indentOf(this.lines[this.i]) !== indent) return null;
    return this.lines[this.i].trim().startsWith('- ') ? this.sequence(indent) : this.mapping(indent);
  }

  sequence(indent) {
    const out = [];
    for (;;) {
      this.skipBlank();
      const line = this.lines[this.i];
      if (this.i >= this.lines.length || indentOf(line) !== indent || !line.trim().startsWith('- ')) {
        return out;
      }
      const rest = line.slice(indent + 2);
      if (/^[\w.-]+:(\s|$)/.test(rest)) {
        // `- key: value` — the item is a mapping whose first key sits two columns in.
        // Blanking the dash lets the mapping parser read it like any other block.
        this.lines[this.i] = ' '.repeat(indent + 2) + rest;
        out.push(this.mapping(indent + 2));
      } else {
        out.push(scalar(rest));
        this.i++;
      }
    }
  }

  mapping(indent) {
    const out = {};
    for (;;) {
      this.skipBlank();
      if (this.i >= this.lines.length) return out;
      const line = this.lines[this.i];
      if (indentOf(line) !== indent) return out;
      const m = line.trim().match(/^([\w.-]+):(?:\s+(.*))?$/);
      if (!m) throw new Error(`${WORKFLOW_PATH}:${this.i + 1}: unsupported YAML: ${line}`);
      const [, key, value] = m;
      this.i++;
      if (value === undefined || stripComment(value).trim() === '') {
        // A key with no value on its line opens a nested block - or is an empty value.
        this.skipBlank();
        const child = this.lines[this.i];
        out[key] = this.i < this.lines.length && indentOf(child) > indent
          ? this.parse(indentOf(child))
          : null;
      } else if (stripComment(value).trim() === '|' || stripComment(value).trim() === '>') {
        out[key] = this.blockScalar(indent);
      } else {
        out[key] = scalar(value);
      }
    }
  }
}

function parseYaml(text) {
  return new Parser(text).parse(0);
}

/** The workflow as `{ path, text, doc }`. */
function loadWorkflow() {
  const text = fs.readFileSync(path.join(REPO, WORKFLOW_PATH), 'utf8');
  return { path: WORKFLOW_PATH, text, doc: parseYaml(text) };
}

/** Every `run:` command in the job, as one string per step. */
function runCommands(job) {
  return job.steps.filter((s) => typeof s.run === 'string').map((s) => s.run);
}

module.exports = { WORKFLOW_PATH, REPO, parseYaml, loadWorkflow, runCommands };
