import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lkOffers, LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import StatusBadge from "@/components/lk/StatusBadge";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const CURRENCIES: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", AED: "د.إ", GBP: "£", RUB: "₽" };

export default function AgentOffers({ user, unreadCount }: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await lkOffers.listMine();
      setOffers(data.offers || []);
    } catch (_e) { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async (offerId: string) => {
    setWithdrawing(offerId);
    try {
      await lkOffers.withdraw(offerId);
      await load();
    } catch (_e) { /* noop */ } finally { setWithdrawing(null); }
  };

  const handleExport = async () => {
    try {
      const data = await lkOffers.export();
      const rows = data.export || [];
      const headers = ["Offer ID", "Request ID", "Компания", "Сумма", "Валюта", "Статус заявки", "% комиссии", "Курс FX", "Срок (дней)", "Страна", "Нерезидент", "Комиссия", "Статус оффера", "Создан"];
      const csv = [headers.join(";"), ...rows.map((r: Record<string, unknown>) =>
        [r.offer_id, r.request_id, r.company, r.amount, r.currency, r.request_status, r.percent_fee, r.fx_rate || "", r.duration_workdays, r.country || "", r.nonresident ? "Да" : "Нет", r.commission, r.offer_status, r.created_at].join(";")
      )].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "offers_export.csv"; a.click();
    } catch (_e) { /* noop */ }
  };

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Мои предложения</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {(user.org_role === "OWNER" || user.org_role === "ADMIN") && (
            <button onClick={handleExport} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
              border: "1.5px solid #e2e8f0", background: "#fff", borderRadius: 8,
              cursor: "pointer", fontSize: "0.8rem", color: "#374151", fontWeight: 500,
            }}>
              <Icon name="Download" size={14} />Экспорт CSV
            </button>
          )}
          <button onClick={() => navigate("/lk/agent/requests")} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
            background: "#2563eb", color: "#fff", borderRadius: 8, border: "none",
            cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
          }}>
            <Icon name="Plus" size={14} />Новое предложение
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
      ) : offers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: "#94a3b8" }}>
          <Icon name="HandCoins" size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: "0.9rem", marginBottom: 8 }}>Предложений пока нет</div>
          <button onClick={() => navigate("/lk/agent/requests")} style={{
            padding: "9px 18px", background: "#2563eb", color: "#fff",
            borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
          }}>Посмотреть заявки</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {offers.map((o: Record<string, unknown>) => (
            <div key={o.id as string} style={{
              background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px",
              opacity: o.status === "rejected" || o.status === "withdrawn" ? 0.65 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>{o.percent_fee as number}%</span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>комиссия</span>
                    <StatusBadge status={o.status as string} size="sm" />
                    {o.status === "selected" && <span style={{ fontSize: "0.72rem", background: "#059669", color: "#fff", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>✓ Выбрано клиентом</span>}
                  </div>
                  <div style={{ fontWeight: 600, color: "#374151", fontSize: "0.875rem" }}>{o.company_name as string || "—"}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
                    {o.request_amount && (
                      <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: 500 }}>
                        {CURRENCIES[o.request_currency as string] || ""}{(o.request_amount as number).toLocaleString()} {o.request_currency as string}
                      </span>
                    )}
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      <Icon name="Clock" size={11} style={{ marginRight: 3 }} />
                      {o.duration_workdays as number} р. дн. (до {o.completion_date as string})
                    </span>
                    {o.pay_from_country && <span style={{ fontSize: "0.8rem", color: "#64748b" }}>📍 {o.pay_from_country as string}</span>}
                    {o.use_nonresident_route && <span style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 600 }}>Нерезидент</span>}
                  </div>
                  {o.comment && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 5, fontStyle: "italic" }}>«{o.comment as string}»</div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {new Date(o.created_at as string).toLocaleDateString("ru")}
                  </div>
                  {o.request_amount && (
                    <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600 }}>
                      Комиссия: {CURRENCIES[o.request_currency as string] || ""}{((o.request_amount as number) * (o.percent_fee as number) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => navigate(`/lk/agent/requests/${o.request_id}`)}
                      style={{ padding: "5px 10px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", color: "#374151" }}>
                      Заявка
                    </button>
                    {o.status === "active" && (
                      <button onClick={() => handleWithdraw(o.id as string)}
                        disabled={withdrawing === o.id}
                        style={{ padding: "5px 10px", background: "none", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", color: "#dc2626" }}>
                        {withdrawing === o.id ? "..." : "Отозвать"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </LkLayout>
  );
}
