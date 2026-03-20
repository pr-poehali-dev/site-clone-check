import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lkRequests, LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import StatusBadge from "@/components/lk/StatusBadge";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const CURRENCIES: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", AED: "د.إ", GBP: "£", RUB: "₽" };

const STATUSES = [
  { value: "", label: "Все открытые" },
  { value: "awaiting_offers", label: "Ожидают предложений" },
  { value: "choosing_offer", label: "Выбор предложения" },
];

export default function AgentRequests({ user, unreadCount }: Props) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await lkRequests.list({ status: statusFilter || undefined });
      setRequests(data.requests || []);
    } catch (_e) { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>Каталог заявок</h1>
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Клиенты ожидают предложений по оплате инвойсов. Отправьте своё предложение.
        </div>
      </div>

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
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
          <Icon name="Inbox" size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: "0.9rem" }}>Нет доступных заявок</div>
          <div style={{ fontSize: "0.8rem", marginTop: 6 }}>Клиенты ещё не опубликовали заявки</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r: Record<string, unknown>) => (
            <div key={r.id as string}
              onClick={() => navigate(`/lk/agent/requests/${r.id}`)}
              style={{
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: "18px 20px", cursor: "pointer",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "#bfdbfe"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b" }}>
                      {CURRENCIES[r.currency as string] || ""}{(r.amount as number).toLocaleString()} {r.currency as string}
                    </span>
                    <StatusBadge status={r.status as string} size="sm" />
                  </div>
                  <div style={{ fontWeight: 600, color: "#374151", fontSize: "0.875rem" }}>{r.company_name as string}</div>
                  {r.invoice_number && <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Инвойс #{r.invoice_number as string}</div>}
                  {r.description && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 6, maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.description as string}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    {new Date(r.created_at as string).toLocaleDateString("ru")}
                  </div>
                  {r.offers_until && (
                    <div style={{ fontSize: "0.75rem", color: "#d97706", marginTop: 3 }}>
                      до {new Date(r.offers_until as string).toLocaleDateString("ru")}
                    </div>
                  )}
                  {(r.offers_count as number) > 0 && (
                    <div style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 600, marginTop: 3 }}>
                      {r.offers_count as number} предл.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/lk/agent/requests/${r.id}`); }}
                  style={{
                    padding: "6px 14px", background: "#eff6ff", color: "#2563eb",
                    borderRadius: 8, border: "1.5px solid #bfdbfe", cursor: "pointer",
                    fontWeight: 600, fontSize: "0.8rem",
                  }}>
                  Отправить предложение →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </LkLayout>
  );
}
