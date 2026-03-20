import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lkRequests } from "@/lib/lkApi";
import { LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import StatusBadge from "@/components/lk/StatusBadge";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const STATUSES = [
  { value: "", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "awaiting_offers", label: "Ожидает предложений" },
  { value: "choosing_offer", label: "Выбор предложения" },
  { value: "awaiting_payment", label: "Ожидает оплаты" },
  { value: "paid", label: "Оплачено" },
  { value: "completed", label: "Завершено" },
];

const CURRENCIES: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", AED: "د.إ", GBP: "£", RUB: "₽" };

export default function ClientRequests({ user, unreadCount }: Props) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await lkRequests.list({ status: statusFilter || undefined });
      setRequests(data.requests || []);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Мои заявки</h1>
        <button onClick={() => navigate("/lk/requests/new")} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 18px",
          background: "#2563eb", color: "#fff", borderRadius: 8, border: "none",
          cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
        }}>
          <Icon name="Plus" size={16} />Новая заявка
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(s.value)} style={{
            padding: "5px 14px", borderRadius: 20, border: "1.5px solid",
            borderColor: statusFilter === s.value ? "#2563eb" : "#e2e8f0",
            background: statusFilter === s.value ? "#eff6ff" : "#fff",
            color: statusFilter === s.value ? "#2563eb" : "#64748b",
            fontWeight: statusFilter === s.value ? 600 : 400,
            fontSize: "0.8rem", cursor: "pointer",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: 64, color: "#94a3b8" }}>
          <Icon name="FileText" size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
          <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Заявок пока нет</div>
          <div style={{ fontSize: "0.85rem", marginBottom: 20 }}>Создайте первую заявку на оплату инвойса</div>
          <button onClick={() => navigate("/lk/requests/new")} style={{
            padding: "9px 20px", background: "#2563eb", color: "#fff",
            borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
          }}>
            Создать заявку
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r: Record<string, unknown>) => (
            <div key={r.id as string}
              onClick={() => navigate(`/lk/requests/${r.id}`)}
              style={{
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: "16px 20px", cursor: "pointer",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "#bfdbfe"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e293b" }}>
                      {CURRENCIES[r.currency as string] || ""}{(r.amount as number).toLocaleString()} {r.currency as string}
                    </span>
                    <StatusBadge status={r.status as string} size="sm" />
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {r.company_name as string}
                    {r.invoice_number && <span style={{ marginLeft: 8, color: "#94a3b8" }}>#{r.invoice_number as string}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {(r.offers_count as number) > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "#7c3aed", fontWeight: 600, marginBottom: 2 }}>
                      {r.offers_count as number} {(r.offers_count as number) === 1 ? "предложение" : "предложения"}
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {new Date(r.created_at as string).toLocaleDateString("ru")}
                  </div>
                </div>
              </div>
              {r.description && (
                <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.description as string}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </LkLayout>
  );
}
