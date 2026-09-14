const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Static demo credentials - no database needed.
const USERS = {
  admin: 'admin123',
  tester: 'test123',
};

const SESSION_COOKIE = 'sid';
const sessions = new Map(); // sid -> username

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function currentUser(req) {
  return sessions.get(req.cookies[SESSION_COOKIE]);
}

app.get('/', (req, res) => {
  if (currentUser(req)) return res.redirect('/success');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/login', (req, res) => res.redirect('/'));

app.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!username || !password) {
    return renderLogin(res, 400, 'Username and password are required.', username);
  }

  if (USERS[username] !== password) {
    return renderLogin(res, 401, 'Invalid username or password.', username);
  }

  const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessions.set(sid, username);
  res.cookie(SESSION_COOKIE, sid, { httpOnly: true, sameSite: 'lax' });
  res.redirect('/success');
});

app.get('/success', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.redirect('/');
  res.status(200).send(successPage(user));
});

app.post('/logout', (req, res) => {
  sessions.delete(req.cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE);
  res.redirect('/');
});

// JSON endpoint, handy for API-level tests.
app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required.' });
  }
  if (USERS[username] !== password) {
    return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
  }
  res.json({ ok: true, username });
});

function renderLogin(res, status, error, username) {
  const fs = require('fs');
  const html = fs.readFileSync(path.join(__dirname, 'views', 'login.html'), 'utf8');
  const banner = `<p class="error" data-testid="error-message" role="alert">${escapeHtml(error)}</p>`;
  res.status(status).send(
    html
      .replace('<!--ERROR-->', banner)
      .replace('value=""', `value="${escapeHtml(username)}"`)
  );
}

function successPage(user) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login successful</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="card">
    <h1 data-testid="success-heading">Login successful</h1>
    <p>Welcome back, <strong data-testid="username">${escapeHtml(user)}</strong>.</p>
    <form method="post" action="/logout">
      <button type="submit" data-testid="logout-button">Log out</button>
    </form>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

if (require.main === module) {
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}

module.exports = app;
