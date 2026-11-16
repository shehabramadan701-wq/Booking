-- مخطط قاعدة البيانات (PostgreSQL 15+) — المرحلة القادمة
-- ملاحظة: أسعار وتوافر الفنادق لا تُخزَّن هنا؛ تأتي حيّة من المورّد وتُخزَّن مؤقتاً في Redis.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE NOT NULL,
  password_hash text NOT NULL,                    -- argon2id فقط، لا نص صريح أبداً
  full_name     text NOT NULL,
  phone         text,
  country       char(2),
  role          text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','agent','support','admin')),
  locale        text NOT NULL DEFAULT 'ar',
  email_verified_at timestamptz,
  mfa_secret    text,                             -- إلزامي لحسابات الإدارة
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,                       -- نخزّن الهاش لا التوكن
  user_agent text, ip inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

-- محتوى ثابت يُستورد من المورّد ويُحدَّث دورياً (أسماء، صور، مرافق) لتسريع البحث والـ SEO
CREATE TABLE destinations (
  id text PRIMARY KEY, name_ar text NOT NULL, name_en text NOT NULL,
  country_code char(2) NOT NULL, supplier_city_code text, image_url text, is_featured boolean DEFAULT false
);
CREATE TABLE hotels (
  id               bigserial PRIMARY KEY,
  supplier         text NOT NULL DEFAULT 'tbo',
  supplier_code    text NOT NULL,
  destination_id   text NOT NULL REFERENCES destinations(id),
  name_ar text, name_en text NOT NULL,
  stars smallint, type text, address text, lat double precision, lng double precision,
  amenities text[] NOT NULL DEFAULT '{}', images jsonb NOT NULL DEFAULT '[]',
  rating numeric(3,1), reviews_count int DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, is_featured boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier, supplier_code)
);
CREATE INDEX hotels_destination_idx ON hotels (destination_id) WHERE is_active;

CREATE TABLE markup_rules (
  id serial PRIMARY KEY,
  scope text NOT NULL CHECK (scope IN ('global','destination','hotel')),
  scope_id text, pct numeric(5,2) NOT NULL CHECK (pct BETWEEN 0 AND 100),
  UNIQUE (scope, scope_id)
);

CREATE TABLE promo_codes (
  code text PRIMARY KEY, pct numeric(5,2) NOT NULL CHECK (pct BETWEEN 1 AND 50),
  max_uses int, uses int NOT NULL DEFAULT 0, starts_at timestamptz, ends_at timestamptz, is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref           text UNIQUE NOT NULL,
  user_id       uuid REFERENCES users(id),        -- NULL = حجز كضيف
  hotel_id      bigint NOT NULL REFERENCES hotels(id),
  supplier      text NOT NULL, supplier_ref text, -- رقم التأكيد عند المورّد
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','refunded','failed')),
  check_in date NOT NULL, check_out date NOT NULL CHECK (check_out > check_in),
  rooms smallint NOT NULL, adults smallint NOT NULL, children smallint NOT NULL DEFAULT 0,
  room_name text NOT NULL, meal text NOT NULL, refundable boolean NOT NULL, cancel_deadline timestamptz,
  guest_name text NOT NULL, guest_email citext NOT NULL, guest_phone text NOT NULL, guest_country char(2),
  notes text,
  net_amount numeric(12,2) NOT NULL,              -- تكلفة المورّد
  sell_amount numeric(12,2) NOT NULL,             -- ما دفعه العميل
  currency char(3) NOT NULL, fx_rate numeric(14,6) NOT NULL DEFAULT 1,
  promo_code text REFERENCES promo_codes(code),
  supplier_payload jsonb,                         -- الرد الخام للمراجعة والنزاعات
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_user_idx ON bookings (user_id, created_at DESC);
CREATE INDEX bookings_status_idx ON bookings (status, created_at DESC);

CREATE TABLE payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings(id),
  gateway     text NOT NULL DEFAULT 'myfatoorah',
  invoice_id  text UNIQUE,                        -- يمنع معالجة نفس الفاتورة مرتين (idempotency)
  method      text, status text NOT NULL CHECK (status IN ('initiated','paid','failed','refunded')),
  amount numeric(12,2) NOT NULL, currency char(3) NOT NULL,
  raw jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE favorites (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE, hotel_id bigint REFERENCES hotels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hotel_id)
);

-- سجل تدقيق لكل إجراء إداري (من غيّر السعر/الحالة ومتى)
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY, actor_id uuid REFERENCES users(id), action text NOT NULL,
  entity text NOT NULL, entity_id text, diff jsonb, ip inet, created_at timestamptz NOT NULL DEFAULT now()
);
