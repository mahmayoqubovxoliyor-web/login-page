import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const store = getStore('login-users');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function userKey(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
}

async function getUser(email) {
  return store.get(`user:${userKey(email)}`, { type: 'json' });
}

async function saveUser(email, user, onlyIfNew = false) {
  return store.setJSON(`user:${userKey(email)}`, user, onlyIfNew ? { onlyIfNew: true } : undefined);
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function signup({ email, password }) {
  email = String(email || '').trim();
  if (!EMAIL_RE.test(email)) return json({ message: 'Enter a valid email address.' }, 400);
  if (!password || password.length < 8) return json({ message: 'Password must be at least 8 characters.' }, 400);

  const existing = await getUser(email);
  if (existing) return json({ message: 'An account with this email already exists.' }, 409);

  try {
    const result = await saveUser(email, {
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    }, true);
    if (result && result.modified === false) {
      return json({ message: 'An account with this email already exists.' }, 409);
    }
  } catch (e) {
    // A conditional write can fail when another signup wins the race.
    const nowExisting = await getUser(email);
    if (nowExisting) return json({ message: 'An account with this email already exists.' }, 409);
    throw e;
  }

  return json({ email }, 201);
}

export async function login({ email, password }) {
  email = String(email || '').trim();
  if (!email || !password) return json({ message: 'Email and password are required.' }, 400);

  const masterEmail = String(NetlifyEnv('MASTER_EMAIL') || '').trim();
  const masterPassword = NetlifyEnv('MASTER_PASSWORD');
  if (masterEmail && masterPassword && email.toLowerCase() === masterEmail.toLowerCase() && password === masterPassword) {
    return json({ email: masterEmail });
  }

  const user = await getUser(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json({ message: 'Invalid email or password.' }, 401);
  }
  return json({ email: user.email });
}

export async function changePassword({ email, oldPassword, newPassword }) {
  email = String(email || '').trim();
  if (!email || !oldPassword || !newPassword) return json({ message: 'Missing fields.' }, 400);
  if (newPassword.length < 8) return json({ message: 'New password must be at least 8 characters.' }, 400);
  if (newPassword === oldPassword) return json({ message: 'New password must be different from the old one.' }, 400);

  const masterEmail = String(NetlifyEnv('MASTER_EMAIL') || '').trim();
  const masterPassword = NetlifyEnv('MASTER_PASSWORD');
  const isMaster = masterEmail && masterPassword && email.toLowerCase() === masterEmail.toLowerCase() && oldPassword === masterPassword;

  const user = await getUser(email);
  if (isMaster) {
    if (user) {
      user.passwordHash = hashPassword(newPassword);
      await saveUser(email, user);
    }
    return json({ email: masterEmail });
  }

  if (!user || !verifyPassword(oldPassword, user.passwordHash)) {
    return json({ message: 'Current password is incorrect.' }, 401);
  }
  user.passwordHash = hashPassword(newPassword);
  await saveUser(email, user);
  return json({ email: user.email });
}

function NetlifyEnv(name) {
  return process.env[name];
}
