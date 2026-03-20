import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";

interface FileItem {
  id: string; request_id: string; file_type: string; name: string;
  url: string; size: number; created_at: string; uploader_email: string;
}

export default function AdminFiles() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.files({ q, page });
      setItems(res.files || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  const fmtSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
    return `${Math.round(bytes / 1024)} КБ`;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Файлы</h1>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Журнал загрузок · Всего: {total}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по имени файла, email..."
          style={{ width: 320, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Файл", "Тип", "Загрузил", "Размер", "Дата", ""].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Файлов нет</td></tr>
            ) : items.map(f => (
              <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#0f172a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#374151" }}>{f.file_type}</span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: "#64748b" }}>{f.uploader_email || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: "#94a3b8" }}>{fmtSize(f.size)}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                  {f.created_at ? new Date(f.created_at).toLocaleDateString("ru-RU") : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "0.75rem", color: "#2563eb", textDecoration: "none" }}>
                      Скачать
                    </a>
                  )}
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
