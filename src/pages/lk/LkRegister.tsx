import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { lkAuth } from "@/lib/lkApi";
import Icon from "@/components/ui/icon";

type RegType = "client" | "agent" | "partner";

const ROLES: {
  id: RegType;
  icon: string;
  title: string;
  subtitle: string;
  features: string[];
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "client",
    icon: "Building2",
    title: "Клиент",
    subtitle: "Оплата международных инвойсов",
    features: [
      "Создавать заявки на оплату инвойсов",
      "Получать предложения от агентов",
      "Выбирать лучшее предложение",
      "Скачивать договор и платить",
    ],
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    id: "agent",
    icon: "HandCoins",
    title: "Платёжный агент",
    subtitle: "Проведение платежей для клиентов",
    features: [
      "Видеть все заявки клиентов",
      "Отправлять предложения с условиями",
      "Указывать комиссию и сроки",
      "Управлять командой сотрудников",
    ],
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    id: "partner",
    icon: "Handshake",
    title: "Партнёр",
    subtitle: "Создание заявок и поддоступы",
    features: [
      "Создавать заявки на оплату",
      "Выбирать предложения агентов",
      "Давать поддоступы сотрудникам",
      "Управлять несколькими компаниями",
    ],
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
];

export default function LkRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"role" | "form">("role");
  const [regType, setRegType] = useState<RegType>("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    email: "", password: "", full_name: "", phone: "",
    company_name: "", inn: "",
    org_name: "", org_inn: "", org_kpp: "", org_address: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedRole = ROLES.find(r => r.id === regType)!;

  const handleSelectRole = (role: RegType) => {
    setRegType(role);
    setStep("form");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (regType === "client" || regType === "partner") {
        await lkAuth.registerClient({
          email: form.email, password: form.password,
          full_name: form.full_name, company_name: form.company_name,
          inn: form.inn, phone: form.phone,
        });
      } else {
        await lkAuth.registerAgent({
          email: form.email, password: form.password,
          full_name: form.full_name, phone: form.phone,
          org_name: form.org_name, org_inn: form.org_inn,
          org_kpp: form.org_kpp, org_address: form.org_address,
        });
      }
      setSuccess("Регистрация успешна! Перенаправляем...");
      setTimeout(() => navigate("/lk/login"), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const inpStyle: React.CSSProperties = {
    width: "100%", padding: "9px 11px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
  };

  const inp = (label: string, key: string, type = "text", placeholder = "", required = true) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        type={type} value={form[key as keyof typeof form]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder} required={required}
        style={inpStyle}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: step === "role" ? 680 : 500 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>ВалютаПэй</div>
          </a>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
            {step === "role" ? "Выберите тип аккаунта" : "Заполните данные для регистрации"}
          </div>
        </div>

        {/* ── STEP 1: ROLE SELECTION ── */}
        {step === "role" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 22 }}>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  style={{
                    background: "#fff", border: `2px solid #e2e8f0`,
                    borderRadius: 14, padding: "20px 18px",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = role.border;
                    (e.currentTarget as HTMLElement).style.background = role.bg;
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLElement).style.background = "#fff";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Role icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: role.bg, border: `1.5px solid ${role.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 12,
                  }}>
                    <Icon name={role.icon as never} size={22} style={{ color: role.color }} />
                  </div>

                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", marginBottom: 3 }}>
                    {role.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: 12, lineHeight: 1.4 }}>
                    {role.subtitle}
                  </div>

                  {/* Feature list */}
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    {role.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.78rem", color: "#374151" }}>
                        <span style={{ color: role.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA arrow */}
                  <div style={{
                    marginTop: 14, display: "flex", alignItems: "center", justifyContent: "flex-end",
                    gap: 4, fontSize: "0.78rem", fontWeight: 600, color: role.color,
                  }}>
                    Выбрать <Icon name="ArrowRight" size={13} />
                  </div>
                </button>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>
              Уже есть аккаунт?{" "}
              <Link to="/lk/login" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                Войти
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP 2: FORM ── */}
        {step === "form" && (
          <div>
            {/* Role badge + back */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setStep("role")} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none", cursor: "pointer",
                color: "#64748b", fontSize: "0.82rem", padding: 0,
              }}>
                <Icon name="ArrowLeft" size={15} />Назад
              </button>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "4px 12px", borderRadius: 20,
                background: selectedRole.bg, border: `1px solid ${selectedRole.border}`,
                fontSize: "0.78rem", fontWeight: 700, color: selectedRole.color,
              }}>
                <Icon name={selectedRole.icon as never} size={13} />
                {selectedRole.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", flex: 1 }}>
                {selectedRole.subtitle}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "24px 24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
              <form onSubmit={handleSubmit}>
                {/* Common fields */}
                {inp("Имя и фамилия", "full_name", "text", "Иван Иванов")}
                {inp("Email", "email", "email", "your@email.com")}
                {inp("Пароль (мин. 6 символов)", "password", "password", "••••••••")}
                {inp("Телефон", "phone", "tel", "+7 900 000-00-00", false)}

                {/* CLIENT / PARTNER fields */}
                {(regType === "client" || regType === "partner") && (
                  <>
                    <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Компания <span style={{ fontWeight: 400 }}>(опционально)</span>
                    </div>
                    {inp("Название компании", "company_name", "text", "ООО Ромашка", false)}
                    {inp("ИНН", "inn", "text", "1234567890", false)}
                  </>
                )}

                {/* AGENT fields */}
                {regType === "agent" && (
                  <>
                    <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Организация <span style={{ color: "#ef4444" }}>*</span>
                    </div>
                    {inp("Название организации", "org_name", "text", "ООО Агент")}
                    {inp("ИНН", "org_inn", "text", "1234567890", false)}
                    {inp("КПП", "org_kpp", "text", "123456789", false)}
                    {inp("Адрес", "org_address", "text", "Москва, ул. Пушкина", false)}
                  </>
                )}

                {error && (
                  <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="AlertCircle" size={15} />{error}
                  </div>
                )}
                {success && (
                  <div style={{ background: "#d1fae5", color: "#059669", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="CheckCircle" size={15} />{success}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "11px", borderRadius: 8, border: "none",
                  background: loading ? "#94a3b8" : selectedRole.color,
                  color: "#fff", fontSize: "0.95rem", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "reg-spin 0.7s linear infinite" }} />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <Icon name={selectedRole.icon as never} size={15} />
                      Зарегистрироваться как {selectedRole.title}
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 18, fontSize: "0.85rem", color: "#64748b" }}>
                Уже есть аккаунт?{" "}
                <Link to="/lk/login" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Войти</Link>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes reg-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
