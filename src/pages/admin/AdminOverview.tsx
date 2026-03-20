import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик", awaiting_offers: "Ждёт офферов", choosing_offer: "Выбор оффера",
  awaiting_payment: "Ждёт оплаты", paid: "Оплачена", completed: "Завершена",
  cancelled: "Отменена", expired: "Истекла",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8", awaiting_offers: "#3b82f6", choosing_offer: "#8b5cf6",
  awaiting_payment: "#f59e0b", paid: "#10b981", completed: "#059669",
  cancelled: "#ef4444", expired: "#6b7280",
};

function StatCard({ icon, label, value, sub, color = "#2563eb" }: { icon: string; label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon as "Users"} size={22} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.overview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#64748b" }}>Загрузка...</div>;
  if (!data) return <div style={{ color: "#ef4444" }}>Ошибка загрузки</div>;

  const byStatus = (data.requests_by_status as { status: string; count: number }[]) || [];
  const byCurrency = (data.requests_by_currency as { currency: string; count: number; total: number }[]) || [];
  const topAgents = (data.top_agents as { name: string; selected: number }[]) || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Обзор платформы</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>Метрики и статистика в реальном времени</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="Users" label="Всего пользователей" value={data.users_total as number} color="#2563eb" />
        <StatCard icon="User" label="Клиентов" value={data.clients_total as number} color="#059669" />
        <StatCard icon="UserCheck" label="Агентов" value={data.agents_total as number} color="#7c3aed" />
        <StatCard icon="FileText" label="Всего заявок" value={data.requests_total as number} color="#0891b2" />
        <StatCard icon="FileCheck" label="Завершено" value={data.requests_completed as number} color="#10b981" />
        <StatCard icon="FileClock" label="За 30 дней" value={data.requests_month as number} color="#f59e0b" />
        <StatCard icon="Tag" label="Офферов" value={data.offers_total as number} color="#8b5cf6" />
        <StatCard icon="CheckCircle" label="Выбрано офферов" value={data.offers_selected as number} color="#059669" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* По статусам */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 16 }}>Заявки по статусам</div>
          {byStatus.map(item => (
            <div key={item.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[item.status] || "#94a3b8" }} />
                <span style={{ fontSize: "0.82rem", color: "#374151" }}>{STATUS_LABELS[item.status] || item.status}</span>
              </div>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{item.count}</span>
            </div>
          ))}
          {byStatus.length === 0 && <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Нет данных</div>}
        </div>

        {/* По валютам */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 16 }}>По валютам</div>
          {byCurrency.map(item => (
            <div key={item.currency} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#374151" }}>{item.currency}</span>
                <span style={{ fontSize: "0.82rem", color: "#374151" }}>{item.count} заявок</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.total.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
          {byCurrency.length === 0 && <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Нет данных</div>}
        </div>

        {/* Топ агентов */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 16 }}>Топ агентов</div>
          {topAgents.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", width: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: "0.82rem", color: "#374151" }}>{item.name || "—"}</span>
              </div>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#059669" }}>{item.selected} выбрано</span>
            </div>
          ))}
          {topAgents.length === 0 && <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Нет данных</div>}
        </div>
      </div>
    </div>
  );
}
