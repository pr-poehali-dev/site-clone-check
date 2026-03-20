"""
Админ-панель. Доступна только пользователям с is_admin=TRUE или lk_role IN (ADMIN, PLATFORM_ADMIN, COMPLIANCE, SUPPORT).
Старые методы (кабинет):
  action=stats, users, user_detail, toggle_verify, toggle_active, orders, update_order, send_message, add_order, add_document
ЛК-админ методы:
  action=lk_overview            — метрики ЛК
  action=lk_users               — пользователи ЛК (q, role, is_active, page)
  action=lk_user_detail         { user_id }
  action=lk_user_update         { user_id, is_active, lk_role, is_admin }
  action=lk_orgs                — организации (q, type, page)
  action=lk_org_detail          { org_id }
  action=lk_org_update          { org_id, ... }
  action=lk_companies           — компании клиентов (q, page)
  action=lk_requests            — заявки (q, status, currency, page)
  action=lk_request_detail      { request_id }
  action=lk_request_update      { request_id, status, comment }
  action=lk_offers              — офферы (q, status, page)
  action=lk_offer_update        { offer_id, status }
  action=lk_files               — журнал файлов (q, page)
  action=lk_audit               — журнал аудита (q, page)
  action=lk_settings_get        — настройки платформы
  action=lk_settings_save       { key, value }
  action=lk_dicts_currencies    — справочник валют
  action=lk_dicts_save_currency { code, name, symbol, is_active }
  action=lk_dicts_countries     — справочник стран
  action=lk_notifications_broadcast { title, body, user_ids? }
  action=lk_reports_queue       { report_type, params }
  action=lk_reports_list        — история выгрузок
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
        """SELECT u.id, u.email, u.contact_name, u.is_admin, u.lk_role
           FROM cabinet_sessions s JOIN cabinet_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE
             AND (u.is_admin = TRUE OR u.lk_role IN ('ADMIN','PLATFORM_ADMIN','COMPLIANCE','SUPPORT'))""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "contact_name": row[2], "is_admin": row[3], "lk_role": row[4]}


def write_audit(cur, admin_id, object_type, object_id, action, before=None, after=None):
    import json as _json
    cur.execute(
        """INSERT INTO lk_audit_log (admin_user_id, object_type, object_id, action, before_data, after_data)
           VALUES (%s,%s,%s,%s,%s,%s)""",
        (admin_id, object_type, str(object_id) if object_id else None, action,
         _json.dumps(before, default=str) if before else None,
         _json.dumps(after, default=str) if after else None)
    )


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

        # ════════════════════════════════════════════════════════════════
        # ЛК-АДМИН МЕТОДЫ
        # ════════════════════════════════════════════════════════════════
        page = int(body.get("page") or qs.get("page") or 1)
        per_page = 50
        offset = (page - 1) * per_page

        # ── LK OVERVIEW ──────────────────────────────────────────────────
        if action == "lk_overview":
            cur.execute("SELECT COUNT(*) FROM cabinet_users WHERE is_active=TRUE")
            users_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM cabinet_users WHERE lk_role='AGENT' AND is_active=TRUE")
            agents_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM cabinet_users WHERE lk_role='CLIENT' AND is_active=TRUE")
            clients_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lk_requests")
            requests_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lk_requests WHERE status='completed'")
            requests_completed = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lk_requests WHERE status='awaiting_offers'")
            requests_open = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lk_requests WHERE created_at > NOW() - INTERVAL '30 days'")
            requests_month = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lk_offers")
            offers_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lk_offers WHERE status='selected'")
            offers_selected = cur.fetchone()[0]
            cur.execute("SELECT status, COUNT(*) FROM lk_requests GROUP BY status ORDER BY COUNT(*) DESC")
            requests_by_status = [{"status": r[0], "count": r[1]} for r in cur.fetchall()]
            cur.execute("SELECT currency, COUNT(*), SUM(amount) FROM lk_requests GROUP BY currency ORDER BY COUNT(*) DESC")
            requests_by_currency = [{"currency": r[0], "count": r[1], "total": float(r[2] or 0)} for r in cur.fetchall()]
            cur.execute("""
                SELECT u.contact_name, COUNT(o.id) as cnt FROM lk_offers o
                JOIN cabinet_users u ON u.id=o.created_by_user_id
                WHERE o.status='selected' GROUP BY u.contact_name ORDER BY cnt DESC LIMIT 5
            """)
            top_agents = [{"name": r[0], "selected": r[1]} for r in cur.fetchall()]
            return resp(200, {
                "users_total": users_total, "agents_total": agents_total, "clients_total": clients_total,
                "requests_total": requests_total, "requests_completed": requests_completed,
                "requests_open": requests_open, "requests_month": requests_month,
                "offers_total": offers_total, "offers_selected": offers_selected,
                "requests_by_status": requests_by_status, "requests_by_currency": requests_by_currency,
                "top_agents": top_agents,
            })

        # ── LK USERS ─────────────────────────────────────────────────────
        if action == "lk_users":
            q = body.get("q") or qs.get("q") or ""
            role = body.get("role") or qs.get("role") or ""
            is_active_filter = body.get("is_active")
            if is_active_filter is None: is_active_filter = qs.get("is_active")
            where, params = ["1=1"], []
            if q:
                where.append("(u.email ILIKE %s OR u.contact_name ILIKE %s OR u.company ILIKE %s OR u.inn ILIKE %s)")
                params += [f"%{q}%"] * 4
            if role:
                where.append("u.lk_role = %s"); params.append(role)
            if is_active_filter is not None and is_active_filter != "":
                where.append("u.is_active = %s")
                params.append(str(is_active_filter).lower() in ("true", "1", "yes"))
            wh = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM cabinet_users u WHERE {wh}", params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT u.id, u.email, u.contact_name, u.company, u.inn, u.phone,
                       u.lk_role, u.is_active, u.is_admin, u.is_verified, u.created_at,
                       (SELECT COUNT(*) FROM lk_requests r WHERE r.created_by_user_id=u.id),
                       (SELECT COUNT(*) FROM lk_offers o WHERE o.created_by_user_id=u.id)
                FROM cabinet_users u WHERE {wh} ORDER BY u.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            users = [{"id": r[0], "email": r[1], "name": r[2], "company": r[3], "inn": r[4], "phone": r[5],
                      "lk_role": r[6], "is_active": r[7], "is_admin": r[8], "is_verified": r[9],
                      "created_at": r[10], "requests_count": r[11], "offers_count": r[12]}
                     for r in cur.fetchall()]
            return resp(200, {"users": users, "total": total, "page": page, "pages": -(-total // per_page)})

        if action == "lk_user_detail":
            uid = body.get("user_id") or qs.get("user_id")
            cur.execute("SELECT id,email,contact_name,company,inn,phone,kpp,lk_role,is_active,is_admin,is_verified,created_at FROM cabinet_users WHERE id=%s", (uid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Пользователь не найден"})
            user = {"id": row[0], "email": row[1], "name": row[2], "company": row[3], "inn": row[4],
                    "phone": row[5], "kpp": row[6], "lk_role": row[7], "is_active": row[8],
                    "is_admin": row[9], "is_verified": row[10], "created_at": row[11]}
            cur.execute("SELECT id,invoice_number,amount,currency,status,created_at FROM lk_requests WHERE created_by_user_id=%s ORDER BY created_at DESC LIMIT 20", (uid,))
            user["requests"] = [{"id": r[0], "invoice_number": r[1], "amount": float(r[2]), "currency": r[3], "status": r[4], "created_at": r[5]} for r in cur.fetchall()]
            cur.execute("SELECT id,request_id,percent_fee,fx_rate,status,created_at FROM lk_offers WHERE created_by_user_id=%s ORDER BY created_at DESC LIMIT 20", (uid,))
            user["offers"] = [{"id": r[0], "request_id": r[1], "percent_fee": float(r[2]), "fx_rate": float(r[3]), "status": r[4], "created_at": r[5]} for r in cur.fetchall()]
            return resp(200, user)

        if action == "lk_user_update":
            uid = body.get("user_id")
            cur.execute("SELECT id,lk_role,is_active,is_admin FROM cabinet_users WHERE id=%s", (uid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Пользователь не найден"})
            before = {"lk_role": row[1], "is_active": row[2], "is_admin": row[3]}
            fields, params = [], []
            for f in ("is_active", "lk_role", "is_admin"):
                if f in body: fields.append(f"{f} = %s"); params.append(body[f])
            if fields:
                cur.execute(f"UPDATE cabinet_users SET {', '.join(fields)} WHERE id=%s", params + [uid])
                write_audit(cur, admin["id"], "user", uid, "update", before, body)
                conn.commit()
            return resp(200, {"success": True})

        # ── LK ORGS ──────────────────────────────────────────────────────
        if action == "lk_orgs":
            q = body.get("q") or qs.get("q") or ""
            org_type = body.get("type") or qs.get("type") or ""
            where, params = ["1=1"], []
            if q:
                where.append("(o.name ILIKE %s OR o.inn ILIKE %s)"); params += [f"%{q}%"] * 2
            if org_type:
                where.append("o.type = %s"); params.append(org_type)
            wh = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM lk_organizations o WHERE {wh}", params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT o.id, o.type, o.name, o.inn, o.kpp, o.address, o.is_active,
                       u.email, u.contact_name, o.created_at,
                       (SELECT COUNT(*) FROM lk_org_memberships m WHERE m.org_id=o.id)
                FROM lk_organizations o LEFT JOIN cabinet_users u ON u.id=o.owner_user_id
                WHERE {wh} ORDER BY o.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            orgs = [{"id": r[0], "type": r[1], "name": r[2], "inn": r[3], "kpp": r[4], "address": r[5],
                     "is_active": r[6], "owner_email": r[7], "owner_name": r[8], "created_at": r[9],
                     "members_count": r[10]} for r in cur.fetchall()]
            return resp(200, {"orgs": orgs, "total": total, "page": page, "pages": -(-total // per_page)})

        if action == "lk_org_detail":
            oid = body.get("org_id") or qs.get("org_id")
            cur.execute("""
                SELECT o.id,o.type,o.name,o.inn,o.kpp,o.address,o.is_active,
                       o.nonresident_payment_enabled,o.nonresident_details,o.requisites,
                       o.created_at,u.email,u.contact_name
                FROM lk_organizations o LEFT JOIN cabinet_users u ON u.id=o.owner_user_id WHERE o.id=%s
            """, (oid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Организация не найдена"})
            org = {"id": row[0], "type": row[1], "name": row[2], "inn": row[3], "kpp": row[4],
                   "address": row[5], "is_active": row[6], "nonresident_payment_enabled": row[7],
                   "nonresident_details": row[8], "requisites": row[9], "created_at": row[10],
                   "owner_email": row[11], "owner_name": row[12]}
            cur.execute("""
                SELECT u.id,u.email,u.contact_name,m.role,m.is_active
                FROM lk_org_memberships m JOIN cabinet_users u ON u.id=m.user_id WHERE m.org_id=%s
            """, (oid,))
            org["members"] = [{"id": r[0], "email": r[1], "name": r[2], "role": r[3], "is_active": r[4]} for r in cur.fetchall()]
            return resp(200, org)

        if action == "lk_org_update":
            oid = body.get("org_id")
            cur.execute("SELECT id,name,is_active FROM lk_organizations WHERE id=%s", (oid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Организация не найдена"})
            fields, params = [], []
            for f in ("name", "inn", "kpp", "address", "is_active"):
                if f in body: fields.append(f"{f} = %s"); params.append(body[f])
            if fields:
                cur.execute(f"UPDATE lk_organizations SET {', '.join(fields)} WHERE id=%s", params + [oid])
                write_audit(cur, admin["id"], "org", oid, "update", {"name": row[1], "is_active": row[2]}, body)
                conn.commit()
            return resp(200, {"success": True})

        # ── LK COMPANIES ─────────────────────────────────────────────────
        if action == "lk_companies":
            q = body.get("q") or qs.get("q") or ""
            where, params = ["1=1"], []
            if q:
                where.append("(c.name ILIKE %s OR c.inn ILIKE %s)"); params += [f"%{q}%"] * 2
            wh = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM lk_companies c WHERE {wh}", params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT c.id,c.name,c.inn,c.kpp,c.contacts,u.email,u.contact_name,c.created_at,
                       (SELECT COUNT(*) FROM lk_requests r WHERE r.company_id=c.id)
                FROM lk_companies c LEFT JOIN cabinet_users u ON u.id=c.client_owner_user_id
                WHERE {wh} ORDER BY c.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            companies = [{"id": r[0], "name": r[1], "inn": r[2], "kpp": r[3], "contacts": r[4],
                          "owner_email": r[5], "owner_name": r[6], "created_at": r[7], "requests_count": r[8]}
                         for r in cur.fetchall()]
            return resp(200, {"companies": companies, "total": total, "page": page, "pages": -(-total // per_page)})

        # ── LK REQUESTS ──────────────────────────────────────────────────
        if action == "lk_requests":
            q = body.get("q") or qs.get("q") or ""
            status = body.get("status") or qs.get("status") or ""
            currency = body.get("currency") or qs.get("currency") or ""
            where, params = ["1=1"], []
            if q:
                where.append("(r.invoice_number ILIKE %s OR r.description ILIKE %s OR u.email ILIKE %s)")
                params += [f"%{q}%"] * 3
            if status: where.append("r.status=%s"); params.append(status)
            if currency: where.append("r.currency=%s"); params.append(currency)
            wh = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM lk_requests r LEFT JOIN cabinet_users u ON u.id=r.created_by_user_id WHERE {wh}", params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT r.id,r.invoice_number,r.amount,r.currency,r.status,r.description,
                       r.offers_until,r.payment_until,r.created_at,u.email,u.contact_name,
                       (SELECT COUNT(*) FROM lk_offers o WHERE o.request_id=r.id)
                FROM lk_requests r LEFT JOIN cabinet_users u ON u.id=r.created_by_user_id
                WHERE {wh} ORDER BY r.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            requests = [{"id": r[0], "invoice_number": r[1], "amount": float(r[2]), "currency": r[3],
                         "status": r[4], "description": r[5], "offers_until": r[6], "payment_until": r[7],
                         "created_at": r[8], "client_email": r[9], "client_name": r[10], "offers_count": r[11]}
                        for r in cur.fetchall()]
            return resp(200, {"requests": requests, "total": total, "page": page, "pages": -(-total // per_page)})

        if action == "lk_request_detail":
            rid = body.get("request_id") or qs.get("request_id")
            cur.execute("""
                SELECT r.id,r.invoice_number,r.amount,r.currency,r.status,r.description,
                       r.offers_until,r.payment_until,r.created_at,r.company_id,r.admin_comment,
                       u.email,u.contact_name,c.name
                FROM lk_requests r LEFT JOIN cabinet_users u ON u.id=r.created_by_user_id
                LEFT JOIN lk_companies c ON c.id=r.company_id WHERE r.id=%s
            """, (rid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Заявка не найдена"})
            req = {"id": row[0], "invoice_number": row[1], "amount": float(row[2]), "currency": row[3],
                   "status": row[4], "description": row[5], "offers_until": row[6], "payment_until": row[7],
                   "created_at": row[8], "company_id": row[9], "admin_comment": row[10],
                   "client_email": row[11], "client_name": row[12], "company_name": row[13]}
            cur.execute("""
                SELECT o.id,o.percent_fee,o.fx_rate,o.duration_workdays,o.pay_from_country,
                       o.comment,o.status,o.created_at,u.email,u.contact_name,org.name
                FROM lk_offers o LEFT JOIN cabinet_users u ON u.id=o.created_by_user_id
                LEFT JOIN lk_organizations org ON org.id=o.org_id
                WHERE o.request_id=%s ORDER BY o.created_at
            """, (rid,))
            req["offers"] = [{"id": r[0], "percent_fee": float(r[1]), "fx_rate": float(r[2]),
                              "duration_workdays": r[3], "pay_from_country": r[4], "comment": r[5],
                              "status": r[6], "created_at": r[7], "agent_email": r[8],
                              "agent_name": r[9], "org_name": r[10]} for r in cur.fetchall()]
            cur.execute("SELECT id,file_type,original_name,url,created_at FROM lk_attachments WHERE request_id=%s", (rid,))
            req["files"] = [{"id": r[0], "type": r[1], "name": r[2], "url": r[3], "created_at": r[4]} for r in cur.fetchall()]
            return resp(200, req)

        if action == "lk_request_update":
            rid = body.get("request_id")
            cur.execute("SELECT id,status FROM lk_requests WHERE id=%s", (rid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Заявка не найдена"})
            before = {"status": row[1]}
            fields, params = [], []
            if "status" in body: fields.append("status=%s"); params.append(body["status"])
            if "comment" in body: fields.append("admin_comment=%s"); params.append(body["comment"])
            if fields:
                cur.execute(f"UPDATE lk_requests SET {', '.join(fields)} WHERE id=%s", params + [rid])
                write_audit(cur, admin["id"], "request", rid, "update", before, body)
                conn.commit()
            return resp(200, {"success": True})

        # ── LK OFFERS ────────────────────────────────────────────────────
        if action == "lk_offers":
            q = body.get("q") or qs.get("q") or ""
            status = body.get("status") or qs.get("status") or ""
            where, params = ["1=1"], []
            if q:
                where.append("(u.email ILIKE %s OR org.name ILIKE %s OR r.invoice_number ILIKE %s)")
                params += [f"%{q}%"] * 3
            if status: where.append("o.status=%s"); params.append(status)
            wh = " AND ".join(where)
            cur.execute(f"""
                SELECT COUNT(*) FROM lk_offers o LEFT JOIN cabinet_users u ON u.id=o.created_by_user_id
                LEFT JOIN lk_organizations org ON org.id=o.org_id LEFT JOIN lk_requests r ON r.id=o.request_id WHERE {wh}
            """, params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT o.id,o.percent_fee,o.fx_rate,o.duration_workdays,o.pay_from_country,
                       o.status,o.created_at,u.email,u.contact_name,org.name,r.invoice_number,r.amount,r.currency
                FROM lk_offers o LEFT JOIN cabinet_users u ON u.id=o.created_by_user_id
                LEFT JOIN lk_organizations org ON org.id=o.org_id LEFT JOIN lk_requests r ON r.id=o.request_id
                WHERE {wh} ORDER BY o.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            offers = [{"id": r[0], "percent_fee": float(r[1]), "fx_rate": float(r[2]),
                       "duration_workdays": r[3], "pay_from_country": r[4], "status": r[5],
                       "created_at": r[6], "agent_email": r[7], "agent_name": r[8], "org_name": r[9],
                       "invoice_number": r[10], "amount": float(r[11]) if r[11] else None, "currency": r[12]}
                      for r in cur.fetchall()]
            return resp(200, {"offers": offers, "total": total, "page": page, "pages": -(-total // per_page)})

        if action == "lk_offer_update":
            oid = body.get("offer_id")
            cur.execute("SELECT id,status FROM lk_offers WHERE id=%s", (oid,))
            row = cur.fetchone()
            if not row: return resp(404, {"error": "Оффер не найден"})
            if "status" in body:
                cur.execute("UPDATE lk_offers SET status=%s WHERE id=%s", (body["status"], oid))
                write_audit(cur, admin["id"], "offer", oid, "update", {"status": row[1]}, body)
                conn.commit()
            return resp(200, {"success": True})

        # ── LK FILES ─────────────────────────────────────────────────────
        if action == "lk_files":
            q = body.get("q") or qs.get("q") or ""
            where, params = ["1=1"], []
            if q:
                where.append("(a.original_name ILIKE %s OR u.email ILIKE %s)"); params += [f"%{q}%"] * 2
            wh = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM lk_attachments a LEFT JOIN cabinet_users u ON u.id=a.uploaded_by_user_id WHERE {wh}", params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT a.id,a.request_id,a.file_type,a.original_name,a.url,a.file_size,a.created_at,u.email
                FROM lk_attachments a LEFT JOIN cabinet_users u ON u.id=a.uploaded_by_user_id
                WHERE {wh} ORDER BY a.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            files = [{"id": r[0], "request_id": r[1], "file_type": r[2], "name": r[3],
                      "url": r[4], "size": r[5], "created_at": r[6], "uploader_email": r[7]}
                     for r in cur.fetchall()]
            return resp(200, {"files": files, "total": total, "page": page, "pages": -(-total // per_page)})

        # ── LK AUDIT ─────────────────────────────────────────────────────
        if action == "lk_audit":
            q = body.get("q") or qs.get("q") or ""
            where, params = ["1=1"], []
            if q:
                where.append("(a.object_type ILIKE %s OR a.action ILIKE %s OR u.email ILIKE %s)")
                params += [f"%{q}%"] * 3
            wh = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM lk_audit_log a LEFT JOIN cabinet_users u ON u.id=a.admin_user_id WHERE {wh}", params)
            total = cur.fetchone()[0]
            cur.execute(f"""
                SELECT a.id,a.object_type,a.object_id,a.action,a.before_data,a.after_data,a.created_at,u.email,u.contact_name
                FROM lk_audit_log a LEFT JOIN cabinet_users u ON u.id=a.admin_user_id
                WHERE {wh} ORDER BY a.created_at DESC LIMIT %s OFFSET %s
            """, params + [per_page, offset])
            logs = [{"id": r[0], "object_type": r[1], "object_id": r[2], "action": r[3],
                     "before": r[4], "after": r[5], "created_at": r[6], "admin_email": r[7], "admin_name": r[8]}
                    for r in cur.fetchall()]
            return resp(200, {"logs": logs, "total": total, "page": page, "pages": -(-total // per_page)})

        # ── LK SETTINGS ──────────────────────────────────────────────────
        if action == "lk_settings_get":
            cur.execute("SELECT key,value,description FROM lk_platform_settings ORDER BY key")
            settings = [{"key": r[0], "value": r[1], "description": r[2]} for r in cur.fetchall()]
            return resp(200, {"settings": settings})

        if action == "lk_settings_save":
            key = body.get("key"); value = body.get("value")
            cur.execute("""
                INSERT INTO lk_platform_settings (key,value) VALUES (%s,%s)
                ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
            """, (key, json.dumps(value)))
            write_audit(cur, admin["id"], "settings", key, "update", None, {"key": key, "value": value})
            conn.commit()
            return resp(200, {"success": True})

        # ── LK DICTS ─────────────────────────────────────────────────────
        if action == "lk_dicts_currencies":
            cur.execute("SELECT code,name,symbol,is_active FROM lk_dict_currencies ORDER BY code")
            return resp(200, {"currencies": [{"code": r[0], "name": r[1], "symbol": r[2], "is_active": r[3]} for r in cur.fetchall()]})

        if action == "lk_dicts_save_currency":
            code = (body.get("code") or "").upper()
            cur.execute("""
                INSERT INTO lk_dict_currencies (code,name,symbol,is_active) VALUES (%s,%s,%s,%s)
                ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, symbol=EXCLUDED.symbol, is_active=EXCLUDED.is_active
            """, (code, body.get("name",""), body.get("symbol",""), body.get("is_active", True)))
            conn.commit()
            return resp(200, {"success": True})

        if action == "lk_dicts_countries":
            cur.execute("SELECT code,name,is_active FROM lk_dict_countries ORDER BY name")
            return resp(200, {"countries": [{"code": r[0], "name": r[1], "is_active": r[2]} for r in cur.fetchall()]})

        # ── LK NOTIFICATIONS BROADCAST ────────────────────────────────────
        if action == "lk_notifications_broadcast":
            title = body.get("title",""); body_text = body.get("body","")
            user_ids = body.get("user_ids")
            if not title: return resp(400, {"error": "Укажите заголовок"})
            if user_ids:
                for uid in user_ids:
                    cur.execute("INSERT INTO lk_notifications (user_id,type,title,body) VALUES (%s,'admin_broadcast',%s,%s)", (uid, title, body_text))
            else:
                cur.execute("INSERT INTO lk_notifications (user_id,type,title,body) SELECT id,'admin_broadcast',%s,%s FROM cabinet_users WHERE is_active=TRUE", (title, body_text))
            conn.commit()
            return resp(200, {"success": True})

        # ── LK REPORTS ───────────────────────────────────────────────────
        if action == "lk_reports_queue":
            report_type = body.get("report_type","requests")
            cur.execute("INSERT INTO lk_export_queue (admin_user_id,report_type,params,status) VALUES (%s,%s,%s,'pending') RETURNING id",
                        (admin["id"], report_type, json.dumps(body.get("params",{}))))
            queue_id = cur.fetchone()[0]
            conn.commit()
            return resp(200, {"success": True, "queue_id": queue_id})

        if action == "lk_reports_list":
            cur.execute("SELECT id,report_type,params,status,download_url,created_at,completed_at FROM lk_export_queue WHERE admin_user_id=%s ORDER BY created_at DESC LIMIT 20", (admin["id"],))
            reports = [{"id": r[0], "report_type": r[1], "params": r[2], "status": r[3],
                        "download_url": r[4], "created_at": r[5], "completed_at": r[6]} for r in cur.fetchall()]
            return resp(200, {"reports": reports})

        return resp(400, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()