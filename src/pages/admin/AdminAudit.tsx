import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";

interface AuditLog {
  id: number; object_type: string; object_id: string; action: string;
  before: Record<string, unknown>; after: Record<string, unknown>;
  created_at: string; admin_email: string; admin_name: string;
}

const TYPE_COLORS: Record<string, string> = {
  user: "#3b82f6", org: "#7c3aed", request: "#f59e0b",
  offer: "#059669", settings: "#0891b2", company: "#ec4899",
};

export default function AdminAudit() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.audit({ q, page });
      setItems(res.logs || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Журнал аудита</h1>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Всего записей: {total}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по типу, действию, email..."
          style={{ width: 360, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && <div style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>Загрузка...</div>}
        {!loading && items.length === 0 && <div style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>Записей нет</div>}
        {items.map(log => (
          <div key={log.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
              onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: `${TYPE_COLORS[log.object_type] || "#94a3b8"}20`, color: TYPE_COLORS[log.object_type] || "#94a3b8" }}>
                {log.object_type}
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" }}>{log.action}</span>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>#{log.object_id}</span>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94a3b8" }}>
                {log.admin_email} · {log.created_at ? new Date(log.created_at).toLocaleString("ru-RU") : "—"}
              </span>
            </div>
            {expanded === log.id && (
              <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>ДО</div>
                  <pre style={{ fontSize: "0.75rem", color: "#374151", background: "#f8fafc", borderRadius: 8, padding: 12, overflow: "auto", margin: 0 }}>
                    {log.before ? JSON.stringify(log.before, null, 2) : "—"}
                  </pre>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>ПОСЛЕ</div>
                  <pre style={{ fontSize: "0.75rem", color: "#374151", background: "#f0fdf4", borderRadius: 8, padding: 12, overflow: "auto", margin: 0 }}>
                    {log.after ? JSON.stringify(log.after, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
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
