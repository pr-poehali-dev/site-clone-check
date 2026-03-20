import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";

const STATUSES = ["", "active", "selected", "withdrawn", "expired"];
const STATUS_COLORS: Record<string, string> = {
  active: "#3b82f6", selected: "#059669", withdrawn: "#94a3b8", expired: "#ef4444",
};

interface Offer {
  id: string; percent_fee: number; fx_rate: number; duration_workdays: number;
  pay_from_country: string; status: string; created_at: string;
  agent_email: string; agent_name: string; org_name: string;
  invoice_number: string; amount: number; currency: string;
}

export default function AdminOffers() {
  const [items, setItems] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.offers({ q, status, page });
      setItems(res.offers || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally { setLoading(false); }
  }, [q, status, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Офферы</h1>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Всего: {total}</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по агенту, инвойсу..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || "Все статусы"}</option>)}
        </select>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Инвойс", "Агент / Орг", "Комиссия", "Курс", "Срок", "Статус", "Дата"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</td></tr>
            ) : items.map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{o.invoice_number || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{o.amount?.toLocaleString()} {o.currency}</div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{o.org_name || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{o.agent_email}</div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>{o.percent_fee}%</td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{o.fx_rate}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{o.duration_workdays} р.дн.</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${STATUS_COLORS[o.status] || "#94a3b8"}20`, color: STATUS_COLORS[o.status] || "#94a3b8" }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                  {o.created_at ? new Date(o.created_at).toLocaleDateString("ru-RU") : "—"}
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
    </div>
  );
}
