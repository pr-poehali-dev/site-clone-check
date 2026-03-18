"""
Авторизация и управление профилем личного кабинета.
Роутинг через поле action в body:
  action=login     { email, password }
  action=register  { email, password, contact_name, company, inn, phone }
  action=me        — профиль по токену (X-Auth-Token)
  action=save_me   { contact_name, company, inn, phone, kpp }
  action=logout
"""
import json
import os
import hashlib
import secrets
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_token(event: dict) -> str:
    headers = event.get("headers") or {}
    return (
        headers.get("X-Auth-Token")
        or headers.get("x-auth-token")
        or headers.get("X-Authorization", "").replace("Bearer ", "")
        or headers.get("Authorization", "").replace("Bearer ", "")
        or ""
    ).strip()


def user_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.email, u.contact_name, u.company, u.inn, u.phone, u.kpp, u.is_verified
           FROM cabinet_sessions s JOIN cabinet_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "contact_name": row[2], "company": row[3],
            "inn": row[4], "phone": row[5], "kpp": row[6], "is_verified": row[7]}


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Authorization, Authorization",
}


def resp(code, data):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Авторизация, регистрация и профиль кабинета."""
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
        if action == "login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            if not email or not password:
                return resp(400, {"error": "Email и пароль обязательны"})
            cur.execute(
                "SELECT id, password_hash, contact_name, company, inn, phone, kpp, is_verified, is_active FROM cabinet_users WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            if not row or row[1] != hash_password(password):
                return resp(401, {"error": "Неверный email или пароль"})
            if not row[8]:
                return resp(403, {"error": "Аккаунт заблокирован"})
            user_id = row[0]
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO cabinet_sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
            conn.commit()
            return resp(200, {
                "token": new_token,
                "user": {"id": user_id, "email": email, "contact_name": row[2],
                         "company": row[3], "inn": row[4], "phone": row[5],
                         "kpp": row[6], "is_verified": row[7]},
            })

        if action == "register":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            contact_name = (body.get("contact_name") or "").strip()
            company = (body.get("company") or "").strip()
            inn = (body.get("inn") or "").strip()
            phone = (body.get("phone") or "").strip()
            if not email or not password or not contact_name:
                return resp(400, {"error": "Заполните обязательные поля"})
            if len(password) < 6:
                return resp(400, {"error": "Пароль минимум 6 символов"})
            cur.execute("SELECT id FROM cabinet_users WHERE email = %s", (email,))
            if cur.fetchone():
                return resp(409, {"error": "Email уже зарегистрирован"})
            cur.execute(
                "INSERT INTO cabinet_users (email, password_hash, contact_name, company, inn, phone, is_verified) VALUES (%s,%s,%s,%s,%s,%s,FALSE) RETURNING id",
                (email, hash_password(password), contact_name, company, inn, phone),
            )
            new_id = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read) VALUES (%s,%s,%s,%s,FALSE)",
                (new_id, "Менеджер", "Служба поддержки",
                 f"Добро пожаловать, {contact_name}! Ваша заявка принята. KYC-верификация займёт 1 рабочий день."),
            )
            conn.commit()
            return resp(200, {"success": True, "message": "Регистрация принята. Ожидайте активации."})

        if action == "me":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            return resp(200, {"user": user})

        if action == "save_me":
            user = user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Не авторизован"})
            cur.execute(
                "UPDATE cabinet_users SET contact_name=%s, company=%s, inn=%s, phone=%s, kpp=%s WHERE id=%s",
                (body.get("contact_name", user["contact_name"]),
                 body.get("company", user["company"]),
                 body.get("inn", user["inn"]),
                 body.get("phone", user["phone"]),
                 body.get("kpp", user["kpp"]),
                 user["id"]),
            )
            conn.commit()
            return resp(200, {"success": True})

        if action == "logout":
            if token:
                cur.execute("UPDATE cabinet_sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return resp(200, {"success": True})

        return resp(400, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()
