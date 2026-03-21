import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, refreshTokens } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '30d';

function signAccess(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: 'Email, username and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = db.select().from(users)
      .where(eq(users.email, email.toLowerCase())).get();
    if (existing)
      return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = db.insert(users).values({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
    }).returning().all();

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt }).run();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = db.select().from(users)
      .where(eq(users.email, email.toLowerCase())).get();
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt }).run();

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored = db.select().from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken)).get();

    if (!stored || new Date(stored.expiresAt) < new Date())
      return res.status(401).json({ error: 'Invalid refresh token' });

    const user = db.select().from(users)
      .where(eq(users.id, payload.userId)).get();
    if (!user)
      return res.status(401).json({ error: 'User not found' });

    // Rotate refresh token
    db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken)).run();
    const newRefresh = signRefresh(user);
    const newAccess  = signAccess(user);
    const expiresAt  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.insert(refreshTokens).values({ userId: user.id, token: newRefresh, expiresAt }).run();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── LOGOUT ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken)
    db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken)).run();
  res.json({ ok: true });
});

// ── ME ────────────────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.select({
    id: users.id, email: users.email, username: users.username, createdAt: users.createdAt
  }).from(users).where(eq(users.id, req.userId)).get();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;
