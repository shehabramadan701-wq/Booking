// منطق البحث والفلترة والترتيب — دوال خالصة تُستخدم في الواجهة وفي الخادم معاً.

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '') // التشكيل والتطويل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const list = (v) => (Array.isArray(v) ? v : v ? String(v).split(',').filter(Boolean) : []);
const num = (v, d = 0) => (Number.isFinite(+v) && v !== '' && v != null ? +v : d);

export function suggest(q, { hotels, destinations }, limit = 8) {
  const n = normalize(q);
  if (!n) return { destinations: destinations.slice(0, 6), hotels: [] };
  const ds = destinations.filter((d) => [d.ar, d.en, d.cAr, d.cEn].some((x) => normalize(x).includes(n)));
  const hs = hotels.filter((h) => normalize(h.name.ar).includes(n) || normalize(h.name.en).includes(n));
  return { destinations: ds.slice(0, 5), hotels: hs.slice(0, Math.max(0, limit - Math.min(ds.length, 5))) };
}

/**
 * params: dest, q, ad, ch, rm, pmin, pmax, stars, rating, types, am, meal, fc, dist, sort, page, size
 * factor(hotel) => معامل الربح (markup) الذي يُضرب في سعر المورّد
 */
export function searchHotels({ hotels, destinations }, params = {}, factor = () => 1) {
  const p = params;
  const guests = num(p.ad, 2) + num(p.ch, 0);
  const rooms = Math.max(1, num(p.rm, 1));
  const perRoom = Math.ceil(guests / rooms);
  const q = normalize(p.q);
  const dest = p.dest ? destinations.find((d) => d.id === p.dest) : null;

  const priced = (h) => Math.round(h.minPrice * factor(h));

  let base = hotels.filter((h) => {
    if (h.active === false) return false;
    if (dest && h.destId !== dest.id) return false;
    if (h.maxGuests < perRoom) return false;
    if (q && !dest) {
      const d = destinations.find((x) => x.id === h.destId);
      const hay = [h.name.ar, h.name.en, h.district.ar, h.district.en, d.ar, d.en, d.cAr, d.cEn].map(normalize);
      if (!hay.some((x) => x.includes(q))) return false;
    }
    return true;
  });

  const prices = base.map(priced);
  const bounds = { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };

  const count = (fn) => base.reduce((n, h) => n + (fn(h) ? 1 : 0), 0);
  const facets = {
    stars: Object.fromEntries([5, 4, 3, 2].map((s) => [s, count((h) => h.stars === s)])),
    types: {}, amenities: {},
    freeCancel: count((h) => h.freeCancel),
    breakfast: count((h) => h.breakfast),
  };
  base.forEach((h) => {
    facets.types[h.type] = (facets.types[h.type] || 0) + 1;
    h.amenities.forEach((a) => (facets.amenities[a] = (facets.amenities[a] || 0) + 1));
  });

  const stars = list(p.stars).map(Number);
  const types = list(p.types);
  const am = list(p.am);
  const pmin = num(p.pmin, 0);
  const pmax = num(p.pmax, Infinity);
  const rating = num(p.rating, 0);
  const dist = num(p.dist, Infinity);

  let items = base.filter((h) => {
    const price = priced(h);
    if (price < pmin || price > pmax) return false;
    if (stars.length && !stars.includes(h.stars)) return false;
    if (types.length && !types.includes(h.type)) return false;
    if (rating && h.rating < rating) return false;
    if (am.length && !am.every((a) => h.amenities.includes(a))) return false;
    if (p.fc && !h.freeCancel) return false;
    if (p.meal === 'bb' && !h.breakfast) return false;
    if (h.distanceKm > dist) return false;
    return true;
  });

  const score = (h) => h.rating * 10 + h.stars * 3 + (h.featured ? 8 : 0) + h.deal / 2 + Math.log10(h.reviewsCount);
  const sorters = {
    recommended: (a, b) => score(b) - score(a),
    price_asc: (a, b) => priced(a) - priced(b),
    price_desc: (a, b) => priced(b) - priced(a),
    rating: (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount,
    stars: (a, b) => b.stars - a.stars || b.rating - a.rating,
    distance: (a, b) => a.distanceKm - b.distanceKm,
  };
  items = [...items].sort(sorters[p.sort] || sorters.recommended);

  const size = Math.min(50, Math.max(1, num(p.size, 10)));
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(pages, Math.max(1, num(p.page, 1)));
  return {
    total: items.length, baseTotal: base.length, page, pages, size, bounds, facets, dest,
    items: items.slice((page - 1) * size, page * size),
  };
}

// ——— التواريخ ———
const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayISO = () => toISO(new Date());
export const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const nightsBetween = (a, b) => Math.max(1, Math.round((fromISO(b) - fromISO(a)) / 86400000));
export const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(fromISO(s).getTime());

/** يضمن تواريخ صالحة: الوصول ≥ اليوم، والمغادرة بعد الوصول */
export function safeDates(ci, co) {
  const t = todayISO();
  let a = isISO(ci) && ci >= t ? ci : addDays(t, 14);
  let b = isISO(co) && co > a ? co : addDays(a, 3);
  if (nightsBetween(a, b) > 30) b = addDays(a, 30);
  return { checkIn: a, checkOut: b, nights: nightsBetween(a, b) };
}

// ——— التسعير ———
// أسعار صرف تجريبية (الأساس دولار) — يستخدمها الخادم لتحويل مبلغ الفاتورة
export const RATES = { USD: 1, SAR: 3.75, AED: 3.6725, KWD: 0.307, EGP: 50.2, EUR: 0.92, GBP: 0.79 };
export const TAX_RATE = 0.12; // ضرائب ورسوم تقديرية

export function quote({ nightly, nights, rooms, factor = 1, promoPct = 0 }) {
  const perNight = Math.round(nightly * factor);
  const subtotal = perNight * nights * rooms;
  const discount = Math.round((subtotal * promoPct) / 100);
  const taxes = Math.round((subtotal - discount) * TAX_RATE);
  return { perNight, subtotal, discount, taxes, total: subtotal - discount + taxes };
}
