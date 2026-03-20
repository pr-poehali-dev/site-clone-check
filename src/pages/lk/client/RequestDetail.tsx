import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lkRequests, LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import StatusBadge from "@/components/lk/StatusBadge";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const CURRENCIES: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", AED: "د.إ", GBP: "£", RUB: "₽" };

export default function RequestDetail({ user, unreadCount }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await lkRequests.get(id);
      setRequest(data.request);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleSelectOffer = async (offerId: string) => {
    if (!id) return;
    setActionLoading(true); setError(""); setSuccess("");
    try {
      await lkRequests.selectOffer(id, offerId);
      setSuccess("Предложение выбрано! Ожидайте контракт.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setActionLoading(false); }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setActionLoading(true); setError(""); setSuccess("");
    try {
      await lkRequests.markPaid(id);
      setSuccess("Заявка отмечена как оплаченная!");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true); setError("");
    try {
      await lkRequests.cancel(id);
      navigate("/lk/requests");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setActionLoading(false); setShowCancelConfirm(false); }
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishLoading(true); setError("");
    try {
      await lkRequests.publish(id);
      setSuccess("Заявка опубликована!");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setPublishLoading(false); }
  };

  if (loading) return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
    </LkLayout>
  );

  if (!request) return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ textAlign: "center", padding: 48, color: "#dc2626" }}>{error || "Заявка не найдена"}</div>
    </LkLayout>
  );

  const offers = (request.offers as Record<string, unknown>[]) || [];
  const attachments = (request.attachments as Record<string, unknown>[]) || [];
  const contract = request.contract as Record<string, unknown> | null;
  const company = request.company as Record<string, unknown> | null;
  const sym = CURRENCIES[request.currency as string] || "";

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate("/lk/requests")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {sym}{(request.amount as number).toLocaleString()} {request.currency as string}
              </h1>
              <StatusBadge status={request.status as string} />
            </div>
            {(request.invoice_number as string) && (
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Инвойс #{request.invoice_number as string}</div>
            )}
          </div>
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.85rem" }}>{error}</div>}
        {success && <div style={{ background: "#d1fae5", color: "#059669", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.85rem" }}>{success}</div>}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {request.can_publish && (
            <button onClick={handlePublish} disabled={publishLoading} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
              background: "#2563eb", color: "#fff", borderRadius: 8, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
            }}>
              <Icon name="Send" size={15} />{publishLoading ? "Публикация..." : "Опубликовать"}
            </button>
          )}
          {request.can_mark_paid && (
            <button onClick={handleMarkPaid} disabled={actionLoading} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
              background: "#059669", color: "#fff", borderRadius: 8, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
            }}>
              <Icon name="CheckCircle" size={15} />{actionLoading ? "Обновление..." : "Отметить оплаченным"}
            </button>
          )}
          {request.can_cancel && (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 14px",
              border: "1.5px solid #fecaca", background: "#fff", color: "#dc2626",
              borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
            }}>
              <Icon name="X" size={15} />Отменить
            </button>
          )}
        </div>

        {/* Cancel confirm */}
        {showCancelConfirm && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: "#c2410c", marginBottom: 8 }}>Отменить заявку?</div>
            <div style={{ fontSize: "0.85rem", color: "#7c2d12", marginBottom: 12 }}>Все предложения будут аннулированы. Действие необратимо.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCancel} disabled={actionLoading} style={{ padding: "7px 16px", background: "#dc2626", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                {actionLoading ? "..." : "Да, отменить"}
              </button>
              <button onClick={() => setShowCancelConfirm(false)} style={{ padding: "7px 14px", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#374151", fontSize: "0.85rem" }}>
                Нет
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="sm:grid-cols-1">
          {/* Company info */}
          {company && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Компания</div>
              <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{company.name as string}</div>
              {company.inn && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>ИНН: {company.inn as string}</div>}
              {company.address && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>{company.address as string}</div>}
            </div>
          )}

          {/* Request details */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Детали</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {request.invoice_date && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>Дата инвойса</span>
                <span style={{ color: "#1e293b", fontWeight: 500 }}>{new Date(request.invoice_date as string).toLocaleDateString("ru")}</span>
              </div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>Создана</span>
                <span style={{ color: "#1e293b", fontWeight: 500 }}>{new Date(request.created_at as string).toLocaleDateString("ru")}</span>
              </div>
              {request.offers_until && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "#64748b" }}>Дедлайн предложений</span>
                <span style={{ color: "#d97706", fontWeight: 500 }}>{new Date(request.offers_until as string).toLocaleDateString("ru")}</span>
              </div>}
            </div>
            {request.description && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: "0.85rem", color: "#64748b" }}>{request.description as string}</div>}
          </div>
        </div>

        {/* Contract */}
        {contract && (
          <div style={{ background: "#d1fae5", borderRadius: 12, border: "1px solid #a7f3d0", padding: "16px 18px", marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Icon name="FileCheck" size={18} style={{ color: "#059669" }} />
              <div style={{ fontWeight: 700, color: "#059669" }}>Договор сформирован</div>
            </div>
            {contract.contract_file_url ? (
              <a href={contract.contract_file_url as string} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#059669", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}>
                <Icon name="Download" size={14} />Скачать договор
              </a>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "#065f46" }}>Договор готовится...</div>
            )}
          </div>
        )}

        {/* Offers */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
            Предложения агентов ({offers.length})
          </div>

          {offers.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "32px", textAlign: "center", color: "#94a3b8" }}>
              {request.status === "draft" ? "Опубликуйте заявку, чтобы агенты могли отправлять предложения" : "Предложений пока нет. Ожидайте."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {offers.map((o: Record<string, unknown>) => (
                <div key={o.id as string} style={{
                  background: o.is_selected ? "#f0fdf4" : "#fff",
                  borderRadius: 12,
                  border: `2px solid ${o.is_selected ? "#86efac" : o.status === "rejected" ? "#fecaca" : "#e2e8f0"}`,
                  padding: "16px 18px",
                  opacity: o.status === "rejected" || o.status === "withdrawn" ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>{o.percent_fee as number}%</span>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>комиссия</span>
                        <StatusBadge status={o.status as string} size="sm" />
                        {o.is_selected && <span style={{ fontSize: "0.72rem", background: "#059669", color: "#fff", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>✓ Выбрано</span>}
                      </div>
                      <div style={{ fontWeight: 600, color: "#374151", fontSize: "0.875rem" }}>{o.org_name as string}</div>
                      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          <Icon name="Clock" size={12} style={{ marginRight: 4 }} />
                          {o.duration_workdays as number} р. дней
                        </span>
                        {o.pay_from_country && (
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            <Icon name="Globe" size={12} style={{ marginRight: 4 }} />
                            {o.pay_from_country as string}
                          </span>
                        )}
                        {o.fx_rate && (
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            Курс: {o.fx_rate as number}
                          </span>
                        )}
                        {o.use_nonresident_route && (
                          <span style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 600 }}>Нерезидент</span>
                        )}
                      </div>
                      {o.comment && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 6, fontStyle: "italic" }}>«{o.comment as string}»</div>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      {/* Commission calc */}
                      <div style={{ fontSize: "0.8rem", color: "#374151", textAlign: "right" }}>
                        Комиссия: <strong>{sym}{((request.amount as number) * (o.percent_fee as number) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                      </div>
                      {request.can_select_offer && o.status === "active" && (
                        <button onClick={() => handleSelectOffer(o.id as string)} disabled={actionLoading}
                          style={{
                            padding: "7px 14px", background: "#2563eb", color: "#fff",
                            borderRadius: 8, border: "none", cursor: "pointer",
                            fontWeight: 600, fontSize: "0.8rem",
                          }}>
                          {actionLoading ? "..." : "Выбрать"}
                        </button>
                      )}
                    </div>
                  </div>

                  {o.agent_contract_url && (
                    <div style={{ marginTop: 8 }}>
                      <a href={o.agent_contract_url as string} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "0.78rem", color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Icon name="FileText" size={12} />Агентский договор
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Документы</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {attachments.map((a: Record<string, unknown>) => (
                <div key={a.id as string} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 14px" }}>
                  <Icon name="Paperclip" size={15} style={{ color: "#64748b" }} />
                  <span style={{ fontSize: "0.85rem", color: "#374151", flex: 1 }}>{a.filename as string}</span>
                  {a.file_url && (
                    <a href={a.file_url as string} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontSize: "0.8rem" }}>
                      <Icon name="Download" size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </LkLayout>
  );
}
