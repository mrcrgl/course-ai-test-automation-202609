'use strict';

// A deliberately small markdown renderer covering exactly the constructs the
// files under tests/ use: headings, paragraphs, pipe tables, bullet lists,
// fenced code, block quotes, inline code, bold and links.
//
// It escapes first and never passes source HTML through. That is the whole
// point: tests/cases/TC-SEC-001 and TC-SEC-003 carry `<script>` and
// `onerror=` payloads as test data, so a renderer with a raw-HTML escape
// hatch would publish them as live markup.
//
// Links are the one place a value from the file could reach an attribute.
// The href is never taken from the source - `opts.link` maps a source URL to
// an application path, and a URL it does not recognise is rendered as plain
// text.

const { escapeHtml } = require('./html');

const FENCE = /^\s*```/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const TABLE_ROW = /^\s*\|/;
const TABLE_DIVIDER = /^\s*\|[\s:|-]+\|\s*$/;
const STEP = /^\*\*(Given|When|Then|And|But)\*\*\s*(.*)$/;

/** Renders a markdown document to HTML. */
function renderMarkdown(source, opts = {}) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (FENCE.test(line)) {
      const body = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++]);
      i++; // closing fence, or end of input
      out.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.min(6, heading[1].length + 1); // demoted: the page owns <h1>
      out.push(`<h${level}>${inline(heading[2], opts)}</h${level}>`);
      i++;
      continue;
    }

    if (TABLE_ROW.test(line) && TABLE_DIVIDER.test(lines[i + 1] || '')) {
      const rows = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++]);
      out.push(renderTable(rows, opts));
      continue;
    }

    if (BULLET.test(line)) {
      const items = [];
      while (i < lines.length && BULLET.test(lines[i])) items.push(lines[i++].match(BULLET)[1]);
      out.push(`<ul>${items.map((t) => `<li>${inline(t, opts)}</li>`).join('')}</ul>`);
      continue;
    }

    if (QUOTE.test(line)) {
      const quoted = [];
      while (i < lines.length && QUOTE.test(lines[i])) quoted.push(lines[i++].match(QUOTE)[1]);
      out.push(`<blockquote>${renderMarkdown(quoted.join('\n'), opts)}</blockquote>`);
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines, i)) para.push(lines[i++]);
    out.push(renderParagraph(para, opts));
  }

  return out.join('\n');
}

function isBlockStart(lines, i) {
  const line = lines[i];
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    BULLET.test(line) ||
    QUOTE.test(line) ||
    (TABLE_ROW.test(line) && TABLE_DIVIDER.test(lines[i + 1] || ''))
  );
}

/**
 * A run of `**Given**` / `**When**` / `**Then**` lines is a scenario, not a
 * paragraph: each step is rendered on its own with its keyword marked up, so
 * the structure survives the trip from the file to the page.
 */
function renderParagraph(lines, opts) {
  if (lines.every((l) => STEP.test(l))) {
    const steps = lines.map((l) => {
      const [, keyword, rest] = l.match(STEP);
      return (
        `<li class="step step-${keyword.toLowerCase()}">` +
        `<span class="step-keyword">${keyword}</span> ${inline(rest, opts)}</li>`
      );
    });
    return `<ol class="scenario" data-testid="scenario">${steps.join('')}</ol>`;
  }
  return `<p>${inline(lines.join('\n'), opts)}</p>`;
}

function renderTable(rows, opts) {
  const [header, , ...body] = rows;
  const head = cells(header)
    .map((c) => `<th>${inline(c, opts)}</th>`)
    .join('');
  const lines = body
    .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c, opts)}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${lines}</tbody></table>`;
}

function cells(row) {
  let s = row.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

/** Inline formatting. Code spans win over everything inside them. */
function inline(text, opts) {
  const out = [];
  const re = /`([^`]*)`/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    out.push(links(text.slice(last, m.index), opts));
    out.push(`<code>${escapeHtml(m[1])}</code>`);
    last = re.lastIndex;
  }
  out.push(links(text.slice(last), opts));
  return out.join('');
}

function links(text, opts) {
  const out = [];
  const re = /\[([^\]]*)\]\(([^)\s]*)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    out.push(emphasis(escapeHtml(text.slice(last, m.index))));
    const label = emphasis(escapeHtml(m[1]));
    const href = opts.link ? opts.link(m[2]) : null;
    out.push(href ? `<a href="${escapeHtml(href)}">${label}</a>` : label);
    last = re.lastIndex;
  }
  out.push(emphasis(escapeHtml(text.slice(last))));
  return out.join('');
}

function emphasis(escaped) {
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

module.exports = { renderMarkdown, escapeHtml };
