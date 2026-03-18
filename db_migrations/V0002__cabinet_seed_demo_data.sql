
INSERT INTO cabinet_orders (user_id, order_num, service, country, amount, currency, status, manager, created_at)
SELECT id, 'PAY-8847', 'Международный платёж', '🇨🇳 Китай', '12500', 'USD', 'done', 'Козлов В.А.', NOW() - INTERVAL '13 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_orders WHERE order_num = 'PAY-8847');

INSERT INTO cabinet_orders (user_id, order_num, service, country, amount, currency, status, manager, created_at)
SELECT id, 'PAY-8821', 'FX операция', '🇦🇪 ОАЭ', '45000', 'AED', 'active', 'Лебедева О.С.', NOW() - INTERVAL '4 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_orders WHERE order_num = 'PAY-8821');

INSERT INTO cabinet_orders (user_id, order_num, service, country, amount, currency, status, manager, created_at)
SELECT id, 'PAY-8796', 'Комплаенс', '🇩🇪 Германия', '8200', 'EUR', 'pending', 'Козлов В.А.', NOW() - INTERVAL '2 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_orders WHERE order_num = 'PAY-8796');

INSERT INTO cabinet_orders (user_id, order_num, service, country, amount, currency, status, manager, created_at)
SELECT id, 'PAY-8750', 'Международный платёж', '🇹🇷 Турция', '6800', 'USD', 'done', 'Лебедева О.С.', NOW() - INTERVAL '36 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_orders WHERE order_num = 'PAY-8750');

INSERT INTO cabinet_documents (user_id, name, file_type, file_size, created_at)
SELECT id, 'SWIFT-подтверждение PAY-8847', 'PDF', '0.3 МБ', NOW() - INTERVAL '13 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_documents WHERE name = 'SWIFT-подтверждение PAY-8847');

INSERT INTO cabinet_documents (user_id, name, file_type, file_size, created_at)
SELECT id, 'Инвойс — Китай (Supplier Ltd)', 'PDF', '0.8 МБ', NOW() - INTERVAL '15 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_documents WHERE name = 'Инвойс — Китай (Supplier Ltd)');

INSERT INTO cabinet_documents (user_id, name, file_type, file_size, created_at)
SELECT id, 'Договор-оферта №2025-847', 'PDF', '1.2 МБ', NOW() - INTERVAL '67 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_documents WHERE name = 'Договор-оферта №2025-847');

INSERT INTO cabinet_documents (user_id, name, file_type, file_size, created_at)
SELECT id, 'Due Diligence отчёт — Германия', 'PDF', '2.1 МБ', NOW() - INTERVAL '4 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_documents WHERE name = 'Due Diligence отчёт — Германия');

INSERT INTO cabinet_documents (user_id, name, file_type, file_size, created_at)
SELECT id, 'Справка о вал. операциях Q1', 'XLSX', '0.6 МБ', NOW() - INTERVAL '17 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_documents WHERE name = 'Справка о вал. операциях Q1');

INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read, created_at)
SELECT id,
  'Козлов В.А.', 'Персональный менеджер',
  'Добрый день! Платёж PAY-8821 в ОАЭ подтверждён банком-корреспондентом. Ожидайте зачисление в течение 24 часов.',
  FALSE, NOW() - INTERVAL '2 hours'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_messages WHERE from_name = 'Козлов В.А.' AND body LIKE 'Добрый день%');

INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read, created_at)
SELECT id,
  'Служба комплаенс', 'Compliance',
  'По запросу PAY-8796: для завершения Due Diligence германского контрагента требуется выписка из торгового реестра (Handelsregister).',
  FALSE, NOW() - INTERVAL '1 day'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_messages WHERE from_name = 'Служба комплаенс');

INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read, created_at)
SELECT id,
  'Система', 'Уведомление',
  'Платёж PAY-8847 в Китай успешно зачислен получателю. SWIFT-подтверждение загружено в раздел «Документы».',
  TRUE, NOW() - INTERVAL '13 days'
FROM cabinet_users WHERE email = 'demo@vedagent.ru'
AND NOT EXISTS (SELECT 1 FROM cabinet_messages WHERE from_name = 'Система' AND body LIKE 'Платёж PAY-8847%');
