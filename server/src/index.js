import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import { provider } from './providers/index.js';
import catalog from './routes/catalog.js';
import bookings from './routes/bookings.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // خلف Nginx / Cloudflare

// ——— طبقات الحماية ———
app.use(helmet()); // رؤوس أمان: HSTS, noSniff, frameguard...
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
  credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json({ limit: '20kb' })); // منع الحمولات الضخمة
app.use(hpp()); // منع تلويث باراميترات الـ query
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
// حد أشد على العمليات الحساسة (حجز/دفع/دخول)
const strict = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
app.use(['/api/bookings', '/api/auth'], strict);

app.get('/api/health', (req, res) => res.json({ ok: true, supplier: provider.name }));
app.use('/api', catalog);
app.use('/api', bookings);
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// معالج الأخطاء: لا نُرجع تفاصيل داخلية للعميل أبداً
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: 'validation', fields: err.issues.map((i) => i.path.join('.')) });
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(400).json({ error: 'bad_request' });
  const status = err.status && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'server_error' : err.message });
});

// Express 4 لا يلتقط أخطاء async تلقائياً — نغلّف المعالجات
for (const layer of [catalog, bookings].flatMap((r) => r.stack)) {
  for (const l of layer.route?.stack || []) {
    const fn = l.handle;
    l.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  }
}

app.listen(config.port, () => console.log(`API on http://localhost:${config.port} (supplier: ${provider.name})`));
