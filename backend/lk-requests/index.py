"""
ЛК Заявки + Офферы: всё в одной функции.
=== ЗАЯВКИ ===
action=list              — список заявок (клиент: свои; агент: опубликованные)
action=get               { request_id } — детали заявки
action=create            { company_id, amount, currency, invoice_number, invoice_date, description }
action=publish           { request_id, offers_until? }
action=update            { request_id, ... }
action=select_offer      { request_id, offer_id }
action=mark_paid         { request_id }
action=cancel            { request_id }
action=get_contract      { request_id }
=== КОМПАНИИ ===
action=companies         — список компаний клиента
action=create_company    { name, inn, kpp, address, email, phone, requisites }
action=update_company    { company_id, ... }
=== ОФФЕРЫ ===
action=offers_mine       — мои предложения (агент)
action=offer_create      { request_id, percent_fee, fx_rate, duration_workdays, pay_from_country, use_nonresident_route, comment, agent_contract_url }
action=offer_update      { offer_id, ... }
action=offer_withdraw    { offer_id }
action=offers_export     — данные для экспорта (ADMIN/OWNER)
"""
import json, os, psycopg2, boto3, base64, uuid, mimetypes
import smtplib, ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta


def send_email(to_email: str, subject: str, html_body: str) -> None:
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
        pass


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


def get_user_email(cur, user_id: int) -> str:
    cur.execute("SELECT email, contact_name FROM cabinet_users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    return (row[0] or "", row[1] or "") if row else ("", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_token(event: dict) -> str:
    h = event.get("headers") or {}
    return (h.get("X-Auth-Token") or h.get("x-auth-token") or
            h.get("X-Authorization", "").replace("Bearer ", "") or
            h.get("Authorization", "").replace("Bearer ", "") or "").strip()


def user_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.email, u.contact_name, u.lk_role
           FROM cabinet_sessions s JOIN cabinet_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "full_name": row[2], "lk_role": row[3] or "CLIENT"}


def get_agent_org(cur, user_id):
    cur.execute(
        """SELECT org_id, role FROM lk_org_memberships
           WHERE user_id = %s AND is_active = TRUE LIMIT 1""",
        (user_id,),
    )
    row = cur.fetchone()
    return (str(row[0]), row[1]) if row else (None, None)


def notify(cur, user_id, type_, title, body, payload=None):
    cur.execute(
        "INSERT INTO lk_notifications (user_id, type, title, body, payload) VALUES (%s,%s,%s,%s,%s)",
        (user_id, type_, title, body, json.dumps(payload or {})),
    )


STATUS_LABELS = {
    "draft": "Черновик",
    "awaiting_offers": "Ожидает предложений",
    "choosing_offer": "Выбор предложения",
    "awaiting_payment": "Ожидает оплаты",
    "paid": "Оплачено",
    "completed": "Завершено",
    "cancelled": "Отменено",
    "expired": "Истёк срок",
}

CURRENCY_LABELS = {"USD": "$", "EUR": "€", "CNY": "¥", "AED": "د.إ", "GBP": "£", "RUB": "₽"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Authorization, Authorization",
}


def resp(code, data):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def mask_contacts(contacts: dict, reveal: bool) -> dict:
    if reveal:
        return contacts
    masked = {}
    for k, v in contacts.items():
        masked[k] = "—скрыто—"
    return masked


def handler(event: dict, context) -> dict:
    """ЛК: управление заявками и компаниями клиента."""
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

        role = user["lk_role"]

        # ── LIST REQUESTS ─────────────────────────────────────────────────
        if action == "list":
            status_filter = qs.get("status") or body.get("status")
            page = int(qs.get("page") or body.get("page") or 1)
            limit = 20
            offset = (page - 1) * limit

            if role == "CLIENT":
                where = "r.created_by_user_id = %s"
                params = [user["id"]]
                if status_filter:
                    where += " AND r.status = %s"
                    params.append(status_filter)
                cur.execute(
                    f"""SELECT r.id, r.amount, r.currency, r.status, r.invoice_number, r.invoice_date,
                               r.description, r.created_at, r.updated_at, r.offers_until, r.selected_offer_id,
                               c.name as company_name,
                               (SELECT COUNT(*) FROM lk_offers o WHERE o.request_id = r.id AND o.status = 'active') as offers_count
                        FROM lk_requests r LEFT JOIN lk_companies c ON c.id = r.company_id
                        WHERE {where} ORDER BY r.created_at DESC LIMIT %s OFFSET %s""",
                    params + [limit, offset],
                )
            else:
                # Агент видит только опубликованные заявки
                pub_statuses = ("awaiting_offers", "choosing_offer")
                where = "r.status = ANY(%s)"
                params = [list(pub_statuses)]
                if status_filter and status_filter in pub_statuses:
                    where = "r.status = %s"
                    params = [status_filter]
                cur.execute(
                    f"""SELECT r.id, r.amount, r.currency, r.status, r.invoice_number, r.invoice_date,
                               r.description, r.created_at, r.updated_at, r.offers_until, r.selected_offer_id,
                               c.name as company_name,
                               (SELECT COUNT(*) FROM lk_offers o WHERE o.request_id = r.id AND o.status = 'active') as offers_count
                        FROM lk_requests r LEFT JOIN lk_companies c ON c.id = r.company_id
                        WHERE {where} ORDER BY r.created_at DESC LIMIT %s OFFSET %s""",
                    params + [limit, offset],
                )

            items = []
            for r in cur.fetchall():
                items.append({
                    "id": str(r[0]), "amount": float(r[1]), "currency": r[2],
                    "status": r[3], "status_label": STATUS_LABELS.get(r[3], r[3]),
                    "invoice_number": r[4], "invoice_date": str(r[5]) if r[5] else None,
                    "description": r[6], "created_at": str(r[7]), "updated_at": str(r[8]),
                    "offers_until": str(r[9]) if r[9] else None,
                    "selected_offer_id": str(r[10]) if r[10] else None,
                    "company_name": r[11], "offers_count": int(r[12]),
                })
            return resp(200, {"requests": items, "page": page})

        # ── GET REQUEST ───────────────────────────────────────────────────
        if action == "get":
            request_id = body.get("request_id") or qs.get("request_id")
            if not request_id:
                return resp(400, {"error": "request_id обязателен"})

            cur.execute(
                """SELECT r.id, r.amount, r.currency, r.status, r.invoice_number, r.invoice_date,
                          r.description, r.created_at, r.updated_at, r.offers_until, r.payment_until,
                          r.selected_offer_id, r.created_by_user_id,
                          c.id as cid, c.name, c.inn, c.kpp, c.address, c.contacts, c.requisites
                   FROM lk_requests r LEFT JOIN lk_companies c ON c.id = r.company_id
                   WHERE r.id = %s""",
                (request_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})

            req_owner_id = row[12]
            req_status = row[3]
            selected_offer_id = str(row[11]) if row[11] else None

            # Агент видит заявку только если она опубликована
            if role == "AGENT":
                pub = ("awaiting_offers", "choosing_offer", "awaiting_payment", "paid", "completed")
                if req_status not in pub:
                    return resp(403, {"error": "Заявка недоступна"})
            elif role == "CLIENT" and req_owner_id != user["id"]:
                return resp(403, {"error": "Нет доступа"})

            # Маскируем контакты для агентов до выбора оффера
            contacts_raw = row[18] or {}
            if role == "AGENT":
                org_id, org_role = get_agent_org(cur, user["id"])
                reveal = False
                if selected_offer_id:
                    cur.execute("SELECT org_id FROM lk_offers WHERE id = %s", (selected_offer_id,))
                    sel_row = cur.fetchone()
                    if sel_row and org_id and str(sel_row[0]) == org_id:
                        reveal = True
                contacts_show = mask_contacts(contacts_raw, reveal)
            else:
                contacts_show = contacts_raw

            # Офферы
            if role == "CLIENT" or (role == "AGENT"):
                cur.execute(
                    """SELECT o.id, o.percent_fee, o.fx_rate, o.duration_workdays, o.pay_from_country,
                              o.use_nonresident_route, o.status, o.created_at, o.valid_until, o.comment,
                              o.agent_contract_url,
                              org.name as org_name
                       FROM lk_offers o LEFT JOIN lk_organizations org ON org.id = o.org_id
                       WHERE o.request_id = %s ORDER BY o.created_at DESC""",
                    (request_id,),
                )
                offers = []
                agent_org_id, _ = get_agent_org(cur, user["id"]) if role == "AGENT" else (None, None)
                for o in cur.fetchall():
                    is_mine = role == "AGENT" and agent_org_id and str(o[0]) in (
                        str(x[0]) for x in offers
                    )
                    offers.append({
                        "id": str(o[0]), "percent_fee": float(o[1]),
                        "fx_rate": float(o[2]) if o[2] else None,
                        "duration_workdays": o[3], "pay_from_country": o[4],
                        "use_nonresident_route": o[5], "status": o[6],
                        "created_at": str(o[7]),
                        "valid_until": str(o[8]) if o[8] else None,
                        "comment": o[9], "agent_contract_url": o[10],
                        "org_name": o[11],
                        "is_selected": selected_offer_id == str(o[0]),
                    })
            else:
                offers = []

            # Вложения
            cur.execute(
                """SELECT id, type, filename, mime, size, file_url, created_at
                   FROM lk_attachments WHERE request_id = %s ORDER BY created_at""",
                (request_id,),
            )
            attachments = []
            for a in cur.fetchall():
                attachments.append({"id": str(a[0]), "type": a[1], "filename": a[2],
                                     "mime": a[3], "size": a[4], "file_url": a[5],
                                     "created_at": str(a[6])})

            # Договор
            contract = None
            if req_status in ("awaiting_payment", "paid", "completed") and selected_offer_id:
                cur.execute(
                    "SELECT id, contract_file_url, requisites_snapshot, created_at FROM lk_contracts WHERE request_id = %s LIMIT 1",
                    (request_id,),
                )
                cr = cur.fetchone()
                if cr:
                    contract = {"id": str(cr[0]), "contract_file_url": cr[1],
                                 "requisites_snapshot": cr[2] or {}, "created_at": str(cr[3])}

            return resp(200, {
                "request": {
                    "id": str(row[0]), "amount": float(row[1]), "currency": row[2],
                    "status": row[3], "status_label": STATUS_LABELS.get(row[3], row[3]),
                    "invoice_number": row[4], "invoice_date": str(row[5]) if row[5] else None,
                    "description": row[6], "created_at": str(row[7]), "updated_at": str(row[8]),
                    "offers_until": str(row[9]) if row[9] else None,
                    "payment_until": str(row[10]) if row[10] else None,
                    "selected_offer_id": selected_offer_id,
                    "company": {
                        "id": str(row[13]) if row[13] else None, "name": row[14],
                        "inn": row[15], "kpp": row[16], "address": row[17],
                        "contacts": contacts_show, "requisites": row[19] or {},
                    },
                    "offers": offers,
                    "attachments": attachments,
                    "contract": contract,
                    "can_edit": role == "CLIENT" and req_status in ("draft", "awaiting_offers"),
                    "can_publish": role == "CLIENT" and req_status == "draft",
                    "can_select_offer": role == "CLIENT" and req_status == "choosing_offer" and len([o for o in offers if o["status"] == "active"]) > 0,
                    "can_mark_paid": role == "CLIENT" and req_status == "awaiting_payment",
                    "can_cancel": role == "CLIENT" and req_status in ("draft", "awaiting_offers", "choosing_offer"),
                }
            })

        # ── CREATE REQUEST ────────────────────────────────────────────────
        if action == "create":
            if role != "CLIENT":
                return resp(403, {"error": "Только клиент может создавать заявки"})
            company_id = body.get("company_id")
            amount = body.get("amount")
            currency = body.get("currency", "USD")
            if not company_id or not amount:
                return resp(400, {"error": "company_id и amount обязательны"})
            # Проверяем что компания принадлежит клиенту
            cur.execute("SELECT id FROM lk_companies WHERE id = %s AND client_owner_user_id = %s",
                        (company_id, user["id"]))
            if not cur.fetchone():
                return resp(403, {"error": "Компания не найдена или нет доступа"})
            cur.execute(
                """INSERT INTO lk_requests (company_id, created_by_user_id, amount, currency,
                   invoice_number, invoice_date, description, status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,'draft') RETURNING id""",
                (company_id, user["id"], float(amount), currency,
                 body.get("invoice_number"), body.get("invoice_date"),
                 body.get("description")),
            )
            new_id = str(cur.fetchone()[0])
            conn.commit()
            return resp(200, {"success": True, "request_id": new_id})

        # ── PUBLISH REQUEST ───────────────────────────────────────────────
        if action == "publish":
            if role != "CLIENT":
                return resp(403, {"error": "Только клиент может публиковать заявки"})
            request_id = body.get("request_id")
            cur.execute("SELECT status FROM lk_requests WHERE id = %s AND created_by_user_id = %s",
                        (request_id, user["id"]))
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})
            if row[0] != "draft":
                return resp(400, {"error": "Можно публиковать только черновик"})
            offers_until = body.get("offers_until")
            cur.execute(
                "UPDATE lk_requests SET status='awaiting_offers', offers_until=%s, updated_at=NOW() WHERE id=%s",
                (offers_until, request_id),
            )
            conn.commit()
            return resp(200, {"success": True})

        # ── UPDATE REQUEST ────────────────────────────────────────────────
        if action == "update":
            if role != "CLIENT":
                return resp(403, {"error": "Нет доступа"})
            request_id = body.get("request_id")
            cur.execute("SELECT status FROM lk_requests WHERE id = %s AND created_by_user_id = %s",
                        (request_id, user["id"]))
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})
            if row[0] not in ("draft", "awaiting_offers"):
                return resp(400, {"error": "Нельзя редактировать заявку в текущем статусе"})
            fields = []
            vals = []
            for f in ("amount", "currency", "invoice_number", "description", "offers_until"):
                if f in body:
                    fields.append(f"{f}=%s")
                    vals.append(body[f])
            if body.get("invoice_date"):
                fields.append("invoice_date=%s")
                vals.append(body["invoice_date"])
            if fields:
                fields.append("updated_at=NOW()")
                cur.execute(f"UPDATE lk_requests SET {', '.join(fields)} WHERE id=%s",
                            vals + [request_id])
                conn.commit()
            return resp(200, {"success": True})

        # ── SELECT OFFER ──────────────────────────────────────────────────
        if action == "select_offer":
            if role != "CLIENT":
                return resp(403, {"error": "Только клиент может выбирать предложение"})
            request_id = body.get("request_id")
            offer_id = body.get("offer_id")
            cur.execute(
                "SELECT status FROM lk_requests WHERE id = %s AND created_by_user_id = %s",
                (request_id, user["id"]),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})
            if row[0] not in ("awaiting_offers", "choosing_offer"):
                return resp(400, {"error": "Выбор предложения недоступен в текущем статусе"})
            # Проверяем оффер
            cur.execute("SELECT id, org_id, percent_fee, fx_rate, use_nonresident_route, nonresident_requisites_snapshot FROM lk_offers WHERE id = %s AND request_id = %s AND status = 'active'",
                        (offer_id, request_id))
            offer_row = cur.fetchone()
            if not offer_row:
                return resp(404, {"error": "Предложение не найдено или уже неактивно"})
            # Обновляем статусы
            cur.execute(
                "UPDATE lk_requests SET status='awaiting_payment', selected_offer_id=%s, updated_at=NOW() WHERE id=%s",
                (offer_id, request_id),
            )
            cur.execute("UPDATE lk_offers SET status='selected', updated_at=NOW() WHERE id=%s", (offer_id,))
            cur.execute("UPDATE lk_offers SET status='rejected', updated_at=NOW() WHERE request_id=%s AND id != %s AND status='active'",
                        (request_id, offer_id))
            # Создаём контракт-запись
            org_id = offer_row[1]
            requisites_snapshot = {
                "percent_fee": float(offer_row[2]),
                "fx_rate": float(offer_row[3]) if offer_row[3] else None,
                "use_nonresident_route": offer_row[4],
                "nonresident_requisites": offer_row[5] or {},
            }
            cur.execute(
                "INSERT INTO lk_contracts (request_id, offer_id, requisites_snapshot) VALUES (%s,%s,%s)",
                (request_id, offer_id, json.dumps(requisites_snapshot)),
            )
            # Уведомление выбранному агенту
            cur.execute("SELECT created_by_user_id FROM lk_offers WHERE id = %s", (offer_id,))
            agent_user = cur.fetchone()
            if agent_user:
                notify(cur, agent_user[0], "offer_selected", "Ваше предложение выбрано!",
                       "Клиент выбрал ваше предложение. Теперь вам доступны контакты клиента.",
                       {"request_id": request_id, "offer_id": offer_id})
                a_email, a_name = get_user_email(cur, agent_user[0])
                if a_email:
                    # Получаем сумму заявки для письма
                    cur.execute("SELECT amount, currency FROM lk_requests WHERE id = %s", (request_id,))
                    req_info = cur.fetchone()
                    amount_str = f"{req_info[0]:,.2f} {req_info[1]}" if req_info else ""
                    send_email(a_email, "✓ Ваше предложение выбрано — ВалютаПэй",
                        email_html(
                            f"Поздравляем, {a_name or 'агент'}!",
                            f"Клиент выбрал ваше предложение по заявке на сумму <strong>{amount_str}</strong>.<br><br>"
                            "Теперь вам доступны контактные данные клиента для согласования деталей.<br><br>"
                            "Ожидайте подтверждения оплаты от клиента.",
                            "Открыть заявку",
                            f"https://poehali.dev/lk/agent/requests/{request_id}"
                        ))
            conn.commit()
            return resp(200, {"success": True})

        # ── MARK PAID ─────────────────────────────────────────────────────
        if action == "mark_paid":
            if role != "CLIENT":
                return resp(403, {"error": "Только клиент может отмечать оплату"})
            request_id = body.get("request_id")
            cur.execute(
                "SELECT status, selected_offer_id FROM lk_requests WHERE id = %s AND created_by_user_id = %s",
                (request_id, user["id"]),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})
            if row[0] != "awaiting_payment":
                return resp(400, {"error": "Заявка не в статусе ожидания оплаты"})
            cur.execute("UPDATE lk_requests SET status='paid', updated_at=NOW() WHERE id=%s",
                        (request_id,))
            # Уведомление агенту
            if row[1]:
                cur.execute("SELECT created_by_user_id FROM lk_offers WHERE id = %s", (str(row[1]),))
                agent_user = cur.fetchone()
                if agent_user:
                    notify(cur, agent_user[0], "payment_done", "Клиент подтвердил оплату",
                           "Клиент отметил заявку как оплаченную.",
                           {"request_id": request_id})
                    a_email, a_name = get_user_email(cur, agent_user[0])
                    if a_email:
                        cur.execute("SELECT amount, currency FROM lk_requests WHERE id = %s", (request_id,))
                        req_info = cur.fetchone()
                        amount_str = f"{req_info[0]:,.2f} {req_info[1]}" if req_info else ""
                        send_email(a_email, "✓ Клиент подтвердил оплату — ВалютаПэй",
                            email_html(
                                f"Оплата подтверждена, {a_name or 'агент'}!",
                                f"Клиент отметил заявку на сумму <strong>{amount_str}</strong> как оплаченную "
                                "и прикрепил платёжные документы.<br><br>"
                                "Проверьте документы и завершите сделку.",
                                "Открыть заявку",
                                f"https://poehali.dev/lk/agent/requests/{request_id}"
                            ))
            conn.commit()
            return resp(200, {"success": True})

        # ── CANCEL ───────────────────────────────────────────────────────
        if action == "cancel":
            if role != "CLIENT":
                return resp(403, {"error": "Нет доступа"})
            request_id = body.get("request_id")
            cur.execute(
                "SELECT status FROM lk_requests WHERE id = %s AND created_by_user_id = %s",
                (request_id, user["id"]),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})
            if row[0] in ("paid", "completed", "cancelled"):
                return resp(400, {"error": "Нельзя отменить заявку в текущем статусе"})
            cur.execute("UPDATE lk_requests SET status='cancelled', updated_at=NOW() WHERE id=%s",
                        (request_id,))
            cur.execute("UPDATE lk_offers SET status='expired', updated_at=NOW() WHERE request_id=%s AND status='active'",
                        (request_id,))
            conn.commit()
            return resp(200, {"success": True})

        # ── COMPANIES ─────────────────────────────────────────────────────
        if action == "companies":
            if role != "CLIENT":
                return resp(403, {"error": "Нет доступа"})
            cur.execute(
                """SELECT id, name, inn, kpp, address, contacts, requisites, created_at
                   FROM lk_companies WHERE client_owner_user_id = %s AND is_active = TRUE
                   ORDER BY created_at DESC""",
                (user["id"],),
            )
            items = []
            for r in cur.fetchall():
                items.append({"id": str(r[0]), "name": r[1], "inn": r[2], "kpp": r[3],
                               "address": r[4], "contacts": r[5] or {}, "requisites": r[6] or {},
                               "created_at": str(r[7])})
            return resp(200, {"companies": items})

        # ── CREATE COMPANY ────────────────────────────────────────────────
        if action == "create_company":
            if role != "CLIENT":
                return resp(403, {"error": "Нет доступа"})
            name = (body.get("name") or "").strip()
            if not name:
                return resp(400, {"error": "Название компании обязательно"})
            contacts = {"email": body.get("email", ""), "phone": body.get("phone", "")}
            requisites = body.get("requisites") or {}
            cur.execute(
                """INSERT INTO lk_companies (name, inn, kpp, address, contacts, requisites, client_owner_user_id)
                   VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (name, body.get("inn"), body.get("kpp"), body.get("address"),
                 json.dumps(contacts), json.dumps(requisites), user["id"]),
            )
            new_id = str(cur.fetchone()[0])
            conn.commit()
            return resp(200, {"success": True, "company_id": new_id})

        # ── UPDATE COMPANY ────────────────────────────────────────────────
        if action == "update_company":
            if role != "CLIENT":
                return resp(403, {"error": "Нет доступа"})
            company_id = body.get("company_id")
            cur.execute("SELECT id FROM lk_companies WHERE id = %s AND client_owner_user_id = %s",
                        (company_id, user["id"]))
            if not cur.fetchone():
                return resp(404, {"error": "Компания не найдена"})
            contacts = {"email": body.get("email", ""), "phone": body.get("phone", "")}
            requisites = body.get("requisites") or {}
            cur.execute(
                """UPDATE lk_companies SET name=%s, inn=%s, kpp=%s, address=%s, contacts=%s, requisites=%s
                   WHERE id=%s""",
                (body.get("name"), body.get("inn"), body.get("kpp"), body.get("address"),
                 json.dumps(contacts), json.dumps(requisites), company_id),
            )
            conn.commit()
            return resp(200, {"success": True})

        # ── GET CONTRACT ──────────────────────────────────────────────────
        if action == "get_contract":
            request_id = body.get("request_id") or qs.get("request_id")
            cur.execute(
                "SELECT status, selected_offer_id, created_by_user_id FROM lk_requests WHERE id = %s",
                (request_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Заявка не найдена"})
            if role == "CLIENT" and row[2] != user["id"]:
                return resp(403, {"error": "Нет доступа"})
            if role == "AGENT":
                org_id, _ = get_agent_org(cur, user["id"])
                if row[1]:
                    cur.execute("SELECT org_id FROM lk_offers WHERE id = %s", (str(row[1]),))
                    sel = cur.fetchone()
                    if not sel or str(sel[0]) != org_id:
                        return resp(403, {"error": "Нет доступа к договору"})
            cur.execute(
                "SELECT id, contract_file_url, requisites_snapshot, created_at FROM lk_contracts WHERE request_id = %s LIMIT 1",
                (request_id,),
            )
            cr = cur.fetchone()
            if not cr:
                return resp(404, {"error": "Договор ещё не сформирован"})
            return resp(200, {"contract": {"id": str(cr[0]), "contract_file_url": cr[1],
                                            "requisites_snapshot": cr[2] or {}, "created_at": str(cr[3])}})

        # ═══════════════════════════════════════════════════════════════
        # OFFERS SECTION
        # ═══════════════════════════════════════════════════════════════

        def workdays_to_date(days: int) -> str:
            now = datetime.now(timezone.utc)
            count = 0
            current = now
            while count < days:
                current += timedelta(days=1)
                if current.weekday() < 5:
                    count += 1
            return current.strftime("%d.%m.%Y")

        OFFER_STATUS_LABELS = {
            "active": "Активно", "withdrawn": "Отозвано",
            "expired": "Истёк срок", "selected": "Выбрано", "rejected": "Отклонено",
        }

        # ── OFFERS MINE ────────────────────────────────────────────────
        if action == "offers_mine":
            if role != "AGENT":
                return resp(403, {"error": "Только агент"})
            org_id, org_role = get_agent_org(cur, user["id"])
            if not org_id:
                return resp(403, {"error": "Организация не найдена"})
            if org_role in ("OWNER", "ADMIN"):
                cur.execute(
                    """SELECT o.id, o.request_id, o.percent_fee, o.fx_rate, o.duration_workdays,
                              o.pay_from_country, o.use_nonresident_route, o.status, o.created_at,
                              o.valid_until, o.comment, o.agent_contract_url,
                              r.amount, r.currency, r.invoice_number, r.status as req_status,
                              c.name as company_name, u.contact_name as creator_name
                       FROM lk_offers o
                       LEFT JOIN lk_requests r ON r.id = o.request_id
                       LEFT JOIN lk_companies c ON c.id = r.company_id
                       LEFT JOIN cabinet_users u ON u.id = o.created_by_user_id
                       WHERE o.org_id = %s ORDER BY o.created_at DESC LIMIT 100""",
                    (org_id,),
                )
            else:
                cur.execute(
                    """SELECT o.id, o.request_id, o.percent_fee, o.fx_rate, o.duration_workdays,
                              o.pay_from_country, o.use_nonresident_route, o.status, o.created_at,
                              o.valid_until, o.comment, o.agent_contract_url,
                              r.amount, r.currency, r.invoice_number, r.status as req_status,
                              c.name as company_name, u.contact_name as creator_name
                       FROM lk_offers o
                       LEFT JOIN lk_requests r ON r.id = o.request_id
                       LEFT JOIN lk_companies c ON c.id = r.company_id
                       LEFT JOIN cabinet_users u ON u.id = o.created_by_user_id
                       WHERE o.org_id = %s AND o.created_by_user_id = %s
                       ORDER BY o.created_at DESC LIMIT 100""",
                    (org_id, user["id"]),
                )
            items = []
            for r in cur.fetchall():
                items.append({
                    "id": str(r[0]), "request_id": str(r[1]),
                    "percent_fee": float(r[2]),
                    "fx_rate": float(r[3]) if r[3] else None,
                    "duration_workdays": r[4], "pay_from_country": r[5],
                    "use_nonresident_route": r[6], "status": r[7],
                    "status_label": OFFER_STATUS_LABELS.get(r[7], r[7]),
                    "created_at": str(r[8]),
                    "valid_until": str(r[9]) if r[9] else None,
                    "comment": r[10], "agent_contract_url": r[11],
                    "request_amount": float(r[12]) if r[12] else None,
                    "request_currency": r[13], "invoice_number": r[14],
                    "request_status": r[15], "company_name": r[16], "creator_name": r[17],
                    "completion_date": workdays_to_date(r[4]) if r[4] else None,
                })
            return resp(200, {"offers": items})

        # ── OFFER CREATE ───────────────────────────────────────────────
        if action == "offer_create":
            if role != "AGENT":
                return resp(403, {"error": "Только агент может отправлять предложения"})
            org_id, org_role = get_agent_org(cur, user["id"])
            if not org_id:
                return resp(403, {"error": "Организация не найдена"})
            if org_role == "OPERATOR":
                return resp(403, {"error": "Недостаточно прав"})
            request_id = body.get("request_id")
            percent_fee = body.get("percent_fee")
            duration_workdays = body.get("duration_workdays")
            if not request_id or percent_fee is None or not duration_workdays:
                return resp(400, {"error": "request_id, percent_fee, duration_workdays обязательны"})
            if not (0 < float(percent_fee) <= 100):
                return resp(400, {"error": "Процент должен быть от 0 до 100"})
            if not (1 <= int(duration_workdays) <= 90):
                return resp(400, {"error": "Срок должен быть от 1 до 90 рабочих дней"})
            cur.execute("SELECT status FROM lk_requests WHERE id = %s", (request_id,))
            req_row = cur.fetchone()
            if not req_row:
                return resp(404, {"error": "Заявка не найдена"})
            if req_row[0] not in ("awaiting_offers", "choosing_offer"):
                return resp(400, {"error": "Заявка не принимает новые предложения"})
            cur.execute("SELECT id FROM lk_offers WHERE request_id = %s AND org_id = %s AND status = 'active'",
                        (request_id, org_id))
            if cur.fetchone():
                return resp(409, {"error": "Вы уже отправили предложение по этой заявке"})
            use_nonresident = body.get("use_nonresident_route", False)
            nonresident_snapshot = {}
            if use_nonresident:
                cur.execute("SELECT nonresident_details, nonresident_payment_enabled FROM lk_organizations WHERE id = %s",
                            (org_id,))
                org_row = cur.fetchone()
                if org_row and org_row[1]:
                    nonresident_snapshot = org_row[0] or {}
            cur.execute(
                """INSERT INTO lk_offers (request_id, org_id, created_by_user_id, percent_fee, fx_rate,
                   duration_workdays, pay_from_country, use_nonresident_route,
                   nonresident_requisites_snapshot, agent_contract_url, comment, status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'active') RETURNING id""",
                (request_id, org_id, user["id"], float(percent_fee),
                 body.get("fx_rate"), int(duration_workdays),
                 body.get("pay_from_country"), use_nonresident,
                 json.dumps(nonresident_snapshot), body.get("agent_contract_url"),
                 body.get("comment")),
            )
            new_offer_id = str(cur.fetchone()[0])
            cur.execute(
                "UPDATE lk_requests SET status='choosing_offer', updated_at=NOW() WHERE id=%s AND status='awaiting_offers'",
                (request_id,),
            )
            cur.execute("SELECT created_by_user_id FROM lk_requests WHERE id = %s", (request_id,))
            client_row = cur.fetchone()
            if client_row:
                notify(cur, client_row[0], "new_offer", "Новое предложение по заявке",
                       f"Получено новое предложение: {percent_fee}% комиссии, срок {duration_workdays} р. дней.",
                       {"request_id": request_id, "offer_id": new_offer_id})
                c_email, c_name = get_user_email(cur, client_row[0])
                if c_email:
                    send_email(c_email, "Новое предложение по вашей заявке — ВалютаПэй",
                        email_html(
                            f"Новое предложение, {c_name or 'уважаемый клиент'}!",
                            f"По вашей заявке получено новое предложение от платёжного агента:<br><br>"
                            f"<strong>Комиссия:</strong> {percent_fee}%<br>"
                            f"<strong>Срок:</strong> {duration_workdays} рабочих дней<br><br>"
                            "Войдите в личный кабинет, чтобы просмотреть все предложения и выбрать лучшее.",
                            "Открыть заявку",
                            f"https://poehali.dev/lk/requests/{request_id}"
                        ))
            conn.commit()
            return resp(200, {"success": True, "offer_id": new_offer_id})

        # ── OFFER UPDATE ───────────────────────────────────────────────
        if action == "offer_update":
            if role != "AGENT":
                return resp(403, {"error": "Нет доступа"})
            offer_id = body.get("offer_id")
            org_id, _ = get_agent_org(cur, user["id"])
            cur.execute("SELECT status FROM lk_offers WHERE id = %s AND org_id = %s",
                        (offer_id, org_id))
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Предложение не найдено"})
            if row[0] != "active":
                return resp(400, {"error": "Нельзя редактировать неактивное предложение"})
            fields, vals = [], []
            for f in ("percent_fee", "fx_rate", "duration_workdays", "pay_from_country", "comment", "agent_contract_url"):
                if f in body:
                    fields.append(f"{f}=%s")
                    vals.append(body[f])
            if fields:
                fields.append("updated_at=NOW()")
                cur.execute(f"UPDATE lk_offers SET {', '.join(fields)} WHERE id=%s",
                            vals + [offer_id])
                conn.commit()
            return resp(200, {"success": True})

        # ── OFFER WITHDRAW ─────────────────────────────────────────────
        if action == "offer_withdraw":
            if role != "AGENT":
                return resp(403, {"error": "Нет доступа"})
            offer_id = body.get("offer_id")
            org_id, _ = get_agent_org(cur, user["id"])
            cur.execute("SELECT status FROM lk_offers WHERE id = %s AND org_id = %s",
                        (offer_id, org_id))
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Предложение не найдено"})
            if row[0] != "active":
                return resp(400, {"error": "Можно отозвать только активное предложение"})
            cur.execute("UPDATE lk_offers SET status='withdrawn', updated_at=NOW() WHERE id=%s", (offer_id,))
            conn.commit()
            return resp(200, {"success": True})

        # ── OFFERS EXPORT ──────────────────────────────────────────────
        if action == "offers_export":
            if role != "AGENT":
                return resp(403, {"error": "Только агент"})
            org_id, org_role = get_agent_org(cur, user["id"])
            if not org_id or org_role not in ("OWNER", "ADMIN"):
                return resp(403, {"error": "Только администратор организации"})
            cur.execute(
                """SELECT o.id, r.id as req_id, c.name, r.amount, r.currency,
                          r.status as req_status, o.percent_fee, o.fx_rate, o.duration_workdays,
                          o.pay_from_country, o.use_nonresident_route,
                          ROUND(r.amount * o.percent_fee / 100, 2) as commission,
                          o.status as offer_status, o.created_at
                   FROM lk_offers o
                   JOIN lk_requests r ON r.id = o.request_id
                   LEFT JOIN lk_companies c ON c.id = r.company_id
                   WHERE o.org_id = %s ORDER BY o.created_at DESC""",
                (org_id,),
            )
            rows = []
            for r in cur.fetchall():
                rows.append({
                    "offer_id": str(r[0]), "request_id": str(r[1]), "company": r[2],
                    "amount": float(r[3]) if r[3] else 0, "currency": r[4],
                    "request_status": r[5], "percent_fee": float(r[6]),
                    "fx_rate": float(r[7]) if r[7] else None,
                    "duration_workdays": r[8], "country": r[9], "nonresident": r[10],
                    "commission": float(r[11]) if r[11] else 0,
                    "offer_status": r[12], "created_at": str(r[13]),
                })
            return resp(200, {"export": rows})

        # ═══════════════════════════════════════════════════════════════
        # FILES SECTION
        # action=upload_file { file_b64, filename, file_type, request_id?, offer_id? }
        # action=delete_file { attachment_id }
        # ═══════════════════════════════════════════════════════════════

        def get_s3():
            return boto3.client(
                "s3",
                endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
            )

        if action == "upload_file":
            file_b64 = body.get("file_b64") or ""
            filename = (body.get("filename") or "file").strip()
            file_type = body.get("file_type", "DOC")
            request_id = body.get("request_id")
            offer_id = body.get("offer_id")

            if not file_b64:
                return resp(400, {"error": "file_b64 обязателен"})

            # Validate type
            allowed_types = ("INVOICE", "DOC", "AGENT_CONTRACT", "PAYMENT_PROOF", "SIGNED_CONTRACT", "CONTRACT")
            if file_type not in allowed_types:
                return resp(400, {"error": f"Недопустимый тип файла. Допустимые: {', '.join(allowed_types)}"})

            # Decode base64
            try:
                # Strip data URI prefix if present
                if "," in file_b64:
                    file_b64 = file_b64.split(",", 1)[1]
                file_bytes = base64.b64decode(file_b64)
            except Exception:
                return resp(400, {"error": "Неверный формат файла (ожидается base64)"})

            # Size limit: 20 MB
            if len(file_bytes) > 20 * 1024 * 1024:
                return resp(400, {"error": "Файл слишком большой. Максимум 20 МБ"})

            # Detect mime
            mime_type, _ = mimetypes.guess_type(filename)
            if not mime_type:
                mime_type = "application/octet-stream"

            # Only pdf/jpg/png/xlsx allowed
            allowed_mimes = (
                "application/pdf",
                "image/jpeg", "image/jpg", "image/png",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
            )
            if mime_type not in allowed_mimes:
                return resp(400, {"error": "Допустимые форматы: PDF, JPG, PNG, XLSX"})

            # Verify request/offer ownership
            if request_id:
                if role == "CLIENT":
                    cur.execute("SELECT id FROM lk_requests WHERE id = %s AND created_by_user_id = %s",
                                (request_id, user["id"]))
                else:
                    cur.execute("SELECT id FROM lk_requests WHERE id = %s", (request_id,))
                if not cur.fetchone():
                    return resp(403, {"error": "Нет доступа к заявке"})

            if offer_id:
                org_id, _ = get_agent_org(cur, user["id"])
                cur.execute("SELECT id FROM lk_offers WHERE id = %s AND org_id = %s",
                            (offer_id, org_id))
                if not cur.fetchone():
                    return resp(403, {"error": "Нет доступа к предложению"})

            # Upload to S3
            file_id = str(uuid.uuid4())
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
            storage_key = f"lk/{file_type.lower()}/{file_id}.{ext}"

            try:
                s3 = get_s3()
                s3.put_object(
                    Bucket="files",
                    Key=storage_key,
                    Body=file_bytes,
                    ContentType=mime_type,
                    ContentDisposition=f'inline; filename="{filename}"',
                )
            except Exception as e:
                return resp(500, {"error": f"Ошибка загрузки файла: {str(e)}"})

            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{storage_key}"

            # Save to DB
            org_id_val = None
            if role == "AGENT":
                org_id_val, _ = get_agent_org(cur, user["id"])

            cur.execute(
                """INSERT INTO lk_attachments
                   (id, owner_user_id, org_id, request_id, offer_id, type, filename, mime, size, storage_key, file_url)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (file_id, user["id"], org_id_val, request_id, offer_id,
                 file_type, filename, mime_type, len(file_bytes),
                 storage_key, cdn_url),
            )
            conn.commit()

            return resp(200, {
                "success": True,
                "attachment": {
                    "id": file_id,
                    "filename": filename,
                    "file_url": cdn_url,
                    "mime": mime_type,
                    "size": len(file_bytes),
                    "type": file_type,
                }
            })

        if action == "delete_file":
            attachment_id = body.get("attachment_id")
            cur.execute(
                "SELECT storage_key, owner_user_id FROM lk_attachments WHERE id = %s",
                (attachment_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Файл не найден"})
            if row[1] != user["id"]:
                return resp(403, {"error": "Нет доступа"})

            # Delete from S3
            try:
                s3 = get_s3()
                s3.delete_object(Bucket="files", Key=row[0])
            except Exception:
                pass  # не критично если не удалось

            cur.execute("UPDATE lk_attachments SET storage_key=NULL, file_url=NULL WHERE id=%s",
                        (attachment_id,))
            conn.commit()
            return resp(200, {"success": True})

        return resp(400, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()