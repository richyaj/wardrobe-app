import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../db/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query('SELECT data FROM schedules WHERE user_id=$1', [req.user.id]);
  res.json(rows[0]?.data || null);
});

router.post('/generate', auth, async (req, res) => {
  const { rows: items } = await pool.query(
    'SELECT * FROM wardrobe_items WHERE user_id=$1 ORDER BY created_at',
    [req.user.id]
  );
  const tops = items.filter(i => i.type !== 'bottom');
  const bottoms = items.filter(i => i.type === 'bottom');

  if (tops.length < 5) return res.status(400).json({ error: 'Add at least 5 tops to generate a schedule' });
  if (bottoms.length < 1) return res.status(400).json({ error: 'Add at least 1 bottom to generate a schedule' });

  const topsList = tops.map(t => `ID:${t.id} | ${t.name} | type:${t.type} | color:${t.color || 'unspecified'}`).join('\n');
  const bottomsList = bottoms.map(b => `ID:${b.id} | ${b.name} | color:${b.color || 'unspecified'}`).join('\n');
  const numWeeks = Math.ceil(tops.length / 5) * 2;

  const prompt = `You are a wardrobe organizer. Create an office outfit schedule following these rules:
1. Office days: Monday to Friday (5 days per week)
2. Each top is worn TWICE — first wear in week N, second wear in week N+2 (always skip one week between the two wears of the same top)
3. Pair each top with a suitable bottom based on color and formality
4. Cover exactly ${numWeeks} weeks so all ${tops.length} tops appear exactly twice
5. Distribute tops evenly — 5 per week

TOPS:
${topsList}

BOTTOMS:
${bottomsList}

Return ONLY a valid JSON array, no markdown fences, no explanation:
[
  {
    "weekNum": 1,
    "days": [
      {"day":"Mon","topId":"...","bottomId":"..."},
      {"day":"Tue","topId":"...","bottomId":"..."},
      {"day":"Wed","topId":"...","bottomId":"..."},
      {"day":"Thu","topId":"...","bottomId":"..."},
      {"day":"Fri","topId":"...","bottomId":"..."}
    ]
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = message.content[0].text.replace(/```json|```/g, '').trim();
  const data = JSON.parse(text);

  await pool.query(
    `INSERT INTO schedules (user_id, data) VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET data=$2, generated_at=NOW()`,
    [req.user.id, JSON.stringify(data)]
  );

  res.json(data);
});

export default router;
