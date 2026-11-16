// طبقة الـ API: الآن تقرأ من البيانات التجريبية محلياً.
// عند تشغيل الخادم ضع VITE_API_URL=http://localhost:4000/api وسيتحوّل البحث إليه تلقائياً
// بنفس شكل البيانات، فلا تتغير أي صفحة.
import { DESTINATIONS, HOTELS, hotelById } from '../data/catalog.js';
import { searchHotels, suggest } from '../lib/search.js';

const BASE = import.meta.env.VITE_API_URL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function remote(path, params) {
  const qs = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));
  const res = await fetch(`${BASE}${path}${qs.size ? `?${qs}` : ''}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// overrides: تعديلات لوحة التحكم على الفنادق (إيقاف/تمييز)
const withOverrides = (overrides = {}) =>
  HOTELS.map((h) => (overrides[h.id] ? { ...h, ...overrides[h.id] } : h));

export const api = {
  async search(params, { factor, overrides } = {}) {
    if (BASE) return remote('/hotels/search', params);
    await wait(180);
    return searchHotels({ hotels: withOverrides(overrides), destinations: DESTINATIONS }, params, factor);
  },
  async hotel(id) {
    if (BASE) return remote(`/hotels/${encodeURIComponent(id)}`);
    await wait(120);
    return hotelById[id] || null;
  },
  async suggest(q) {
    if (BASE) return remote('/suggest', { q });
    return suggest(q, { hotels: HOTELS, destinations: DESTINATIONS });
  },
};
