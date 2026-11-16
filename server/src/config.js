import 'dotenv/config';

const env = process.env;
export const config = {
  env: env.NODE_ENV || 'development',
  port: Number(env.PORT) || 4000,
  corsOrigins: (env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173').split(',').map((s) => s.trim()),
  siteUrl: env.PUBLIC_SITE_URL || 'http://localhost:5173',
  supplier: env.SUPPLIER || 'mock',
  markupPct: Number(env.DEFAULT_MARKUP_PCT ?? 8),
  tbo: { baseUrl: env.TBO_BASE_URL, username: env.TBO_USERNAME, password: env.TBO_PASSWORD },
  // مفتاح لوحة التحكم (16 حرفاً على الأقل) وأكواد الخصم بصيغة CODE:نسبة
  adminApiKey: (env.ADMIN_API_KEY || '').length >= 16 ? env.ADMIN_API_KEY : '',
  promos: Object.fromEntries((env.PROMO_CODES || '').split(',').filter(Boolean).map((x) => { const [c, p] = x.split(':'); return [c.trim().toUpperCase(), Math.min(50, Number(p) || 0)]; })),
  myfatoorah: { baseUrl: env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com', apiKey: env.MYFATOORAH_API_KEY },
};
