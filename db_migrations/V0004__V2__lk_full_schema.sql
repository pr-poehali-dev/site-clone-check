ALTER TABLE cabinet_users ADD COLUMN IF NOT EXISTS lk_role TEXT DEFAULT 'CLIENT';

CREATE TABLE IF NOT EXISTS lk_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  inn TEXT,
  kpp TEXT,
  address TEXT,
  requisites JSONB DEFAULT '{}',
  nonresident_payment_enabled BOOLEAN DEFAULT FALSE,
  nonresident_details JSONB DEFAULT '{}',
  owner_user_id INTEGER REFERENCES cabinet_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lk_org_memberships (
  user_id INTEGER REFERENCES cabinet_users(id),
  org_id UUID REFERENCES lk_organizations(id),
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

CREATE TABLE IF NOT EXISTS lk_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inn TEXT,
  kpp TEXT,
  address TEXT,
  contacts JSONB DEFAULT '{}',
  requisites JSONB DEFAULT '{}',
  client_owner_user_id INTEGER REFERENCES cabinet_users(id),
  org_id UUID REFERENCES lk_organizations(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lk_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES lk_companies(id),
  created_by_user_id INTEGER REFERENCES cabinet_users(id),
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  invoice_number TEXT,
  invoice_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  selected_offer_id UUID,
  offers_until TIMESTAMP WITH TIME ZONE,
  payment_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lk_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES lk_requests(id),
  org_id UUID REFERENCES lk_organizations(id),
  created_by_user_id INTEGER REFERENCES cabinet_users(id),
  percent_fee NUMERIC(6,3) NOT NULL,
  fx_rate NUMERIC(18,6),
  duration_workdays INTEGER NOT NULL,
  pay_from_country TEXT,
  use_nonresident_route BOOLEAN DEFAULT FALSE,
  nonresident_requisites_snapshot JSONB DEFAULT '{}',
  agent_contract_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  valid_until TIMESTAMP WITH TIME ZONE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lk_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id INTEGER REFERENCES cabinet_users(id),
  org_id UUID REFERENCES lk_organizations(id),
  request_id UUID REFERENCES lk_requests(id),
  offer_id UUID REFERENCES lk_offers(id),
  type TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT,
  size BIGINT,
  storage_key TEXT UNIQUE,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lk_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES lk_requests(id),
  offer_id UUID REFERENCES lk_offers(id),
  contract_file_url TEXT,
  requisites_snapshot JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lk_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES cabinet_users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lk_requests_user ON lk_requests(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_lk_requests_status ON lk_requests(status);
CREATE INDEX IF NOT EXISTS idx_lk_offers_request ON lk_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_lk_offers_org ON lk_offers(org_id);
CREATE INDEX IF NOT EXISTS idx_lk_notifications_user ON lk_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lk_companies_owner ON lk_companies(client_owner_user_id);
