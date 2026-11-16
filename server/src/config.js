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
  myfatoorah: { baseUrl: env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com', apiKey: env.MYFATOORAH_API_KEY },
};
