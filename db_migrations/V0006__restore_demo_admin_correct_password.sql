-- Восстанавливаем правильный пароль demo-admin (Admin1234!)
-- SHA256('Admin1234!') = 5ce41ada64f1e8ffb0acfaafa622b141438f3a5777785e7f0b830fb73e40d3d6
UPDATE t_p82474646_site_clone_check.cabinet_users
SET 
    password_hash = '5ce41ada64f1e8ffb0acfaafa622b141438f3a5777785e7f0b830fb73e40d3d6',
    is_admin = TRUE,
    lk_role = 'ADMIN'
WHERE email = 'demo-admin@demo.ru';
