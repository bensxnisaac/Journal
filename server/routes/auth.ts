import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, refreshTokens } from '../db/schema.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

const ACCESS_TTL   = '15m';
const REFRESH_TTL  = '30d';
const REFRESH_MS   = 30 * 24 * 60 * 60 * 1000;
const isProd       = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  maxAge: REFRESH_MS,
  path: '/',
};

function signAccess(user: { id: number; email: string; username: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(user: { id: number }) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TTL }
  );
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: 'Email, username and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
    }).returning();

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);
    const expiresAt    = new Date(Date.now() + REFRESH_MS);

    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt });

    res.cookie('rt', refreshToken, COOKIE_OPTS);
    return res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);
    const expiresAt    = new Date(Date.now() + REFRESH_MS);

    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt });

    res.cookie('rt', refreshToken, COOKIE_OPTS);
    return res.json({
      accessToken,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.rt;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: number };
    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, refreshToken));

    if (!stored || stored.expiresAt < new Date())
      return res.status(401).json({ error: 'Invalid refresh token' });

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) return res.status(401).json({ error: 'User not found' });

    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    const newRefresh = signRefresh(user);
    const newAccess  = signAccess(user);
    const expiresAt  = new Date(Date.now() + REFRESH_MS);
    await db.insert(refreshTokens).values({ userId: user.id, token: newRefresh, expiresAt });

    res.cookie('rt', newRefresh, COOKIE_OPTS);
    return res.json({ accessToken: newAccess });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.rt;
  if (refreshToken) await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
  res.clearCookie('rt', { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const [user] = await db.select({
    id: users.id, email: users.email, username: users.username, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, (req as AuthRequest).userId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

export default router;
