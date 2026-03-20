import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { lkAuth } from "@/lib/lkApi";

type RegType = "client" | "agent";

export default function LkRegister() {
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (regType === "client") {
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
      setSuccess("Регистрация успешна! Теперь войдите в систему.");
      setTimeout(() => navigate("/lk/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const inp = (label: string, key: string, type = "text", placeholder = "", required = true) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        {label}{required && " *"}
      </label>
      <input
        type={type} value={form[key as keyof typeof form]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder} required={required}
        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>ВалютаПэй</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Создайте аккаунт</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {/* Type switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
            {(["client", "agent"] as RegType[]).map(t => (
              <button key={t} onClick={() => setRegType(t)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: regType === t ? "#fff" : "transparent",
                color: regType === t ? "#2563eb" : "#64748b",
                fontWeight: regType === t ? 700 : 400, fontSize: "0.875rem",
                boxShadow: regType === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
                {t === "client" ? "Клиент" : "Платёжный агент"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {inp("Имя и фамилия", "full_name", "text", "Иван Иванов")}
            {inp("Email", "email", "email", "your@email.com")}
            {inp("Пароль (мин. 6 символов)", "password", "password", "••••••••")}
            {inp("Телефон", "phone", "tel", "+7 900 000-00-00", false)}

            {regType === "client" && <>
              <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>Компания (опционально)</div>
              {inp("Название компании", "company_name", "text", "ООО Ромашка", false)}
              {inp("ИНН", "inn", "text", "1234567890", false)}
            </>}

            {regType === "agent" && <>
              <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>Организация *</div>
              {inp("Название организации", "org_name", "text", "ООО Агент")}
              {inp("ИНН", "org_inn", "text", "1234567890", false)}
              {inp("КПП", "org_kpp", "text", "123456789", false)}
              {inp("Адрес", "org_address", "text", "Москва, ул. Пушкина", false)}
            </>}

            {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem", marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ background: "#d1fae5", color: "#059669", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem", marginBottom: 14 }}>{success}</div>}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "11px", borderRadius: 8, border: "none",
              background: loading ? "#94a3b8" : "#2563eb", color: "#fff",
              fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
            }}>
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: "0.85rem", color: "#64748b" }}>
            Уже есть аккаунт?{" "}
            <Link to="/lk/login" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
