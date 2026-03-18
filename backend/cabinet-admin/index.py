"""
Админ-панель личного кабинета. Доступна только пользователям с is_admin=TRUE.
Методы (action в body):
  action=stats          — общая статистика платформы
  action=users          — список всех пользователей
  action=user_detail    { user_id } — детали пользователя + его платежи
  action=toggle_verify  { user_id } — переключить is_verified
  action=toggle_active  { user_id } — заблокировать / разблокировать
  action=orders         — все платежи всех клиентов
  action=update_order   { order_id, status, manager, comment } — обновить платёж
  action=send_message   { user_id, body } — написать сообщение клиенту
  action=add_order      { user_id, service, country, amount, currency, manager } — создать платёж
  action=add_document   { user_id, name, file_type, file_size } — добавить документ
"""
import json
import os
import psycopg2
from datetime import timezone, datetime


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_token(event: dict) -> str:
    headers = event.get("headers") or {}
    return (
        headers.get("X-Auth-Token")
        or headers.get("x-auth-token")
        or headers.get("X-Authorization", "").replace("Bearer ", "")
        or headers.get("Authorization", "").replace("Bearer ", "")
        or ""
    ).strip()


def admin_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.email, u.contact_name, u.is_admin
           FROM cabinet_sessions s JOIN cabinet_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE AND u.is_admin = TRUE""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "contact_name": row[2], "is_admin": row[3]}


def fmt_dt(dt) -> str:
    if not dt:
        return ""
    return dt.strftime("%d.%m.%Y %H:%M")


def fmt_date(dt) -> str:
    if not dt:
        return ""
    return dt.strftime("%d.%m.%Y")


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Authorization, Authorization",
}


def resp(code, data):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Админ-панель: управление пользователями, платежами, документами."""
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
        admin = admin_by_token(cur, token)
        if not admin:
            return resp(403, {"error": "Доступ запрещён. Требуются права администратора."})

        # ── Общая статистика ──────────────────────────────────────────────
        if action == "stats":
            cur.execute("SELECT COUNT(*), COUNT(*) FILTER (WHERE is_verified), COUNT(*) FILTER (WHERE NOT is_active) FROM cabinet_users WHERE is_admin = FALSE")
            r = cur.fetchone()
            total_users, verified_users, blocked_users = r

            cur.execute("SELECT COUNT(*), COUNT(*) FILTER (WHERE status='active'), COUNT(*) FILTER (WHERE status='done'), COUNT(*) FILTER (WHERE status='pending') FROM cabinet_orders")
            r2 = cur.fetchone()
            total_orders, active_orders, done_orders, pending_orders = r2

            cur.execute("SELECT COUNT(*) FROM cabinet_messages WHERE is_from_user = TRUE AND is_read = FALSE")
            unread_msgs = cur.fetchone()[0]

            cur.execute("SELECT amount, currency FROM cabinet_orders WHERE status = 'done'")
            rates_map = {"USD": 1.0, "EUR": 1.1, "AED": 0.27, "CNY": 0.14, "RUB": 0.011}
            total_vol = 0.0
            for am, curr in cur.fetchall():
                try:
                    total_vol += float(am.replace(",", "")) * rates_map.get(curr, 1.0)
                except Exception:
                    pass

            return resp(200, {
                "total_users": total_users, "verified_users": verified_users, "blocked_users": blocked_users,
                "total_orders": total_orders, "active_orders": active_orders,
                "done_orders": done_orders, "pending_orders": pending_orders,
                "unread_messages": unread_msgs, "total_volume_usd": round(total_vol, 2),
            })

        # ── Список пользователей ─────────────────────────────────────────
        if action == "users":
            cur.execute("""
                SELECT u.id, u.email, u.contact_name, u.company, u.inn, u.phone,
                       u.is_verified, u.is_active, u.is_admin, u.created_at,
                       COUNT(o.id) as order_count
                FROM cabinet_users u
                LEFT JOIN cabinet_orders o ON o.user_id = u.id
                WHERE u.is_admin = FALSE
                GROUP BY u.id ORDER BY u.created_at DESC
            """)
            rows = cur.fetchall()
            users = [{
                "id": r[0], "email": r[1], "contact_name": r[2], "company": r[3],
                "inn": r[4], "phone": r[5], "is_verified": r[6], "is_active": r[7],
                "is_admin": r[8], "created_at": fmt_dt(r[9]), "order_count": r[10]
            } for r in rows]
            return resp(200, {"users": users})

        # ── Детали пользователя ───────────────────────────────────────────
        if action == "user_detail":
            uid = body.get("user_id")
            if not uid:
                return resp(400, {"error": "user_id обязателен"})
            cur.execute("SELECT id, email, contact_name, company, inn, phone, kpp, is_verified, is_active, created_at FROM cabinet_users WHERE id = %s", (uid,))
            r = cur.fetchone()
            if not r:
                return resp(404, {"error": "Пользователь не найден"})
            user = {"id": r[0], "email": r[1], "contact_name": r[2], "company": r[3],
                    "inn": r[4], "phone": r[5], "kpp": r[6], "is_verified": r[7],
                    "is_active": r[8], "created_at": fmt_dt(r[9])}
            cur.execute("SELECT id, order_num, service, country, amount, currency, status, manager, created_at FROM cabinet_orders WHERE user_id = %s ORDER BY created_at DESC", (uid,))
            orders = [{"id": x[0], "order_num": x[1], "service": x[2], "country": x[3],
                       "amount": x[4], "currency": x[5], "status": x[6], "manager": x[7], "date": fmt_date(x[8])} for x in cur.fetchall()]
            cur.execute("SELECT id, name, file_type, file_size, created_at FROM cabinet_documents WHERE user_id = %s ORDER BY created_at DESC", (uid,))
            docs = [{"id": x[0], "name": x[1], "file_type": x[2], "file_size": x[3], "date": fmt_date(x[4])} for x in cur.fetchall()]
            return resp(200, {"user": user, "orders": orders, "documents": docs})

        # ── Верификация / блокировка ──────────────────────────────────────
        if action == "toggle_verify":
            uid = body.get("user_id")
            cur.execute("UPDATE cabinet_users SET is_verified = NOT is_verified WHERE id = %s AND is_admin = FALSE RETURNING is_verified", (uid,))
            r = cur.fetchone()
            conn.commit()
            if r and r[0]:
                cur.execute("INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read) VALUES (%s,'Администратор','Система','Ваш аккаунт верифицирован. Теперь вам доступны все операции.',FALSE)", (uid,))
                conn.commit()
            return resp(200, {"success": True, "is_verified": r[0] if r else None})

        if action == "toggle_active":
            uid = body.get("user_id")
            cur.execute("UPDATE cabinet_users SET is_active = NOT is_active WHERE id = %s AND is_admin = FALSE RETURNING is_active", (uid,))
            r = cur.fetchone()
            conn.commit()
            return resp(200, {"success": True, "is_active": r[0] if r else None})

        # ── Все платежи ───────────────────────────────────────────────────
        if action == "orders":
            cur.execute("""
                SELECT o.id, o.order_num, o.service, o.country, o.amount, o.currency,
                       o.status, o.manager, o.comment, o.created_at,
                       u.email, u.contact_name, u.company
                FROM cabinet_orders o JOIN cabinet_users u ON u.id = o.user_id
                ORDER BY o.created_at DESC
            """)
            rows = cur.fetchall()
            orders = [{
                "id": r[0], "order_num": r[1], "service": r[2], "country": r[3],
                "amount": r[4], "currency": r[5], "status": r[6], "manager": r[7],
                "comment": r[8], "date": fmt_date(r[9]),
                "client_email": r[10], "client_name": r[11], "client_company": r[12]
            } for r in rows]
            return resp(200, {"orders": orders})

        # ── Обновить платёж ───────────────────────────────────────────────
        if action == "update_order":
            oid = body.get("order_id")
            status = body.get("status")
            manager = body.get("manager")
            comment = body.get("comment")
            if not oid:
                return resp(400, {"error": "order_id обязателен"})
            updates, vals = [], []
            if status:  updates.append("status = %s");  vals.append(status)
            if manager: updates.append("manager = %s"); vals.append(manager)
            if comment is not None: updates.append("comment = %s"); vals.append(comment)
            updates.append("updated_at = NOW()")
            vals.append(oid)
            cur.execute(f"UPDATE cabinet_orders SET {', '.join(updates)} WHERE id = %s RETURNING user_id, order_num, status", tuple(vals))
            r = cur.fetchone()
            conn.commit()
            if r and status:
                labels = {"active": "В процессе", "done": "Исполнен", "pending": "На проверке"}
                cur.execute("INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read) VALUES (%s,'Менеджер','Служба поддержки',%s,FALSE)",
                    (r[0], f"Статус платежа {r[1]} изменён на «{labels.get(status, status)}»."))
                conn.commit()
            return resp(200, {"success": True})

        # ── Создать платёж клиенту ────────────────────────────────────────
        if action == "add_order":
            uid = body.get("user_id")
            service = body.get("service", "Международный платёж")
            country = body.get("country", "")
            amount = body.get("amount", "0")
            currency = body.get("currency", "USD")
            manager = body.get("manager", admin["contact_name"] or admin["email"])
            if not uid or not country:
                return resp(400, {"error": "user_id и country обязательны"})
            cur.execute("SELECT COUNT(*)+1 FROM cabinet_orders")
            num = cur.fetchone()[0]
            order_num = f"PAY-{9000 + num}"
            cur.execute(
                "INSERT INTO cabinet_orders (user_id, order_num, service, country, amount, currency, status, manager) VALUES (%s,%s,%s,%s,%s,%s,'pending',%s) RETURNING id",
                (uid, order_num, service, country, amount, currency, manager)
            )
            conn.commit()
            cur.execute("INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read) VALUES (%s,'Менеджер','Служба поддержки',%s,FALSE)",
                (uid, f"Создана новая заявка {order_num}: {service} — {country}. Наш менеджер свяжется с вами в ближайшее время."))
            conn.commit()
            return resp(200, {"success": True, "order_num": order_num})

        # ── Добавить документ клиенту ─────────────────────────────────────
        if action == "add_document":
            uid = body.get("user_id")
            name = body.get("name", "")
            file_type = body.get("file_type", "PDF")
            file_size = body.get("file_size", "—")
            if not uid or not name:
                return resp(400, {"error": "user_id и name обязательны"})
            cur.execute("INSERT INTO cabinet_documents (user_id, name, file_type, file_size) VALUES (%s,%s,%s,%s)", (uid, name, file_type, file_size))
            conn.commit()
            return resp(200, {"success": True})

        # ── Отправить сообщение клиенту ───────────────────────────────────
        if action == "send_message":
            uid = body.get("user_id")
            msg_body = (body.get("body") or "").strip()
            if not uid or not msg_body:
                return resp(400, {"error": "user_id и body обязательны"})
            sender = admin["contact_name"] or "Администратор"
            cur.execute("INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read, is_from_user) VALUES (%s,%s,'Менеджер',%s,FALSE,FALSE)",
                (uid, sender, msg_body))
            conn.commit()
            return resp(200, {"success": True})

        return resp(400, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()
