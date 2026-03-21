import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { tags, dailyNotes } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── TAGS ──────────────────────────────────────────────────────────────────────
router.get('/tags', (req, res) => {
  const rows = db.select().from(tags).where(eq(tags.userId, req.userId)).all();
  res.json({ tags: rows });
});

router.post('/tags', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name required' });
  const [tag] = db.insert(tags).values({ userId: req.userId, name, color }).returning().all();
  res.status(201).json({ tag });
});

router.delete('/tags/:id', (req, res) => {
  db.delete(tags).where(and(eq(tags.id, Number(req.params.id)), eq(tags.userId, req.userId))).run();
  res.json({ ok: true });
});

// ── DAILY NOTES ───────────────────────────────────────────────────────────────
router.get('/notes', (req, res) => {
  const rows = db.select().from(dailyNotes)
    .where(eq(dailyNotes.userId, req.userId)).all();
  res.json({ notes: rows });
});

router.get('/notes/:date', (req, res) => {
  const note = db.select().from(dailyNotes)
    .where(and(eq(dailyNotes.userId, req.userId), eq(dailyNotes.noteDate, req.params.date)))
    .get();
  res.json({ note: note || null });
});

router.put('/notes/:date', (req, res) => {
  const { content, marketBias } = req.body;
  const existing = db.select().from(dailyNotes)
    .where(and(eq(dailyNotes.userId, req.userId), eq(dailyNotes.noteDate, req.params.date)))
    .get();

  if (existing) {
    const [updated] = db.update(dailyNotes)
      .set({ content, marketBias })
      .where(and(eq(dailyNotes.userId, req.userId), eq(dailyNotes.noteDate, req.params.date)))
      .returning().all();
    return res.json({ note: updated });
  }

  const [created] = db.insert(dailyNotes)
    .values({ userId: req.userId, noteDate: req.params.date, content, marketBias })
    .returning().all();
  res.status(201).json({ note: created });
});

export default router;
