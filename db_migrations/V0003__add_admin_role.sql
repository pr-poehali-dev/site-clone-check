ALTER TABLE cabinet_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, is_verified, is_active, is_admin)
VALUES (
  'admin@vedagent.ru',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'Администратор',
  'ООО «ВЭД Агент Сервис»',
  '7714123456',
  '+7 (499) 398-50-02',
  TRUE,
  TRUE,
  TRUE
) ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, is_verified = TRUE;
