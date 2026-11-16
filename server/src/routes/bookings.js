import { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { nightsBetween, quote, RATES } from '../../../client/src/lib/search.js';
import { config } from '../config.js';
import { markupFactor, provider } from '../providers/index.js';
import { myfatoorah } from '../services/myfatoorah.js';
import { bookingStore } from '../store.js';

const r = Router();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const refSchema = z.string().regex(/^NZ[0-9A-F]{10}$/);
const bookingSchema = z.object({
  hotelId: z.string().max(60).regex(/^[\w-]+$/), roomId: z.string().max(20), rateId: z.string().max(20),
  checkIn: date, checkOut: date,
  adults: z.number().int().min(1).max(12), children: z.number().int().min(0).max(6), rooms: z.number().int().min(1).max(6),
  guest: z.object({
    name: z.string().trim().min(3).max(80), email: z.string().email().max(120),
    phone: z.string().regex(/^\+?[0-9\s-]{8,16}$/), country: z.string().max(5),
  }).strict(),
  notes: z.string().max(300).optional(),
  promo: z.string().max(20).regex(/^[A-Za-z0-9]*$/).optional(),
  method: z.string().max(20).regex(/^[a-z]*$/).optional(),
  lang: z.enum(['ar', 'en']).default('ar'),
  currency: z.enum(['USD', 'SAR', 'AED', 'KWD', 'EGP', 'EUR', 'GBP']).default('USD'),
}).strict().refine((b) => b.checkOut > b.checkIn && b.checkIn >= new Date().toISOString().slice(0, 10), { message: 'invalid_dates' });

// ما يُعاد للعميل: لا نكشف تكلفة المورّد ولا رقم الفاتورة
const publicView = ({ netUsd, invoiceId, ...b }) => b;

// إنشاء حجز بانتظار الدفع — السعر يُحسب هنا من المورّد وليس من الطلب
r.post('/bookings', async (req, res) => {
  const { lang, promo, ...b } = bookingSchema.parse(req.body);
  const rate = await provider.priceCheck(b);
  if (!rate) return res.status(409).json({ error: 'rate_unavailable' });
  const nights = nightsBetween(b.checkIn, b.checkOut);
  const code = (promo || '').toUpperCase();
  const promoPct = config.promos[code] || 0;
  const price = quote({ nightly: rate.netNightly, nights, rooms: b.rooms, factor: markupFactor(), promoPct });
  const ref = `NZ${randomBytes(5).toString('hex').toUpperCase()}`;
  const booking = {
    ref, status: 'pending', createdAt: new Date().toISOString(), ...b, nights,
    meal: rate.meal, refundable: rate.refundable, promo: promoPct ? code : null,
    totalUsd: price.total, netUsd: rate.netNightly * nights * b.rooms,
  };

  let paymentUrl = null;
  if (myfatoorah.enabled()) {
    const decimals = b.currency === 'KWD' ? 3 : 2;
    const amount = Number((price.total * RATES[b.currency]).toFixed(decimals));
    const inv = await myfatoorah.createInvoice({ ref, amount, currency: b.currency, customer: b.guest, lang });
    booking.invoiceId = inv.invoiceId;
    paymentUrl = inv.paymentUrl;
  }
  bookingStore.set(ref, booking);
  res.status(201).json({ ref, status: booking.status, total: price, paymentUrl });
});

r.get('/bookings/:ref', async (req, res) => {
  const booking = bookingStore.get(refSchema.parse(req.params.ref));
  if (!booking) return res.status(404).json({ error: 'not_found' });
  res.json(publicView(booking));
});

// يُستدعى بعد عودة العميل من صفحة الدفع: نسأل MyFatoorah مباشرة عن فاتورتنا المخزّنة (لا نثق بأي قيمة من المتصفح)
r.post('/bookings/:ref/confirm', async (req, res) => {
  const booking = bookingStore.get(refSchema.parse(req.params.ref));
  if (!booking) return res.status(404).json({ error: 'not_found' });
  if (booking.status === 'pending') {
    if (!booking.invoiceId) return res.status(503).json({ error: 'payment_gateway_not_configured' });
    if (await myfatoorah.isPaid(booking.invoiceId, booking.ref)) {
      booking.status = 'confirmed'; // + provider.book(...) عند ربط TBO
      booking.paidAt = new Date().toISOString();
      bookingStore.set(booking.ref, booking);
    }
  }
  res.json(publicView(booking));
});

// ——— الإدارة: محمية بمفتاح سري من .env لحين اكتمال نظام الحسابات والصلاحيات ———
function requireAdmin(req, res, next) {
  const key = config.adminApiKey;
  if (!key) return res.status(503).json({ error: 'admin_api_not_configured' });
  const given = Buffer.from((req.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  const expected = Buffer.from(key);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return res.status(401).json({ error: 'unauthorized' });
  next();
}
r.get('/admin/bookings', requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(bookingStore.all().map(({ invoiceId, ...b }) => b));
});

export default r;
