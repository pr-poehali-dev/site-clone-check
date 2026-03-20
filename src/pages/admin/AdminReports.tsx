import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

const REPORT_TYPES = [
  { value: "requests", label: "Заявки", desc: "Все заявки с фильтрацией по статусу и валюте" },
  { value: "offers", label: "Офферы", desc: "Все офферы агентов" },
  { value: "users", label: "Пользователи", desc: "Реестр пользователей платформы" },
  { value: "companies", label: "Компании", desc: "Реестр компаний клиентов" },
];

interface Report {
  id: number; report_type: string; params: unknown; status: string;
  download_url: string; created_at: string; completed_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", done: "#059669", error: "#ef4444",
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedType, setSelectedType] = useState("requests");
  const [loading, setLoading] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    adminApi.reportsList().then(r => setReports(r.reports || [])).finally(() => setLoading(false));
  }, []);

  const queue = async () => {
    setQueuing(true);
    await adminApi.reportsQueue(selectedType);
    const r = await adminApi.reportsList();
    setReports(r.reports || []);
    setMsg("Запрос на выгрузку поставлен в очередь");
    setQueuing(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Экспорт данных</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {REPORT_TYPES.map(rt => (
            <div key={rt.value} onClick={() => setSelectedType(rt.value)}
              style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: `2px solid ${selectedType === rt.value ? "#2563eb" : "#e2e8f0"}`, cursor: "pointer", transition: "border-color 0.15s" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 4 }}>{rt.label}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{rt.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 8 }}>
            Выбрано: {REPORT_TYPES.find(r => r.value === selectedType)?.label}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 20 }}>
            Выгрузка формируется асинхронно. Ссылка на скачивание появится в истории.
          </div>
          {msg && <div style={{ color: "#059669", fontSize: "0.82rem", marginBottom: 12 }}>{msg}</div>}
          <button onClick={queue} disabled={queuing}
            style={{ padding: "10px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
            {queuing ? "Постановка в очередь..." : "Сформировать выгрузку"}
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#374151", marginBottom: 12 }}>История выгрузок</div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Выгрузок пока нет</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Тип", "Статус", "Создан", "Готов", "Файл"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: "#94a3b8" }}>#{r.id}</td>
                    <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>
                      {REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: STATUS_COLORS[r.status] || "#94a3b8" }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString("ru-RU") : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                      {r.completed_at ? new Date(r.completed_at).toLocaleString("ru-RU") : "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.download_url ? (
                        <a href={r.download_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                          Скачать
                        </a>
                      ) : <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
