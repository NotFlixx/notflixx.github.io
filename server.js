const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  const messages = readJson(MESSAGES_FILE, []);
  const entry = {
    id: crypto.randomUUID(),
    name,
    email,
    subject,
    message,
    createdAt: new Date().toISOString()
  };
  messages.push(entry);
  writeJson(MESSAGES_FILE, messages);

  // NOTE: This stores the message so you can see it in the admin panel.
  // If you later want automatic emails instead of mailto:, we can hook in Nodemailer here.

  res.json({ ok: true });
});

app.post('/api/admin/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  const users = readJson(USERS_FILE, []);
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ ok: false, error: 'Username already exists' });
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJson(USERS_FILE, users);

  res.json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  const users = readJson(USERS_FILE, []);
  const user = users.find(u => u.username === username);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  // Very simple token: do NOT use in production, but enough for a small portfolio
  const token = crypto.randomBytes(24).toString('hex');

  res.json({ ok: true, token });
});

app.get('/api/admin/messages', (req, res) => {
  const auth = req.headers['authorization'] || '';
  const [, token] = auth.split(' ');
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing token' });
  }

  // This is intentionally simple: any non-empty token is accepted.
  // You could later wire real token validation here if you want.
  const messages = readJson(MESSAGES_FILE, []);
  res.json({ ok: true, messages });
});

app.listen(PORT, () => {
  console.log(`NotFlixx server running on http://localhost:${PORT}`);
});

