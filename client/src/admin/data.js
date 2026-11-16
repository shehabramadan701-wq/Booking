// بيانات تجريبية للوحة التحكم (حجوزات وعملاء) — تُستبدل بطلبات الـ API لاحقاً
import { DESTINATIONS, HOTELS } from '../data/catalog.js';
import { addDays, todayISO } from '../lib/search.js';

const CUSTOMERS = [
  ['أحمد المصري', 'EG'], ['نورة العتيبي', 'SA'], ['خالد الكندري', 'KW'], ['مريم الشامسي', 'AE'], ['يوسف بنعلي', 'MA'],
  ['Sarah Collins', 'GB'], ['عمر الخطيب', 'JO'], ['ليلى حداد', 'LB'], ['Thomas Müller', 'DE'], ['Elena García', 'ES'],
  ['فهد الدوسري', 'SA'], ['هدى آل ثاني', 'QA'], ['محمود عبدالله', 'EG'], ['ريم القحطاني', 'SA'], ['James Carter', 'US'],
  ['سلمان البلوشي', 'OM'], ['دانة العلي', 'BH'], ['Aiko Tanaka', 'JP'], ['طارق منصور', 'EG'], ['جود الحربي', 'SA'],
];
const METHODS = ['card', 'mada', 'knet', 'applepay', 'stcpay'];

function rng(seed) {
  let a = seed;
  return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; };
}

export function demoBookings(markup = 8) {
  const r = rng(42);
  const today = todayISO();
  return Array.from({ length: 96 }, (_, i) => {
    const h = HOTELS[Math.floor(r() * HOTELS.length)];
    const c = CUSTOMERS[Math.floor(r() * CUSTOMERS.length)];
    const daysAgo = Math.floor(r() * r() * 30);
    const nights = 1 + Math.floor(r() * 6);
    const rooms = r() < 0.85 ? 1 : 2;
    const checkIn = addDays(today, Math.floor(r() * 60) - 12);
    const net = h.minPrice * (1 + r() * 0.8) * nights * rooms;
    const roll = r();
    const status = roll < 0.08 ? 'cancelled' : roll < 0.12 ? 'pending' : roll < 0.15 ? 'refunded' : addDays(checkIn, nights) < today ? 'completed' : 'confirmed';
    return {
      ref: `NZ${(100000 + Math.floor(r() * 899999)).toString(36).toUpperCase()}${i}`,
      createdAt: addDays(today, -daysAgo), hotelId: h.id, destId: h.destId,
      guest: { name: c[0], country: c[1], email: `user${i}@example.com` },
      checkIn, nights, rooms, status, method: METHODS[Math.floor(r() * METHODS.length)],
      supplier: 'TBO', netUsd: Math.round(net), totalUsd: Math.round(net * (1 + markup / 100) * 1.12),
    };
  }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const isPaid = (b) => ['confirmed', 'completed'].includes(b.status);

export function kpis(list) {
  const paid = list.filter(isPaid);
  const revenue = paid.reduce((s, b) => s + b.totalUsd, 0);
  const net = paid.reduce((s, b) => s + b.netUsd, 0);
  return {
    revenue, count: list.length, paid: paid.length,
    profit: Math.round(revenue / 1.12 - net),
    avg: paid.length ? revenue / paid.length : 0,
    cancelRate: list.length ? (list.filter((b) => b.status === 'cancelled' || b.status === 'refunded').length / list.length) * 100 : 0,
  };
}

export function byDay(list, days = 14) {
  const today = todayISO();
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const items = list.filter((b) => b.createdAt.slice(0, 10) === day && isPaid(b));
    return { day, value: items.reduce((s, b) => s + b.totalUsd, 0), count: items.length };
  });
}

export function byDestination(list) {
  return DESTINATIONS.map((d) => {
    const items = list.filter((b) => b.destId === d.id && isPaid(b));
    return { id: d.id, ar: d.ar, en: d.en, value: items.reduce((s, b) => s + b.totalUsd, 0), count: items.length };
  }).sort((a, b) => b.value - a.value);
}
