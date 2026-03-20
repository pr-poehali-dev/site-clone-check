"""
ЛК Авторизация: регистрация, вход, профиль, смена роли.
action=register_client  { email, password, full_name, company_name, inn, phone }
action=register_agent   { email, password, full_name, org_name, org_inn, org_kpp, org_address, phone }
action=login            { email, password }
action=me               — профиль по токену
action=save_profile     { full_name, phone, kpp }
action=logout
action=save_org         { name, inn, kpp, address, requisites, nonresident_payment_enabled, nonresident_details }
action=get_org          — организация агента
action=org_members      — список участников орг
action=invite_member    { email, role }
action=update_member    { member_user_id, role, is_active }
action=notifications    — список уведомлений
action=read_notification { notification_id }
"""
import json, os, hashlib, secrets, psycopg2
import smtplib, ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone


def send_email(to_email: str, subject: str, html_body: str) -> None:
    """Отправка HTML email через SMTP. Не бросает исключений — молча логирует."""
    try:
        smtp_host = os.environ.get("SMTP_HOST", "")
        smtp_port = int(os.environ.get("SMTP_PORT", "465"))
        smtp_user = os.environ.get("SMTP_USER", "")
        smtp_pass = os.environ.get("SMTP_PASSWORD", "")
        if not smtp_host or not smtp_user or not smtp_pass:
            return
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ВалютаПэй <{smtp_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        ctx = ssl.create_default_context()
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx, timeout=10) as s:
                s.login(smtp_user, smtp_pass)
                s.sendmail(smtp_user, to_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
                s.starttls(context=ctx)
                s.login(smtp_user, smtp_pass)
                s.sendmail(smtp_user, to_email, msg.as_string())
    except Exception:
        pass  # не прерываем основной флоу


def email_html(title: str, body_html: str, cta_text: str = "", cta_url: str = "") -> str:
    cta = f"""<div style="margin-top:24px;text-align:center">
      <a href="{cta_url}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">{cta_text}</a>
    </div>""" if cta_text and cta_url else ""
    return f"""<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="background:#2563eb;padding:20px 28px">
    <div style="font-size:20px;font-weight:800;color:#fff">ВалютаПэй</div>
  </div>
  <div style="padding:28px">
    <h2 style="margin:0 0 14px;font-size:18px;color:#1e293b">{title}</h2>
    <div style="font-size:15px;color:#374151;line-height:1.6">{body_html}</div>
    {cta}
  </div>
  <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
    Это автоматическое уведомление. Не отвечайте на это письмо.
  </div>
</div></body></html>"""


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hp(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_token(event: dict) -> str:
    h = event.get("headers") or {}
    return (h.get("X-Auth-Token") or h.get("x-auth-token") or
            h.get("X-Authorization", "").replace("Bearer ", "") or
            h.get("Authorization", "").replace("Bearer ", "") or "").strip()


def user_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.email, u.contact_name, u.company, u.inn, u.phone, u.kpp,
                  u.is_verified, u.is_admin, u.lk_role
           FROM cabinet_sessions s JOIN cabinet_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "full_name": row[2], "company": row[3],
            "inn": row[4], "phone": row[5], "kpp": row[6],
            "is_verified": row[7], "is_admin": row[8], "lk_role": row[9] or "CLIENT"}


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Authorization, Authorization",
}


def resp(code, data):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """ЛК: авторизация, профиль, организация агента, уведомления."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    qs = event.get("queryStringParameters") or {}
    action = body.get("action") or qs.get("action") or ""
    token = get_token(event)

    conn = get_conn()
    cur = conn.cursor()
    try:

        # ── REGISTER CLIENT ──────────────────────────────────────────────
        if action == "register_client":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            full_name = (body.get("full_name") or "").strip()
            company_name = (body.get("company_name") or "").strip()
            inn = (body.get("inn") or "").strip()
            phone = (body.get("phone") or "").strip()
            if not email or not password or not full_name:
                return resp(400, {"error": "Заполните обязательные поля: email, пароль, имя"})
            if len(password) < 6:
                return resp(400, {"error": "Пароль минимум 6 символов"})
            cur.execute("SELECT id FROM cabinet_users WHERE email = %s", (email,))
            if cur.fetchone():
                return resp(409, {"error": "Email уже зарегистрирован"})
            cur.execute(
                """INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, lk_role, is_verified)
                   VALUES (%s,%s,%s,%s,%s,%s,'CLIENT',FALSE) RETURNING id""",
                (email, hp(password), full_name, company_name, inn, phone),
            )
            new_id = cur.fetchone()[0]
            # Создаём компанию если указано название
            if company_name:
                cur.execute(
                    """INSERT INTO lk_companies (name, inn, client_owner_user_id, contacts)
                       VALUES (%s,%s,%s,%s)""",
                    (company_name, inn, new_id, json.dumps({"email": email, "phone": phone})),
                )
            cur.execute(
                """INSERT INTO lk_notifications (user_id, type, title, body)
                   VALUES (%s,'welcome','Добро пожаловать!','Ваш аккаунт создан. Можете создавать заявки на оплату инвойсов.')""",
                (new_id,),
            )
            conn.commit()
            send_email(email, "Добро пожаловать в ВалютаПэй!",
                email_html(
                    f"Привет, {full_name}!",
                    "Ваш аккаунт <strong>клиента</strong> успешно создан.<br><br>"
                    "Теперь вы можете создавать заявки на оплату международных инвойсов, "
                    "получать предложения от платёжных агентов и выбирать лучшие условия.",
                    "Войти в личный кабинет", "https://poehali.dev/lk/login"
                ))
            return resp(200, {"success": True, "message": "Регистрация успешна. Войдите в систему."})

        # ── REGISTER AGENT ──────────────────────────────────────────────
        if action == "register_agent":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            full_name = (body.get("full_name") or "").strip()
            org_name = (body.get("org_name") or "").strip()
            org_inn = (body.get("org_inn") or "").strip()
            org_kpp = (body.get("org_kpp") or "").strip()
            org_address = (body.get("org_address") or "").strip()
            phone = (body.get("phone") or "").strip()
            if not email or not password or not full_name or not org_name:
                return resp(400, {"error": "Заполните обязательные поля: email, пароль, имя, название организации"})
            if len(password) < 6:
                return resp(400, {"error": "Пароль минимум 6 символов"})
            cur.execute("SELECT id FROM cabinet_users WHERE email = %s", (email,))
            if cur.fetchone():
                return resp(409, {"error": "Email уже зарегистрирован"})
            cur.execute(
                """INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, lk_role, is_verified)
                   VALUES (%s,%s,%s,%s,%s,%s,'AGENT',FALSE) RETURNING id""",
                (email, hp(password), full_name, org_name, org_inn, phone),
            )
            new_id = cur.fetchone()[0]
            cur.execute(
                """INSERT INTO lk_organizations (type, name, inn, kpp, address, owner_user_id)
                   VALUES ('AGENT',%s,%s,%s,%s,%s) RETURNING id""",
                (org_name, org_inn, org_kpp, org_address, new_id),
            )
            org_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO lk_org_memberships (user_id, org_id, role) VALUES (%s,%s,'OWNER')",
                (new_id, org_id),
            )
            cur.execute(
                """INSERT INTO lk_notifications (user_id, type, title, body)
                   VALUES (%s,'welcome','Добро пожаловать!','Ваш аккаунт агента создан. Можете просматривать заявки и отправлять предложения.')""",
                (new_id,),
            )
            conn.commit()
            send_email(email, "Добро пожаловать в ВалютаПэй (агент)!",
                email_html(
                    f"Привет, {full_name}!",
                    f"Ваш аккаунт <strong>платёжного агента</strong> успешно создан.<br><br>"
                    f"Организация <strong>{org_name}</strong> зарегистрирована. "
                    "Вы можете просматривать заявки клиентов и отправлять предложения.",
                    "Открыть каталог заявок", "https://poehali.dev/lk/agent/requests"
                ))
            return resp(200, {"success": True, "message": "Регистрация агента успешна. Войдите в систему."})

        # ── LOGIN ────────────────────────────────────────────────────────
        if action == "login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            if not email or not password:
                return resp(400, {"error": "Email и пароль обязательны"})
            cur.execute(
                """SELECT id, password_hash, contact_name, company, inn, phone, kpp,
                          is_verified, is_active, is_admin, lk_role
                   FROM cabinet_users WHERE email = %s""",
                (email,),
            )
            row = cur.fetchone()
            if not row or row[1] != hp(password):
                return resp(401, {"error": "Неверный email или пароль"})
            if not row[8]:
                return resp(403, {"error": "Аккаунт заблокирован"})
            user_id = row[0]
            lk_role = row[10] or "CLIENT"
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO cabinet_sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            conn.commit()
            return resp(200, {
                "token": new_token,
                "user": {"id": user_id, "email": email, "full_name": row[2],
                         "company": row[3], "inn": row[4], "phone": row[5],
                         "kpp": row[6], "is_verified": row[7], "is_admin": row[9],
                         "lk_role": lk_role},
            })

        # ── CREATE DEMO USERS ────────────────────────────────────────────
        if action == "create_demo_users":
            demo_password = hp("Demo1234!")
            demo_admin_password = hp("Admin1234!")
            created = []
            # Клиент
            cur.execute("SELECT id FROM cabinet_users WHERE email = 'demo-client@demo.ru'")
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, lk_role, is_verified, is_active)
                       VALUES ('demo-client@demo.ru',%s,'Демо Клиент','ООО Демо Клиент','7700000001','+79000000001','CLIENT',TRUE,TRUE) RETURNING id""",
                    (demo_password,)
                )
                new_id = cur.fetchone()[0]
                cur.execute(
                    """INSERT INTO lk_companies (name, inn, client_owner_user_id, contacts)
                       VALUES ('ООО Демо Клиент','7700000001',%s,'{}')""", (new_id,)
                )
                created.append("client")
            # Агент
            cur.execute("SELECT id FROM cabinet_users WHERE email = 'demo-agent@demo.ru'")
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, lk_role, is_verified, is_active)
                       VALUES ('demo-agent@demo.ru',%s,'Демо Агент','ООО Демо Агент','7700000002','+79000000002','AGENT',TRUE,TRUE) RETURNING id""",
                    (demo_password,)
                )
                new_id = cur.fetchone()[0]
                cur.execute(
                    """INSERT INTO lk_organizations (type, name, inn, kpp, address, owner_user_id)
                       VALUES ('AGENT','ООО Демо Агент','7700000002','770001001','г. Москва, ул. Демо, 1',%s) RETURNING id""",
                    (new_id,)
                )
                org_id = cur.fetchone()[0]
                cur.execute("INSERT INTO lk_org_memberships (user_id, org_id, role) VALUES (%s,%s,'OWNER')", (new_id, org_id))
                created.append("agent")
            # Админ
            cur.execute("SELECT id FROM cabinet_users WHERE email = 'demo-admin@demo.ru'")
            if not cur.fetchone():
                cur.execute(
                    """INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, lk_role, is_verified, is_active, is_admin)
                       VALUES ('demo-admin@demo.ru',%s,'Демо Админ','ВалютаПэй','7700000099','+79000000099','CLIENT',TRUE,TRUE,TRUE) RETURNING id""",
                    (demo_admin_password,)
                )
                created.append("admin")
            conn.commit()
            return resp(200, {"success": True, "created": created, "already_existed": [r for r in ["client","agent","admin"] if r not in created]})

        # ── ME ───────────────────────────────────────────────────────────
        if action == "me":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            # Для агента добавляем org_id
            org_id = None
            org_role = None
            if user["lk_role"] == "AGENT":
                cur.execute(
                    "SELECT org_id, role FROM lk_org_memberships WHERE user_id = %s AND is_active = TRUE LIMIT 1",
                    (user["id"],),
                )
                m = cur.fetchone()
                if m:
                    org_id = str(m[0])
                    org_role = m[1]
            user["org_id"] = org_id
            user["org_role"] = org_role
            return resp(200, {"user": user})

        # ── SAVE PROFILE ─────────────────────────────────────────────────
        if action == "save_profile":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                "UPDATE cabinet_users SET contact_name=%s, phone=%s, kpp=%s WHERE id=%s",
                (body.get("full_name", user["full_name"]),
                 body.get("phone", user["phone"]),
                 body.get("kpp", user["kpp"]),
                 user["id"]),
            )
            conn.commit()
            return resp(200, {"success": True})

        # ── LOGOUT ───────────────────────────────────────────────────────
        if action == "logout":
            if token:
                cur.execute("UPDATE cabinet_sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return resp(200, {"success": True})

        # ── GET ORG ──────────────────────────────────────────────────────
        if action == "get_org":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                """SELECT o.id, o.type, o.name, o.inn, o.kpp, o.address,
                          o.requisites, o.nonresident_payment_enabled, o.nonresident_details
                   FROM lk_organizations o
                   JOIN lk_org_memberships m ON m.org_id = o.id
                   WHERE m.user_id = %s AND m.is_active = TRUE LIMIT 1""",
                (user["id"],),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Организация не найдена"})
            return resp(200, {"org": {
                "id": str(row[0]), "type": row[1], "name": row[2], "inn": row[3],
                "kpp": row[4], "address": row[5], "requisites": row[6] or {},
                "nonresident_payment_enabled": row[7],
                "nonresident_details": row[8] or {},
            }})

        # ── SAVE ORG ─────────────────────────────────────────────────────
        if action == "save_org":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                """SELECT o.id, m.role FROM lk_organizations o
                   JOIN lk_org_memberships m ON m.org_id = o.id
                   WHERE m.user_id = %s AND m.is_active = TRUE LIMIT 1""",
                (user["id"],),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Организация не найдена"})
            if row[1] not in ("OWNER", "ADMIN"):
                return resp(403, {"error": "Недостаточно прав"})
            org_id = row[0]
            req = body.get("requisites")
            nd = body.get("nonresident_details")
            cur.execute(
                """UPDATE lk_organizations SET name=%s, inn=%s, kpp=%s, address=%s,
                   requisites=%s, nonresident_payment_enabled=%s, nonresident_details=%s
                   WHERE id=%s""",
                (body.get("name"), body.get("inn"), body.get("kpp"), body.get("address"),
                 json.dumps(req) if req is not None else "{}",
                 body.get("nonresident_payment_enabled", False),
                 json.dumps(nd) if nd is not None else "{}",
                 org_id),
            )
            conn.commit()
            return resp(200, {"success": True})

        # ── ORG MEMBERS ──────────────────────────────────────────────────
        if action == "org_members":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                """SELECT o.id FROM lk_organizations o
                   JOIN lk_org_memberships m ON m.org_id = o.id
                   WHERE m.user_id = %s AND m.is_active = TRUE LIMIT 1""",
                (user["id"],),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Организация не найдена"})
            org_id = row[0]
            cur.execute(
                """SELECT u.id, u.email, u.contact_name, u.phone, m.role, m.is_active, m.created_at
                   FROM lk_org_memberships m JOIN cabinet_users u ON u.id = m.user_id
                   WHERE m.org_id = %s ORDER BY m.created_at""",
                (org_id,),
            )
            members = []
            for r in cur.fetchall():
                members.append({"id": r[0], "email": r[1], "full_name": r[2], "phone": r[3],
                                 "role": r[4], "is_active": r[5], "created_at": str(r[6])})
            return resp(200, {"members": members})

        # ── INVITE MEMBER ────────────────────────────────────────────────
        if action == "invite_member":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                """SELECT o.id, m.role FROM lk_organizations o
                   JOIN lk_org_memberships m ON m.org_id = o.id
                   WHERE m.user_id = %s AND m.is_active = TRUE LIMIT 1""",
                (user["id"],),
            )
            row = cur.fetchone()
            if not row or row[1] not in ("OWNER", "ADMIN"):
                return resp(403, {"error": "Недостаточно прав"})
            org_id = row[0]
            invite_email = (body.get("email") or "").strip().lower()
            role = body.get("role", "OPERATOR")
            if role not in ("ADMIN", "MANAGER", "OPERATOR"):
                return resp(400, {"error": "Недопустимая роль"})
            cur.execute("SELECT id FROM cabinet_users WHERE email = %s", (invite_email,))
            target = cur.fetchone()
            if not target:
                return resp(404, {"error": "Пользователь с таким email не найден"})
            target_id = target[0]
            cur.execute(
                """INSERT INTO lk_org_memberships (user_id, org_id, role)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (user_id, org_id) DO UPDATE SET role=%s, is_active=TRUE""",
                (target_id, org_id, role, role),
            )
            cur.execute(
                "UPDATE cabinet_users SET lk_role='AGENT' WHERE id=%s AND lk_role='CLIENT'",
                (target_id,),
            )
            conn.commit()
            return resp(200, {"success": True})

        # ── UPDATE MEMBER ────────────────────────────────────────────────
        if action == "update_member":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                """SELECT o.id, m.role FROM lk_organizations o
                   JOIN lk_org_memberships m ON m.org_id = o.id
                   WHERE m.user_id = %s AND m.is_active = TRUE LIMIT 1""",
                (user["id"],),
            )
            row = cur.fetchone()
            if not row or row[1] not in ("OWNER", "ADMIN"):
                return resp(403, {"error": "Недостаточно прав"})
            org_id = row[0]
            mid = body.get("member_user_id")
            new_role = body.get("role")
            is_active = body.get("is_active")
            if new_role:
                cur.execute("UPDATE lk_org_memberships SET role=%s WHERE user_id=%s AND org_id=%s",
                            (new_role, mid, org_id))
            if is_active is not None:
                cur.execute("UPDATE lk_org_memberships SET is_active=%s WHERE user_id=%s AND org_id=%s",
                            (is_active, mid, org_id))
            conn.commit()
            return resp(200, {"success": True})

        # ── NOTIFICATIONS ─────────────────────────────────────────────────
        if action == "notifications":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                """SELECT id, type, title, body, payload, read_at, created_at
                   FROM lk_notifications WHERE user_id = %s
                   ORDER BY created_at DESC LIMIT 50""",
                (user["id"],),
            )
            items = []
            for r in cur.fetchall():
                items.append({"id": str(r[0]), "type": r[1], "title": r[2], "body": r[3],
                               "payload": r[4] or {}, "read_at": str(r[5]) if r[5] else None,
                               "created_at": str(r[6])})
            return resp(200, {"notifications": items})

        if action == "read_notification":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            nid = body.get("notification_id")
            if nid:
                cur.execute(
                    "UPDATE lk_notifications SET read_at=NOW() WHERE id=%s AND user_id=%s",
                    (nid, user["id"]),
                )
            else:
                cur.execute("UPDATE lk_notifications SET read_at=NOW() WHERE user_id=%s AND read_at IS NULL",
                            (user["id"],))
            conn.commit()
            return resp(200, {"success": True})

        return resp(400, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()