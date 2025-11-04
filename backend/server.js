// Minimal auth server for kl-smartq
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { customAlphabet } = require('nanoid');

const app = express();
app.use(express.json());
app.use(cors());

const DATA_DIR = path.join(__dirname);
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORT = process.env.PORT || 8082;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-kl-smartq';
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const USE_MYSQL = (process.env.USE_MYSQL || 'false').toLowerCase() === 'true';

// MySQL config (used only if USE_MYSQL=true)
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_NAME = process.env.DB_NAME || 'kl_smartq';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

let db = null; // will hold mysql2/promise pool when used
if (USE_MYSQL) {
  const mysql = require('mysql2/promise');
  db = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

const nanoid = customAlphabet('0123456789abcdef', 10);

// helper: file store read/write (fallback)
function readUsersFile() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeUsersFile(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// ensure users file exists
if (!fs.existsSync(USERS_FILE)) {
  writeUsersFile([]);
}

// DB helper functions (use when USE_MYSQL=true)
async function findUserByEmail(email) {
  if (USE_MYSQL && db) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase()]);
    return rows[0] || null;
  }
  const users = readUsersFile();
  return users.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) || null;
}

async function createUserInStore(user) {
  if (USE_MYSQL && db) {
    const sql = `INSERT INTO users (id, name, email, password_hash, is_email_verified, points, badges, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    const badgesValue = user.badges ? JSON.stringify(user.badges) : null;
    await db.execute(sql, [user.id, user.name, user.email.toLowerCase(), user.passwordHash, user.isEmailVerified ? 1 : 0, user.points || 0, badgesValue]);
    return;
  }
  const users = readUsersFile();
  users.push(user);
  writeUsersFile(users);
}

// Temporary registrations store (for OTP flow)
const TEMP_FILE = path.join(DATA_DIR, 'temp_registrations.json');
if (!fs.existsSync(TEMP_FILE)) fs.writeFileSync(TEMP_FILE, JSON.stringify([]), 'utf8');

function readTempFile() {
  try { return JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8') || '[]'); } catch (e) { return []; }
}

function writeTempFile(arr) { fs.writeFileSync(TEMP_FILE, JSON.stringify(arr, null, 2), 'utf8'); }

// DB-backed temp registration helpers
async function findTempByEmail(email) {
  if (USE_MYSQL && db) {
    const [rows] = await db.execute('SELECT * FROM temp_registrations WHERE email = ? LIMIT 1', [email.toLowerCase()]);
    return rows[0] || null;
  }
  const arr = readTempFile();
  return arr.find(t => t.email.toLowerCase() === (email || '').toLowerCase()) || null;
}

async function upsertTempRegistration(temp) {
  if (USE_MYSQL && db) {
    // insert or update
    const sql = `INSERT INTO temp_registrations (email, name, password_hash, code, expires_at, verified) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), code = VALUES(code), expires_at = VALUES(expires_at), verified = VALUES(verified)`;
    await db.execute(sql, [temp.email.toLowerCase(), temp.name, temp.passwordHash, temp.code, temp.expiresAt, temp.verified ? 1 : 0]);
    return;
  }
  const arr = readTempFile();
  const idx = arr.findIndex(t => t.email.toLowerCase() === temp.email.toLowerCase());
  if (idx >= 0) arr[idx] = temp; else arr.push(temp);
  writeTempFile(arr);
}

async function deleteTempByEmail(email) {
  if (USE_MYSQL && db) {
    await db.execute('DELETE FROM temp_registrations WHERE email = ?', [email.toLowerCase()]);
    return;
  }
  const arr = readTempFile().filter(t => t.email.toLowerCase() !== (email || '').toLowerCase());
  writeTempFile(arr);
}

// nodemailer setup (optional SMTP)
const nodemailer = require('nodemailer');
let mailer = null;
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@kl-smartq.local';

if (SMTP_HOST && SMTP_USER) {
  mailer = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 587, secure: false, auth: { user: SMTP_USER, pass: SMTP_PASS } });
} else {
  // fallback: JSON transport (logs the message)
  mailer = nodemailer.createTransport({ jsonTransport: true });
}

async function sendVerificationEmail(email, name, code) {
  const subject = 'Your kl-smartq verification code';
  const text = `Hello ${name || ''},\n\nYour verification code is: ${code}\nIt expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`;
  const html = `<p>Hello ${name || ''},</p><p>Your verification code is: <b>${code}</b></p><p>It expires in 10 minutes.</p>`;
  const msg = { from: SMTP_FROM, to: email, subject, text, html };
  try {
    const info = await mailer.sendMail(msg);
    console.log('Verification email sent (info):', info && info.response ? info.response : info);
    return true;
  } catch (e) {
    console.error('Failed to send verification email:', e);
    return false;
  }
}

// Simple validators copied from original project's intent
function validEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // basic email regex
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function validPassword(password) {
  if (!password || typeof password !== 'string') return false;
  // min 8 chars, at least one upper, lower, number and special
  return /(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(password);
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body || {};
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!validEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
  if (!validPassword(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements (min 8 chars, uppercase, lowercase, number, special)' });
  // ensure email isn't already registered
  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const id = nanoid();
  const user = {
    id,
    name,
    email: email.toLowerCase(),
    passwordHash: hashed,
    isEmailVerified: true, // for simplicity mark verified; adapt if you want email flow
    points: 0,
    badges: []
  };
  await createUserInStore(user);
  return res.status(201).json({ message: 'User registered successfully' });
});

// Send verification code (start temp registration)
app.post('/api/auth/send-verification-code', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  if (!validEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  if (!validPassword(password)) return res.status(400).json({ message: 'Password does not meet complexity requirements' });

  // check user not already registered
  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const temp = { email: email.toLowerCase(), name, passwordHash: hashed, code, expiresAt, verified: false };
  await upsertTempRegistration(temp);

  const sent = await sendVerificationEmail(email, name, code);
  if (!sent) return res.status(500).json({ message: 'Failed to send verification email' });
  return res.status(200).json({ message: 'Verification code sent' });
});

// Verify code
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ message: 'Missing email or code' });
  const temp = await findTempByEmail(email);
  if (!temp) return res.status(404).json({ message: 'No pending registration' });
  if (temp.verified) return res.status(200).json({ message: 'Already verified' });
  if (temp.code !== code) return res.status(400).json({ message: 'Invalid code' });
  if (new Date(temp.expiresAt) < new Date()) return res.status(400).json({ message: 'Code expired' });
  temp.verified = true;
  await upsertTempRegistration(temp);
  return res.json({ message: 'Code verified' });
});

// Complete registration after code verified
app.post('/api/auth/complete-registration', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Missing email' });
  const temp = await findTempByEmail(email);
  if (!temp) return res.status(404).json({ message: 'No pending registration' });
  if (!temp.verified) return res.status(400).json({ message: 'Email not verified' });

  // create user
  const id = nanoid();
  const user = { id, name: temp.name, email: temp.email.toLowerCase(), passwordHash: temp.passwordHash, isEmailVerified: true, points: 0, badges: [] };
  await createUserInStore(user);
  await deleteTempByEmail(email);

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
  const expiresInSeconds = 60 * 60;
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, isEmailVerified: true, points: 0, badges: [] }, expiresIn: expiresInSeconds });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash || user.password_hash || '');
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  // normalized flag check supporting both file and DB field names
  const verified = typeof user.isEmailVerified !== 'undefined' ? user.isEmailVerified : (user.is_email_verified ? Boolean(user.is_email_verified) : true);
  if (!verified) return res.status(403).json({ message: 'Email not verified' });

  const token = jwt.sign({ sub: user.id || user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
  // calculate expiresIn numeric seconds if possible
  const expiresInSeconds = 60 * 60; // default 1h; token library may vary

  return res.json({
    token,
    user: {
      id: user.id || user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: verified,
      points: user.points || user.points || 0,
      badges: user.badges ? (Array.isArray(user.badges) ? user.badges : JSON.parse(user.badges)) : []
    },
    expiresIn: expiresInSeconds
  });
});

// Validate token
app.get('/api/auth/validate', (req, res) => {
  const auth = req.headers.authorization || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ valid: false });
  const token = match[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, decoded });
  } catch (e) {
    return res.status(401).json({ valid: false });
  }
});

// helper: list users (dev only)
app.get('/__internal/users', (req, res) => {
  const users = readUsers();
  const safe = users.map(u => ({ id: u.id, name: u.name, email: u.email, isEmailVerified: u.isEmailVerified }));
  res.json(safe);
});

app.listen(PORT, () => {
  console.log(`kl-smartq auth server listening on http://localhost:${PORT}/api`);
});
