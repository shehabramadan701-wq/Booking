import { Router } from 'express';
import { z } from 'zod';
import { markupFactor, provider } from '../providers/index.js';

const r = Router();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const csv = z.string().max(200).regex(/^[\w,-]*$/);
const int = (min, max) => z.coerce.number().int().min(min).max(max);

const searchSchema = z.object({
  dest: z.string().max(40).regex(/^[\w-]*$/), q: z.string().max(80),
  in: date, out: date, ad: int(1, 12), ch: int(0, 6), rm: int(1, 6),
  pmin: int(0, 100000), pmax: int(0, 100000), stars: csv, types: csv, am: csv,
  rating: z.coerce.number().min(0).max(10), meal: z.enum(['bb']), fc: z.literal('1'),
  dist: z.coerce.number().min(0).max(100),
  sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating', 'stars', 'distance']),
  page: int(1, 1000), size: int(1, 50),
}).partial().strict();

r.get('/hotels/search', async (req, res) => {
  const params = searchSchema.parse(req.query);
  res.set('Cache-Control', 'public, max-age=60');
  res.json(await provider.search(params, markupFactor));
});

r.get('/hotels/:id', async (req, res) => {
  const id = z.string().max(60).regex(/^[\w-]+$/).parse(req.params.id);
  const hotel = await provider.hotel(id);
  if (!hotel) return res.status(404).json({ error: 'not_found' });
  res.json(hotel);
});

r.get('/suggest', async (req, res) => {
  const { q } = z.object({ q: z.string().max(80).default('') }).parse(req.query);
  res.json(await provider.suggest(q));
});

export default r;
