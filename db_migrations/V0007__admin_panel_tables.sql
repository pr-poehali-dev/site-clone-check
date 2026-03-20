-- Таблицы для админ-панели ЛК

-- Журнал аудита
CREATE TABLE IF NOT EXISTS t_p82474646_site_clone_check.lk_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES t_p82474646_site_clone_check.cabinet_users(id),
    object_type VARCHAR(64) NOT NULL,
    object_id VARCHAR(128),
    action VARCHAR(64) NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Настройки платформы
CREATE TABLE IF NOT EXISTS t_p82474646_site_clone_check.lk_platform_settings (
    key VARCHAR(128) PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник валют
CREATE TABLE IF NOT EXISTS t_p82474646_site_clone_check.lk_dict_currencies (
    code VARCHAR(8) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(8),
    is_active BOOLEAN DEFAULT TRUE
);

-- Справочник стран
CREATE TABLE IF NOT EXISTS t_p82474646_site_clone_check.lk_dict_countries (
    code VARCHAR(8) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Очередь экспорта
CREATE TABLE IF NOT EXISTS t_p82474646_site_clone_check.lk_export_queue (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES t_p82474646_site_clone_check.cabinet_users(id),
    report_type VARCHAR(64) NOT NULL,
    params JSONB,
    status VARCHAR(32) DEFAULT 'pending',
    download_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Колонка admin_comment в заявках (если нет)
ALTER TABLE t_p82474646_site_clone_check.lk_requests ADD COLUMN IF NOT EXISTS admin_comment TEXT;

-- Колонка is_active в организациях (если нет)
ALTER TABLE t_p82474646_site_clone_check.lk_organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Начальные данные справочников
INSERT INTO t_p82474646_site_clone_check.lk_dict_currencies (code, name, symbol) VALUES
    ('USD', 'Доллар США', '$'),
    ('EUR', 'Евро', '€'),
    ('CNY', 'Китайский юань', '¥'),
    ('AED', 'Дирхам ОАЭ', 'د.إ'),
    ('GBP', 'Фунт стерлингов', '£'),
    ('RUB', 'Российский рубль', '₽'),
    ('TRY', 'Турецкая лира', '₺'),
    ('INR', 'Индийская рупия', '₹')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_p82474646_site_clone_check.lk_dict_countries (code, name) VALUES
    ('RU', 'Россия'),
    ('CN', 'Китай'),
    ('AE', 'ОАЭ'),
    ('DE', 'Германия'),
    ('GB', 'Великобритания'),
    ('US', 'США'),
    ('TR', 'Турция'),
    ('IN', 'Индия'),
    ('HK', 'Гонконг'),
    ('SG', 'Сингапур')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_p82474646_site_clone_check.lk_platform_settings (key, value, description) VALUES
    ('file_size_limit_mb', '50', 'Максимальный размер файла в МБ'),
    ('offers_ttl_days', '30', 'Срок жизни оффера в днях'),
    ('api_rate_limit', '100', 'Лимит запросов в минуту'),
    ('smtp_enabled', 'true', 'Включена ли отправка email'),
    ('telegram_bot_enabled', 'false', 'Включён ли Telegram-бот'),
    ('maintenance_mode', 'false', 'Режим технического обслуживания')
ON CONFLICT (key) DO NOTHING;
