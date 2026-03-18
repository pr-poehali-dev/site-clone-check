"""
Данные личного кабинета: платежи, документы, сообщения, статистика.
Роутинг через поле action в body или query-параметр action:
  action=orders          GET — список платежей
  action=documents       GET — список документов
  action=messages        GET — список сообщений
  action=send_message    POST { body } — отправить сообщение менеджеру
  action=read_messages   POST { ids: [...] } — отметить прочитанными
  action=stats           GET — статистика дашборда
"""
import json
import os
import psycopg2
from datetime import datetime, timezone


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


def user_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.email, u.contact_name, u.is_verified
           FROM cabinet_sessions s JOIN cabinet_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "contact_name": row[2], "is_verified": row[3]}


def fmt_date(dt) -> str:
    if not dt:
        return ""
    return dt.strftime("%d.%m.%Y")


def fmt_datetime(dt) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = now - dt
    if diff.days == 0:
        return f"Сегодня, {dt.strftime('%H:%M')}"
    elif diff.days == 1:
        return f"Вчера, {dt.strftime('%H:%M')}"
    else:
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
    """Данные личного кабинета: платежи, документы, сообщения, статистика."""
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
        user = user_by_token(cur, token)
        if not user:
            return resp(401, {"error": "Не авторизован"})
        uid = user["id"]

        if action == "orders":
            cur.execute(
                """SELECT id, order_num, service, country, amount, currency, status, manager, comment, created_at
                   FROM cabinet_orders WHERE user_id = %s ORDER BY created_at DESC""",
                (uid,),
            )
            orders = [
                {"id": r[0], "order_num": r[1], "service": r[2], "country": r[3],
                 "amount": r[4], "currency": r[5], "status": r[6], "manager": r[7],
                 "comment": r[8], "date": fmt_date(r[9])}
                for r in cur.fetchall()
            ]
            return resp(200, {"orders": orders})

        if action == "documents":
            cur.execute(
                """SELECT id, name, file_type, file_size, created_at
                   FROM cabinet_documents WHERE user_id = %s ORDER BY created_at DESC""",
                (uid,),
            )
            docs = [
                {"id": r[0], "name": r[1], "file_type": r[2], "file_size": r[3], "date": fmt_date(r[4])}
                for r in cur.fetchall()
            ]
            return resp(200, {"documents": docs})

        if action == "messages":
            cur.execute(
                """SELECT id, from_name, from_role, body, is_read, is_from_user, created_at
                   FROM cabinet_messages WHERE user_id = %s ORDER BY created_at DESC""",
                (uid,),
            )
            msgs = [
                {"id": r[0], "from_name": r[1], "from_role": r[2], "body": r[3],
                 "is_read": r[4], "is_from_user": r[5], "time": fmt_datetime(r[6])}
                for r in cur.fetchall()
            ]
            return resp(200, {"messages": msgs})

        if action == "send_message":
            msg_body = (body.get("body") or "").strip()
            if not msg_body:
                return resp(400, {"error": "Сообщение пустое"})
            cur.execute(
                "INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read, is_from_user) VALUES (%s,%s,%s,%s,TRUE,TRUE)",
                (uid, user["contact_name"] or user["email"], "Клиент", msg_body),
            )
            cur.execute(
                "INSERT INTO cabinet_messages (user_id, from_name, from_role, body, is_read, is_from_user) VALUES (%s,%s,%s,%s,FALSE,FALSE)",
                (uid, "Менеджер", "Служба поддержки",
                 "Ваше сообщение получено. Ответим в течение 30 минут в рабочее время (Пн–Пт 9:00–18:00 МСК)."),
            )
            conn.commit()
            return resp(200, {"success": True})

        if action == "read_messages":
            ids = body.get("ids") or []
            if ids:
                ids_str = ",".join(str(int(i)) for i in ids)
                cur.execute(
                    f"UPDATE cabinet_messages SET is_read = TRUE WHERE user_id = %s AND id IN ({ids_str})",
                    (uid,),
                )
                conn.commit()
            return resp(200, {"success": True})

        if action == "stats":
            cur.execute(
                "SELECT COUNT(*), COUNT(*) FILTER (WHERE status='active'), COUNT(*) FILTER (WHERE status='done') FROM cabinet_orders WHERE user_id = %s",
                (uid,),
            )
            r = cur.fetchone()
            total, active, done = r[0], r[1], r[2]

            cur.execute("SELECT COUNT(*) FROM cabinet_messages WHERE user_id = %s AND is_read = FALSE AND is_from_user = FALSE", (uid,))
            unread = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM cabinet_documents WHERE user_id = %s", (uid,))
            docs_count = cur.fetchone()[0]

            cur.execute("SELECT amount, currency FROM cabinet_orders WHERE user_id = %s AND status = 'done'", (uid,))
            total_usd = 0.0
            rates_map = {"USD": 1.0, "EUR": 1.1, "AED": 0.27, "CNY": 0.14, "RUB": 0.011}
            for am, curr in cur.fetchall():
                try:
                    total_usd += float(am.replace(",", "")) * rates_map.get(curr, 1.0)
                except Exception:
                    pass

            return resp(200, {
                "total_orders": total, "active_orders": active, "done_orders": done,
                "unread_messages": unread, "docs_count": docs_count,
                "total_volume_usd": round(total_usd, 2),
            })

        return resp(400, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()
