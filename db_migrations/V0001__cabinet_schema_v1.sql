
CREATE TABLE IF NOT EXISTS cabinet_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  inn TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  kpp TEXT NOT NULL DEFAULT '',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cabinet_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cabinet_users(id),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS cabinet_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cabinet_users(id),
  order_num TEXT NOT NULL,
  service TEXT NOT NULL,
  country TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  manager TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cabinet_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cabinet_users(id),
  order_id INTEGER REFERENCES cabinet_orders(id),
  name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'PDF',
  file_size TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cabinet_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cabinet_users(id),
  from_name TEXT NOT NULL,
  from_role TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_from_user BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, is_verified)
VALUES (
  'demo@vedagent.ru',
  '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
  'Иванов Александр',
  'ООО «ТестКомпания»',
  '7714123456',
  '+7 (999) 123-45-67',
  TRUE
) ON CONFLICT (email) DO NOTHING;
