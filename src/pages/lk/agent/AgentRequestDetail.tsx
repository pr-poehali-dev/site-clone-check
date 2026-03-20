import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lkRequests, lkOffers, LkUser, UploadedFile } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import StatusBadge from "@/components/lk/StatusBadge";
import FileUploader from "@/components/lk/FileUploader";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const CURRENCIES: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", AED: "د.إ", GBP: "£", RUB: "₽" };

const COUNTRIES = [
  "Китай", "ОАЭ", "Турция", "Гонконг", "Сингапур", "Германия", "США", "Великобритания",
  "Швейцария", "Нидерланды", "Франция", "Польша", "Казахстан", "Другое",
];

export default function AgentRequestDetail({ user, unreadCount }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [offerForm, setOfferForm] = useState({
    percent_fee: "", fx_rate: "", duration_workdays: "5",
    pay_from_country: "", use_nonresident_route: false,
    comment: "", agent_contract_url: "",
  });
  const [contractFiles, setContractFiles] = useState<UploadedFile[]>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await lkRequests.get(id);
      setRequest(data.request);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleSubmitOffer = async () => {
    if (!id) return;
    if (!offerForm.percent_fee || !offerForm.duration_workdays) {
      setError("Заполните процент комиссии и срок"); return;
    }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      await lkOffers.create({
        request_id: id,
        percent_fee: parseFloat(offerForm.percent_fee),
        fx_rate: offerForm.fx_rate ? parseFloat(offerForm.fx_rate) : undefined,
        duration_workdays: parseInt(offerForm.duration_workdays),
        pay_from_country: offerForm.pay_from_country || undefined,
        use_nonresident_route: offerForm.use_nonresident_route,
        comment: offerForm.comment || undefined,
        agent_contract_url: contractFiles[0]?.file_url || offerForm.agent_contract_url || undefined,
      });
      setSuccess("Предложение отправлено!");
      setShowOfferForm(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSubmitting(false); }
  };

  const inpStyle = { width: "100%", padding: "8px 11px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };

  if (loading) return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
    </LkLayout>
  );

  if (!request) return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ textAlign: "center", padding: 48, color: "#dc2626" }}>{error}</div>
    </LkLayout>
  );

  const offers = (request.offers as Record<string, unknown>[]) || [];
  const company = request.company as Record<string, unknown> | null;
  const sym = CURRENCIES[request.currency as string] || "";
  const myOffer = offers.find((o: Record<string, unknown>) =>
    o.is_selected === false && o.status === "active"
  );
  const canMakeOffer = ["awaiting_offers", "choosing_offer"].includes(request.status as string);

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate("/lk/agent/requests")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {sym}{(request.amount as number).toLocaleString()} {request.currency as string}
              </h1>
              <StatusBadge status={request.status as string} />
            </div>
            {company && <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>{company.name as string}</div>}
          </div>
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.85rem" }}>{error}</div>}
        {success && <div style={{ background: "#d1fae5", color: "#059669", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.85rem" }}>{success}</div>}

        {/* Request info */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>Детали заявки</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Компания</div>
              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}>{company?.name as string || "—"}</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 1 }}>
                {/* Контакты маскируются до выбора */}
                Контакты: {((company?.contacts as Record<string, string>) || {}).email || "—скрыто—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Инвойс</div>
              {request.invoice_number && <div style={{ fontWeight: 500, color: "#374151", fontSize: "0.875rem" }}>#{request.invoice_number as string}</div>}
              {request.invoice_date && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{new Date(request.invoice_date as string).toLocaleDateString("ru")}</div>}
            </div>
          </div>
          {request.description && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, fontSize: "0.85rem", color: "#374151" }}>
              {request.description as string}
            </div>
          )}
          {request.offers_until && (
            <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#d97706" }}>
              <Icon name="Clock" size={12} style={{ marginRight: 4 }} />
              Дедлайн предложений: {new Date(request.offers_until as string).toLocaleDateString("ru")}
            </div>
          )}
        </div>

        {/* Offer form */}
        {canMakeOffer && !showOfferForm && (
          <button onClick={() => setShowOfferForm(true)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "11px 20px",
            background: "#2563eb", color: "#fff", borderRadius: 10, border: "none",
            cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16, width: "100%", justifyContent: "center",
          }}>
            <Icon name="Plus" size={16} />Отправить предложение
          </button>
        )}

        {showOfferForm && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #bfdbfe", padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 16 }}>Ваше предложение</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Комиссия, % *</label>
                <input type="number" step="0.01" min="0.01" max="100"
                  value={offerForm.percent_fee}
                  onChange={e => setOfferForm(p => ({ ...p, percent_fee: e.target.value }))}
                  placeholder="2.5" style={inpStyle} />
                {offerForm.percent_fee && (
                  <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: 3 }}>
                    Комиссия: {sym}{((request.amount as number) * parseFloat(offerForm.percent_fee) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Срок (рабочих дней) *</label>
                <input type="number" min="1" max="90"
                  value={offerForm.duration_workdays}
                  onChange={e => setOfferForm(p => ({ ...p, duration_workdays: e.target.value }))}
                  placeholder="5" style={inpStyle} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Курс FX</label>
                <input type="number" step="0.0001"
                  value={offerForm.fx_rate}
                  onChange={e => setOfferForm(p => ({ ...p, fx_rate: e.target.value }))}
                  placeholder="92.50" style={inpStyle} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Страна оплаты</label>
                <select value={offerForm.pay_from_country} onChange={e => setOfferForm(p => ({ ...p, pay_from_country: e.target.value }))}
                  style={{ ...inpStyle, padding: "8px 8px" }}>
                  <option value="">Выберите...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={offerForm.use_nonresident_route}
                  onChange={e => setOfferForm(p => ({ ...p, use_nonresident_route: e.target.checked }))}
                  style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Оплата через нерезидента (в рублях)</span>
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Комментарий</label>
              <textarea value={offerForm.comment} onChange={e => setOfferForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Дополнительные условия..." rows={2}
                style={{ ...inpStyle, resize: "vertical" as const }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Агентский договор</label>
              <FileUploader
                fileType="AGENT_CONTRACT"
                label="Загрузить агентский договор"
                hint="PDF до 20 МБ"
                accept=".pdf"
                uploaded={contractFiles}
                onUploaded={f => setContractFiles([f])}
                onDelete={() => setContractFiles([])}
              />
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: 4 }}>или укажите ссылку</label>
                <input value={offerForm.agent_contract_url}
                  onChange={e => setOfferForm(p => ({ ...p, agent_contract_url: e.target.value }))}
                  placeholder="https://..." style={{ ...inpStyle, fontSize: "0.8rem" }} />
              </div>
            </div>

            {error && <div style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: 10 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSubmitOffer} disabled={submitting} style={{
                flex: 1, padding: "9px", background: submitting ? "#94a3b8" : "#2563eb",
                color: "#fff", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "0.875rem",
              }}>
                {submitting ? "Отправка..." : "Отправить предложение"}
              </button>
              <button onClick={() => setShowOfferForm(false)} style={{
                padding: "9px 14px", background: "none", border: "1px solid #e2e8f0",
                borderRadius: 8, cursor: "pointer", color: "#64748b", fontSize: "0.875rem",
              }}>Отмена</button>
            </div>
          </div>
        )}

        {/* All offers */}
        {offers.length > 0 && (
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
              Предложения ({offers.length})
            </div>
            {offers.map((o: Record<string, unknown>) => (
              <div key={o.id as string} style={{
                background: o.is_selected ? "#f0fdf4" : "#f8fafc",
                borderRadius: 10, border: `1px solid ${o.is_selected ? "#86efac" : "#e2e8f0"}`,
                padding: "12px 14px", marginBottom: 8,
                opacity: o.status === "rejected" || o.status === "withdrawn" ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>{o.percent_fee as number}%</span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{o.duration_workdays as number} р. дней</span>
                  {o.pay_from_country && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>📍 {o.pay_from_country as string}</span>}
                  <StatusBadge status={o.status as string} size="sm" />
                  {o.is_selected && <span style={{ fontSize: "0.72rem", background: "#059669", color: "#fff", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>✓ Выбрано</span>}
                  <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#94a3b8" }}>{o.org_name as string}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LkLayout>
  );
}