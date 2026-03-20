import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lkRequests, lkCompanies, LkUser, UploadedFile } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import FileUploader from "@/components/lk/FileUploader";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const CURRENCIES = ["USD", "EUR", "CNY", "AED", "GBP", "RUB"];
const STEPS = ["Компания", "Инвойс", "Публикация"];

export default function NewRequest({ user, unreadCount }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Record<string, unknown>[]>([]);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [newCompany, setNewCompany] = useState({ name: "", inn: "", kpp: "", address: "", email: "", phone: "" });
  const [inv, setInv] = useState({ amount: "", currency: "USD", invoice_number: "", invoice_date: "", description: "" });
  const [publishNow, setPublishNow] = useState(true);
  const [offersUntil, setOffersUntil] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    lkCompanies.list().then(d => setCompanies(d.companies || [])).catch(() => {});
  }, []);

  const handleCreateCompany = async () => {
    if (!newCompany.name) { setError("Введите название компании"); return; }
    setLoading(true); setError("");
    try {
      const data = await lkCompanies.create(newCompany);
      const cList = await lkCompanies.list();
      setCompanies(cList.companies || []);
      setSelectedCompany(data.company_id);
      setShowNewCompany(false);
      setNewCompany({ name: "", inn: "", kpp: "", address: "", email: "", phone: "" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  };

  const handleNext = async () => {
    setError("");
    if (step === 0) {
      if (!selectedCompany) { setError("Выберите или создайте компанию"); return; }
      setStep(1);
    } else if (step === 1) {
      if (!inv.amount || parseFloat(inv.amount) <= 0) { setError("Введите сумму"); return; }
      setLoading(true);
      try {
        const data = await lkRequests.create({
          company_id: selectedCompany,
          amount: parseFloat(inv.amount),
          currency: inv.currency,
          invoice_number: inv.invoice_number || undefined,
          invoice_date: inv.invoice_date || undefined,
          description: inv.description || undefined,
        });
        setRequestId(data.request_id);
        setStep(2);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Ошибка создания");
      } finally { setLoading(false); }
    } else if (step === 2 && requestId) {
      if (publishNow) {
        setLoading(true);
        try {
          await lkRequests.publish(requestId, offersUntil || undefined);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Ошибка публикации");
          setLoading(false); return;
        } finally { setLoading(false); }
      }
      navigate(`/lk/requests/${requestId}`);
    }
  };

  const inpStyle = {
    width: "100%", padding: "9px 11px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ maxWidth: 620 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate("/lk/requests")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Новая заявка</h1>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: i <= step ? "#2563eb" : "#e2e8f0",
                color: i <= step ? "#fff" : "#94a3b8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 700,
              }}>{i + 1}</div>
              <div style={{ fontSize: "0.78rem", color: i === step ? "#2563eb" : "#94a3b8", fontWeight: i === step ? 600 : 400, marginLeft: 6, whiteSpace: "nowrap" }}>{s}</div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "#e2e8f0", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 24px" }}>
          {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem", marginBottom: 16 }}>{error}</div>}

          {/* Step 0: Company */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: 12 }}>Выберите компанию</div>
              {companies.length === 0 && !showNewCompany && (
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 16 }}>У вас пока нет компаний. Создайте новую.</div>
              )}
              {companies.map((c: Record<string, unknown>) => (
                <div key={c.id as string}
                  onClick={() => setSelectedCompany(c.id as string)}
                  style={{
                    padding: "12px 14px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                    border: `2px solid ${selectedCompany === c.id ? "#2563eb" : "#e2e8f0"}`,
                    background: selectedCompany === c.id ? "#eff6ff" : "#fff",
                  }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>{c.name as string}</div>
                  {c.inn && <div style={{ fontSize: "0.78rem", color: "#64748b" }}>ИНН: {c.inn as string}</div>}
                </div>
              ))}

              {showNewCompany ? (
                <div style={{ border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb", marginBottom: 12 }}>Новая компания</div>
                  {[
                    ["Название *", "name", "ООО Ромашка"],
                    ["ИНН", "inn", "1234567890"],
                    ["КПП", "kpp", "123456789"],
                    ["Адрес", "address", "Москва, ул. Ленина 1"],
                    ["Email", "email", "info@company.ru"],
                    ["Телефон", "phone", "+7 900 000-00-00"],
                  ].map(([label, key, ph]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
                      <input value={newCompany[key as keyof typeof newCompany]} onChange={e => setNewCompany(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={ph} style={inpStyle} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={handleCreateCompany} disabled={loading} style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                      {loading ? "Сохранение..." : "Сохранить"}
                    </button>
                    <button onClick={() => setShowNewCompany(false)} style={{ padding: "8px 14px", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#64748b", fontSize: "0.85rem" }}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewCompany(true)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                  border: "1.5px dashed #bfdbfe", borderRadius: 10, background: "none",
                  cursor: "pointer", color: "#2563eb", fontWeight: 600, fontSize: "0.85rem", width: "100%", marginTop: 4,
                }}>
                  <Icon name="Plus" size={15} />Добавить новую компанию
                </button>
              )}
            </div>
          )}

          {/* Step 1: Invoice */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Сумма *</label>
                  <input type="number" value={inv.amount} onChange={e => setInv(p => ({ ...p, amount: e.target.value }))}
                    placeholder="25000" style={inpStyle} />
                </div>
                <div style={{ width: 110 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Валюта</label>
                  <select value={inv.currency} onChange={e => setInv(p => ({ ...p, currency: e.target.value }))}
                    style={{ ...inpStyle, padding: "9px 8px" }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {[
                ["Номер инвойса", "invoice_number", "INV-2024-001", "text"],
                ["Дата инвойса", "invoice_date", "", "date"],
              ].map(([label, key, ph, type]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>{label}</label>
                  <input type={type} value={inv[key as keyof typeof inv]} onChange={e => setInv(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph} style={inpStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Описание</label>
                <textarea value={inv.description} onChange={e => setInv(p => ({ ...p, description: e.target.value }))}
                  placeholder="Оплата инвойса за поставку товаров..." rows={3}
                  style={{ ...inpStyle, resize: "vertical" as const }} />
              </div>

            </div>
          )}

          {/* Step 2: Files + Publish */}
          {step === 2 && requestId && (
            <div>
              <div style={{ background: "#d1fae5", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: "#059669", marginBottom: 4 }}>✓ Заявка создана</div>
                <div style={{ fontSize: "0.85rem", color: "#065f46" }}>Прикрепите инвойс и опубликуйте заявку, чтобы агенты отправляли предложения.</div>
              </div>

              {/* File uploads */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Документы</div>
                <FileUploader
                  fileType="INVOICE"
                  label="Загрузить инвойс"
                  hint="PDF, JPG, PNG до 20 МБ"
                  requestId={requestId}
                  multiple
                  uploaded={uploadedFiles.filter(f => f.type === "INVOICE")}
                  onUploaded={f => setUploadedFiles(p => [...p, f])}
                  onDelete={id => setUploadedFiles(p => p.filter(x => x.id !== id))}
                />
                <div style={{ marginTop: 10 }}>
                  <FileUploader
                    fileType="DOC"
                    label="Дополнительные документы"
                    hint="PDF, JPG, PNG до 20 МБ"
                    requestId={requestId}
                    multiple
                    uploaded={uploadedFiles.filter(f => f.type === "DOC")}
                    onUploaded={f => setUploadedFiles(p => [...p, f])}
                    onDelete={id => setUploadedFiles(p => p.filter(x => x.id !== id))}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={publishNow} onChange={e => setPublishNow(e.target.checked)}
                    style={{ width: 16, height: 16 }} />
                  <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>Опубликовать сейчас</span>
                </label>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: 26, marginTop: 4 }}>
                  Агенты увидят заявку и смогут отправлять предложения
                </div>
              </div>

              {publishNow && (
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Дедлайн приёма предложений (опционально)</label>
                  <input type="datetime-local" value={offersUntil} onChange={e => setOffersUntil(e.target.value)} style={inpStyle} />
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>Если не указать — предложения принимаются бессрочно</div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{
              padding: "10px 18px", border: "1.5px solid #e2e8f0", background: "#fff",
              borderRadius: 8, cursor: "pointer", color: "#374151", fontWeight: 500, fontSize: "0.875rem",
            }}>Назад</button>}
            <button onClick={handleNext} disabled={loading} style={{
              flex: 1, padding: "10px", background: loading ? "#94a3b8" : "#2563eb",
              color: "#fff", borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: "0.875rem",
            }}>
              {loading ? "Загрузка..." : step < 2 ? "Далее" : publishNow ? "Создать и опубликовать" : "Сохранить как черновик"}
            </button>
          </div>
        </div>
      </div>
    </LkLayout>
  );
}