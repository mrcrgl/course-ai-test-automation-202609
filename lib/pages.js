'use strict';

// The four browse pages. Every value rendered here comes from a file on disk,
// so it is either escaped by `escapeHtml` or run through the markdown
// renderer, which escapes as it goes.

const { renderMarkdown } = require('./markdown');
const { escapeHtml } = require('./html');

const e = escapeHtml;

/**
 * Maps a link in a case or run file onto an application route. Only the two
 * content directories and absolute http(s) URLs resolve; anything else is
 * rendered as plain text, so no href is ever taken verbatim from a file.
 */
function contentLink(url) {
  const caseFile = /^(?:\.\.\/cases\/|\.\/)?(TC-[A-Z]+-\d{3})-[A-Za-z0-9-]+\.md$/.exec(url);
  if (caseFile) return `/cases/${caseFile[1]}`;

  const runFile = /^(?:\.\.\/runs\/|\.\/)?(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.md$/.exec(url);
  if (runFile) return `/runs/${runFile[1]}`;

  if (/^\.\.\/cases\/?$/.test(url)) return '/cases';
  if (/^\.\.\/runs\/?$/.test(url)) return '/runs';
  if (/^https?:\/\//.test(url)) return url;

  return null;
}

const markdown = (source) => renderMarkdown(source, { link: contentLink });

function layout({ title, user, heading, subtitle = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="browse">
  <header class="topbar">
    <nav class="topbar-nav">
      <a href="/cases" data-testid="cases-link">Test cases</a>
      <a href="/runs" data-testid="runs-link">Test runs</a>
    </nav>
    <form method="post" action="/logout" class="topbar-user">
      <span>Signed in as <strong data-testid="username">${e(user)}</strong></span>
      <button type="submit" data-testid="logout-button">Log out</button>
    </form>
  </header>
  <main class="page">
    <h1>${e(heading)}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${body}
  </main>
</body>
</html>`;
}

const badge = (value) =>
  `<span class="badge badge-${e(String(value).toLowerCase())}">${e(value)}</span>`;

// ---------------------------------------------------------------- case list

function casesPage(cases, user) {
  const rows = cases
    .map((c) =>
      c.error
        ? `<tr class="unreadable" data-testid="case-row">
             <td>—</td>
             <td colspan="5" data-testid="case-unreadable">
               <code>${e(c.file)}</code> — unreadable: ${e(c.error)}
             </td>
           </tr>`
        : `<tr data-testid="case-row">
             <td><a href="/cases/${e(c.id)}" data-testid="case-link">${e(c.id)}</a></td>
             <td>${e(c.title)}</td>
             <td>${badge(c.test_type)}</td>
             <td>${badge(c.priority)}</td>
             <td>${e(c.suite)}</td>
             <td>${e(c.automation)}</td>
           </tr>`
    )
    .join('');

  const body = cases.length
    ? `<table class="grid" data-testid="case-table">
         <thead><tr>
           <th>ID</th><th>Title</th><th>Type</th><th>Priority</th><th>Suite</th><th>Automation</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>`
    : '<p class="empty" data-testid="empty-cases">No test cases have been written yet.</p>';

  return layout({
    title: 'Test cases',
    user,
    heading: 'Test cases',
    subtitle: `<span data-testid="case-count">${cases.length}</span> case${
      cases.length === 1 ? '' : 's'
    } in <code>tests/cases/</code>.`,
    body,
  });
}

// -------------------------------------------------------------- case detail

function metaTable(meta) {
  const rows = Object.entries(meta)
    .filter(([key]) => key !== 'references')
    .map(([key, value]) => `<tr><th>${e(key)}</th><td>${e(value)}</td></tr>`)
    .join('');
  return `<table class="meta" data-testid="case-meta"><tbody>${rows}</tbody></table>`;
}

function referenceTable(references) {
  if (!references.length) {
    return '<p class="empty" data-testid="case-references">This case cites no test basis.</p>';
  }
  const rows = references
    .map((r) => {
      const source = /^https?:\/\//.test(r.source || '')
        ? `<a href="${e(r.source)}">${e(r.source)}</a>`
        : e(r.source || '—');
      return `<tr>
        <td><code>${e(r.id || '—')}</code></td>
        <td>${e(r.type || '—')}</td>
        <td>${source}</td>
        <td>${e(r.demand || '—')}</td>
      </tr>`;
    })
    .join('');
  return `<table class="grid" data-testid="case-references">
    <thead><tr><th>Reference</th><th>Type</th><th>Source</th><th>What it demands</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function resultsTable(results) {
  if (!results.length) {
    return '<p class="empty" data-testid="case-results">No recorded run covers this case yet.</p>';
  }
  const rows = results
    .map(
      (r) => `<tr>
        <td><a href="/runs/${e(r.run)}" data-testid="result-run-link">${e(r.timestamp)}</a></td>
        <td>${badge(r.result)}</td>
        <td>${e(r.latency)}</td>
        <td>${e(r.completed)}</td>
      </tr>`
    )
    .join('');
  return `<table class="grid" data-testid="case-results">
    <thead><tr><th>Run</th><th>Result</th><th>Latency</th><th>Completed</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function casePage(testCase, results, user) {
  if (testCase.error) {
    return layout({
      title: testCase.id,
      user,
      heading: testCase.id,
      body: `<p class="empty" data-testid="case-unreadable">
        <code>${e(testCase.file)}</code> — unreadable: ${e(testCase.error)}
      </p>`,
    });
  }

  const sections = testCase.sections
    .map((s) => {
      const rendered =
        s.title === 'References'
          ? referenceTable(testCase.references)
          : markdown(s.body);
      return `<section data-section="${e(s.slug)}">
        <h2>${e(s.title)}</h2>
        ${rendered}
      </section>`;
    })
    .join('');

  const body = `
    <section data-section="metadata">
      <h2>Metadata</h2>
      ${metaTable(testCase.meta)}
    </section>
    <section data-section="recent-results">
      <h2>Recent results</h2>
      ${resultsTable(results)}
    </section>
    ${sections}`;

  return layout({
    title: `${testCase.id} — ${testCase.title}`,
    user,
    heading: `${testCase.id} — ${testCase.title}`,
    subtitle: `<code>tests/cases/${e(testCase.file)}</code>`,
    body,
  });
}

// ----------------------------------------------------------------- run list

function runsPage(runs, user) {
  if (!runs.length) {
    return layout({
      title: 'Test runs',
      user,
      heading: 'Test runs',
      body: `<p class="empty" data-testid="empty-runs">
        No runs have been recorded yet. Run <code>npm run test:report</code> to record one.
      </p>`,
    });
  }

  const rows = runs
    .map(
      (r) => `<tr data-testid="run-row">
        <td><a href="/runs/${e(r.id)}" data-testid="run-link">${e(r.timestamp)}</a></td>
        <td>${badge(r.verdict)}</td>
        <td>${e(r.passed)}</td>
        <td>${e(r.failed)}</td>
        <td>${e(r.skipped)}</td>
        <td><code data-testid="run-commit">${e(r.commit)}</code></td>
        <td>${e(r.wallClock)}</td>
      </tr>`
    )
    .join('');

  return layout({
    title: 'Test runs',
    user,
    heading: 'Test runs',
    subtitle: `<span data-testid="run-count">${runs.length}</span> recorded run${
      runs.length === 1 ? '' : 's'
    }, newest first.`,
    body: `<table class="grid" data-testid="run-table">
      <thead><tr>
        <th>Run</th><th>Verdict</th><th>Passed</th><th>Failed</th><th>Skipped</th>
        <th>Commit</th><th>Wall clock</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  });
}

// --------------------------------------------------------------- run detail

function runPage(run, user) {
  return layout({
    title: `Test run ${run.timestamp}`,
    user,
    heading: `Test run — ${run.timestamp}`,
    subtitle: `${badge(run.verdict)} <code>tests/runs/${e(run.file)}</code>`,
    body: `<article class="report" data-testid="run-report">${markdown(run.body)}</article>`,
  });
}

// ---------------------------------------------------------------- not found

function notFoundPage(message, user) {
  return layout({
    title: 'Not found',
    user,
    heading: 'Not found',
    body: `<p class="empty" data-testid="not-found">${e(message)}</p>
      <p><a href="/cases">Test cases</a> · <a href="/runs">Test runs</a></p>`,
  });
}

module.exports = { casesPage, casePage, runsPage, runPage, notFoundPage, contentLink };
