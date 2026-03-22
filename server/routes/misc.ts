import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { tags, dailyNotes } from '../db/schema.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── TAGS ──────────────────────────────────────────────────────────────────────
router.get('/tags', async (req: Request, res: Response) => {
  const rows = await db.select().from(tags).where(eq(tags.userId, (req as AuthRequest).userId));
  return res.json({ tags: rows });
});

router.post('/tags', async (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name required' });
  const [tag] = await db.insert(tags).values({ userId: (req as AuthRequest).userId, name, color }).returning();
  return res.status(201).json({ tag });
});

router.delete('/tags/:id', async (req: Request, res: Response) => {
  await db.delete(tags).where(and(eq(tags.id, Number(req.params.id)), eq(tags.userId, (req as AuthRequest).userId)));
  return res.json({ ok: true });
});

// ── DAILY NOTES ───────────────────────────────────────────────────────────────
router.get('/notes', async (req: Request, res: Response) => {
  const rows = await db.select().from(dailyNotes).where(eq(dailyNotes.userId, (req as AuthRequest).userId));
  return res.json({ notes: rows });
});

router.get('/notes/:date', async (req: Request, res: Response) => {
  const date = String(req.params.date);
  const [note] = await db.select().from(dailyNotes)
    .where(and(eq(dailyNotes.userId, (req as AuthRequest).userId), eq(dailyNotes.noteDate, date)));
  return res.json({ note: note || null });
});

router.put('/notes/:date', async (req: Request, res: Response) => {
  const date = String(req.params.date);
  const { content, marketBias } = req.body as { content: string; marketBias: string };
  const userId = (req as AuthRequest).userId;
  const [existing] = await db.select().from(dailyNotes)
    .where(and(eq(dailyNotes.userId, userId), eq(dailyNotes.noteDate, date)));

  if (existing) {
    const [updated] = await db.update(dailyNotes)
      .set({ content, marketBias })
      .where(and(eq(dailyNotes.userId, userId), eq(dailyNotes.noteDate, date)))
      .returning();
    return res.json({ note: updated });
  }

  const [created] = await db.insert(dailyNotes)
    .values({ userId, noteDate: date, content, marketBias })
    .returning();
  return res.status(201).json({ note: created });
});

export default router;
