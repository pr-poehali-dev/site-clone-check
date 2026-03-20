-- Исправляем пароль и роль демо-администратора
-- SHA256('Demo1234!') = 7dbb7f051b44d7d54584a7bc6c32f00da5a3b5e6973485b9fb176fe56346b3e3
UPDATE t_p82474646_site_clone_check.cabinet_users
SET 
    password_hash = '7dbb7f051b44d7d54584a7bc6c32f00da5a3b5e6973485b9fb176fe56346b3e3',
    is_admin = TRUE,
    lk_role = 'ADMIN'
WHERE email = 'demo-admin@demo.ru';
