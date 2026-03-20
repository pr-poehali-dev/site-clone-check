import { useState } from "react";
import { lkAuth, LkUser, saveUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";

interface Props { user: LkUser; unreadCount?: number; onUpdate?: (u: LkUser) => void; }

export default function LkProfile({ user, unreadCount, onUpdate }: Props) {
  const [form, setForm] = useState({ full_name: user.full_name || "", phone: user.phone || "", kpp: user.kpp || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await lkAuth.saveProfile(form);
      const updated = { ...user, ...form };
      saveUser(updated);
      onUpdate?.(updated);
      setSuccess("Профиль сохранён");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const inpStyle = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };

  const ROLE_LABELS: Record<string, string> = {
    CLIENT: "Клиент",
    AGENT: "Платёжный агент",
    PARTNER: "Партнёр",
    PLATFORM_ADMIN: "Администратор платформы",
  };

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", marginBottom: 24 }}>Профиль</h1>

      <div style={{ maxWidth: 480 }}>
        {/* Info block */}
        <div style={{ background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe", padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{user.full_name || "—"}</div>
              <div style={{ fontSize: "0.82rem", color: "#2563eb" }}>{user.email}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: "0.72rem", background: "#2563eb", color: "#fff", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                  {ROLE_LABELS[user.lk_role] || user.lk_role}
                </span>
                {user.is_verified && (
                  <span style={{ fontSize: "0.72rem", background: "#d1fae5", color: "#059669", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>✓ Верифицирован</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "22px 22px" }}>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Email</label>
              <input value={user.email} disabled style={{ ...inpStyle, background: "#f8fafc", color: "#94a3b8" }} />
            </div>

            {[
              ["Имя и фамилия", "full_name", "Иван Иванов", "text"],
              ["Телефон", "phone", "+7 900 000-00-00", "tel"],
              ["КПП", "kpp", "123456789", "text"],
            ].map(([label, key, ph, type]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>{label}</label>
                <input type={type} value={form[key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph} style={inpStyle} />
              </div>
            ))}

            {error && <div style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ color: "#059669", fontSize: "0.82rem", marginBottom: 12 }}>✓ {success}</div>}

            <button type="submit" disabled={saving} style={{
              width: "100%", padding: "10px", background: saving ? "#94a3b8" : "#2563eb",
              color: "#fff", borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: "0.875rem",
            }}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </form>
        </div>
      </div>
    </LkLayout>
  );
}
