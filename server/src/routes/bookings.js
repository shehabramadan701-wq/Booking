import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { nightsBetween, quote } from '../../../client/src/lib/search.js';
import { markupFactor, provider } from '../providers/index.js';
import { myfatoorah } from '../services/myfatoorah.js';

// تخزين مؤقت في الذاكرة لحين ربط PostgreSQL (انظر db/schema.sql) — يُستبدل بـ repository
const store = new Map();

const r = Router();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const bookingSchema = z.object({
  hotelId: z.string().max(60).regex(/^[\w-]+$/), roomId: z.string().max(20), rateId: z.string().max(20),
  checkIn: date, checkOut: date,
  adults: z.number().int().min(1).max(12), children: z.number().int().min(0).max(6), rooms: z.number().int().min(1).max(6),
  guest: z.object({
    name: z.string().trim().min(3).max(80), email: z.string().email().max(120),
    phone: z.string().regex(/^\+?[0-9\s-]{8,16}$/), country: z.string().max(5),
  }),
  notes: z.string().max(300).optional(),
  currency: z.enum(['USD', 'SAR', 'AED', 'KWD', 'EGP', 'EUR', 'GBP']).default('USD'),
}).strict().refine((b) => b.checkOut > b.checkIn && b.checkIn >= new Date().toISOString().slice(0, 10), { message: 'invalid_dates' });

// إنشاء حجز بانتظار الدفع — السعر يُحسب هنا من المورّد وليس من الطلب
r.post('/bookings', async (req, res) => {
  const b = bookingSchema.parse(req.body);
  const rate = await provider.priceCheck(b);
  if (!rate) return res.status(409).json({ error: 'rate_unavailable' });
  const nights = nightsBetween(b.checkIn, b.checkOut);
  const price = quote({ nightly: rate.netNightly, nights, rooms: b.rooms, factor: markupFactor() });
  const ref = `NZ${randomBytes(5).toString('hex').toUpperCase()}`;
  const booking = { ref, status: 'pending', createdAt: new Date().toISOString(), ...b, nights, totalUsd: price.total, netUsd: rate.netNightly * nights * b.rooms };

  let paymentUrl = null;
  if (myfatoorah.enabled()) {
    const inv = await myfatoorah.createInvoice({ ref, amount: price.total, currency: 'USD', customer: b.guest });
    booking.invoiceId = inv.invoiceId;
    paymentUrl = inv.paymentUrl;
  }
  store.set(ref, booking);
  res.status(201).json({ ref, status: booking.status, total: price, paymentUrl });
});

// يُستدعى بعد عودة العميل من صفحة الدفع (أو من الـ webhook): نتحقق من MyFatoorah مباشرة ثم نؤكد عند المورّد
r.post('/bookings/:ref/confirm', async (req, res) => {
  const booking = store.get(String(req.params.ref));
  if (!booking) return res.status(404).json({ error: 'not_found' });
  if (booking.status === 'pending') {
    if (!booking.invoiceId) return res.status(503).json({ error: 'payment_gateway_not_configured' });
    if (await myfatoorah.isPaid(booking.invoiceId, booking.totalUsd)) booking.status = 'confirmed'; // + provider.book(...)
  }
  res.json({ ref: booking.ref, status: booking.status });
});

export default r;
