import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

const STATUSES = ["", "draft", "awaiting_offers", "choosing_offer", "awaiting_payment", "paid", "completed", "cancelled", "expired"];
const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик", awaiting_offers: "Ждёт офферов", choosing_offer: "Выбор оффера",
  awaiting_payment: "Ждёт оплаты", paid: "Оплачена", completed: "Завершена",
  cancelled: "Отменена", expired: "Истекла",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8", awaiting_offers: "#3b82f6", choosing_offer: "#8b5cf6",
  awaiting_payment: "#f59e0b", paid: "#10b981", completed: "#059669", cancelled: "#ef4444", expired: "#6b7280",
};
const CURRENCIES = ["", "USD", "EUR", "CNY", "AED", "GBP", "RUB", "TRY", "INR"];

interface Request {
  id: string; invoice_number: string; amount: number; currency: string; status: string;
  description: string; offers_until: string; created_at: string;
  client_email: string; client_name: string; offers_count: number;
}

export default function AdminRequests() {
  const [items, setItems] = useState<Request[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.requests({ q, status, currency, page });
      setItems(res.requests || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally { setLoading(false); }
  }, [q, status, currency, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    const d = await adminApi.requestDetail(id);
    setSelected(d);
    setNewStatus(d.status as string);
    setComment((d.admin_comment as string) || "");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await adminApi.requestUpdate(selected.id as string, { status: newStatus, comment });
    setSaving(false);
    load();
    setSelected(prev => prev ? { ...prev, status: newStatus, admin_comment: comment } : prev);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Заявки</h1>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Всего: {total}</div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по инвойсу, описанию, email..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? STATUS_LABELS[s] : "Все статусы"}</option>)}
        </select>
        <select value={currency} onChange={e => { setCurrency(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c || "Все валюты"}</option>)}
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Инвойс", "Сумма", "Статус", "Клиент", "Офферов", "Дата", ""].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</td></tr>
            ) : items.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{r.invoice_number}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#1e293b" }}>
                  {r.amount.toLocaleString("ru-RU")} {r.currency}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{r.client_name || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{r.client_email}</div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{r.offers_count}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString("ru-RU") : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => openDetail(r.id)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "transparent", fontSize: "0.75rem", cursor: "pointer" }}>
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e2e8f0", background: p === page ? "#2563eb" : "#fff", color: p === page ? "#fff" : "#374151", fontSize: "0.82rem", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Детальная панель */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setSelected(null)}>
          <div style={{ width: 520, background: "#fff", height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{selected.invoice_number as string}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{(selected.amount as number)?.toLocaleString()} {selected.currency as string}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <Icon name="X" size={20} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 4 }}>Описание</div>
                <div style={{ fontSize: "0.85rem", color: "#374151" }}>{selected.description as string || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[["Клиент", selected.client_email], ["Компания", selected.company_name]].map(([l, v]) => (
                  <div key={l as string}>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{l}</div>
                    <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{v as string || "—"}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Изменить статус</div>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
                  {STATUSES.filter(s => s).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Комментарий администратора</div>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button onClick={save} disabled={saving}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>

              {/* Офферы */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151", marginBottom: 10 }}>
                  Офферы ({(selected.offers as unknown[])?.length || 0})
                </div>
                {((selected.offers as { id: string; percent_fee: number; fx_rate: number; duration_workdays: number; pay_from_country: string; status: string; agent_email: string; org_name: string }[]) || []).map(o => (
                  <div key={o.id} style={{ background: "#f8fafc", borderRadius: 8, padding: "12px", marginBottom: 8, fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{o.org_name || o.agent_email}</span>
                      <span style={{ color: STATUS_COLORS[o.status] || "#94a3b8", fontWeight: 600 }}>{o.status}</span>
                    </div>
                    <div style={{ color: "#64748b" }}>
                      Комиссия: {o.percent_fee}% · Курс: {o.fx_rate} · {o.duration_workdays} р.дн. · {o.pay_from_country}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
