import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";

interface Company {
  id: string; name: string; inn: string; kpp: string;
  owner_email: string; owner_name: string; created_at: string; requests_count: number;
}

export default function AdminCompanies() {
  const [items, setItems] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.companies({ q, page });
      setItems(res.companies || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Компании клиентов</h1>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Всего: {total}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по названию, ИНН..."
          style={{ width: 320, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Название", "ИНН / КПП", "Владелец", "Заявок", "Дата"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</td></tr>
            ) : items.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#374151" }}>{c.inn}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{c.kpp || "—"}</div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{c.owner_name || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{c.owner_email}</div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{c.requests_count}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                  {c.created_at ? new Date(c.created_at).toLocaleDateString("ru-RU") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
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
