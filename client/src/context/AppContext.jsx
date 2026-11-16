import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// أسعار صرف تجريبية (الأساس دولار) — تُجلب لاحقاً من الخادم
export const CURRENCIES = {
  SAR: { rate: 3.75, ar: 'ريال سعودي', en: 'Saudi Riyal' },
  USD: { rate: 1, ar: 'دولار أمريكي', en: 'US Dollar' },
  AED: { rate: 3.6725, ar: 'درهم إماراتي', en: 'UAE Dirham' },
  KWD: { rate: 0.307, ar: 'دينار كويتي', en: 'Kuwaiti Dinar' },
  EGP: { rate: 50.2, ar: 'جنيه مصري', en: 'Egyptian Pound' },
  EUR: { rate: 0.92, ar: 'يورو', en: 'Euro' },
  GBP: { rate: 0.79, ar: 'جنيه إسترليني', en: 'Pound Sterling' },
};

export const DEFAULT_ADMIN = {
  markupGlobal: 8, // % فوق سعر المورّد
  markupByDest: {},
  hotel: {}, // { [hotelId]: { active:false, featured:true } }
  bookingStatus: {}, // تعديلات حالة الحجوزات
  promos: [
    { code: 'NUZUL10', pct: 10, active: true, uses: 124 },
    { code: 'WELCOME5', pct: 5, active: true, uses: 310 },
    { code: 'SUMMER15', pct: 15, active: false, uses: 58 },
  ],
  suppliers: { tbo: true, direct: false },
  gateways: { myfatoorah: true },
};

const read = (k, d) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; }
};
function usePersist(key, initial) {
  const [v, setV] = useState(() => read(key, initial));
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* التخزين غير متاح */ } }, [key, v]);
  return [v, setV];
}

export function AppProvider({ children }) {
  const [lang, setLang] = usePersist('nz.lang', 'ar');
  const [currency, setCurrency] = usePersist('nz.cur', 'SAR');
  const [user, setUser] = usePersist('nz.user', null);
  const [favorites, setFavorites] = usePersist('nz.fav', []);
  const [bookings, setBookings] = usePersist('nz.bookings', []);
  const [adminRaw, setAdmin] = usePersist('nz.admin', DEFAULT_ADMIN);
  const admin = useMemo(() => ({ ...DEFAULT_ADMIN, ...adminRaw }), [adminRaw]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const tx = useCallback((ar, en) => (lang === 'ar' ? ar : en ?? ar), [lang]);
  const L = useCallback((o) => (o ? o[lang] ?? o.ar : ''), [lang]);
  const locale = lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';

  const money = useCallback((usd, cur = currency) => {
    const c = CURRENCIES[cur] ? cur : 'USD';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: c, maximumFractionDigits: c === 'KWD' ? 1 : 0 })
      .format(usd * CURRENCIES[c].rate);
  }, [currency, locale]);

  const fmtDate = useCallback((iso, opts = { day: 'numeric', month: 'short' }) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, opts).format(new Date(y, m - 1, d));
  }, [locale]);

  const factor = useCallback(
    (h) => 1 + (admin.markupByDest[h.destId] ?? admin.markupGlobal) / 100,
    [admin.markupByDest, admin.markupGlobal],
  );

  const value = useMemo(() => ({
    lang, setLang, tx, L, locale, currency, setCurrency, money, fmtDate, factor,
    user,
    login: (u) => setUser(u),
    logout: () => setUser(null),
    favorites,
    toggleFav: (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    bookings,
    addBooking: (b) => setBookings((bs) => [b, ...bs]),
    cancelBooking: (ref) => setBookings((bs) => bs.map((b) => (b.ref === ref ? { ...b, status: 'cancelled' } : b))),
    admin, setAdmin,
  }), [lang, tx, L, locale, currency, money, fmtDate, factor, user, favorites, bookings, admin, setLang, setCurrency, setUser, setFavorites, setBookings, setAdmin]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
