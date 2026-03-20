import { useState, useEffect } from "react";
import { lkAuth, LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

export default function AgentOrg({ user, unreadCount }: Props) {
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"org" | "members">("org");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [orgForm, setOrgForm] = useState({ name: "", inn: "", kpp: "", address: "", nonresident_payment_enabled: false });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("OPERATOR");
  const [inviting, setInviting] = useState(false);

  const isAdmin = user.org_role === "OWNER" || user.org_role === "ADMIN";

  const load = async () => {
    setLoading(true);
    try {
      const orgData = await lkAuth.getOrg();
      setOrg(orgData.org);
      setOrgForm({
        name: orgData.org.name || "",
        inn: orgData.org.inn || "",
        kpp: orgData.org.kpp || "",
        address: orgData.org.address || "",
        nonresident_payment_enabled: orgData.org.nonresident_payment_enabled || false,
      });
      if (isAdmin) {
        const membersData = await lkAuth.orgMembers();
        setMembers(membersData.members || []);
      }
    } catch (_e) { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSaveOrg = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await lkAuth.saveOrg(orgForm);
      setSuccess("Данные организации сохранены");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail) { setError("Введите email"); return; }
    setInviting(true); setError(""); setSuccess("");
    try {
      await lkAuth.inviteMember(inviteEmail, inviteRole);
      setSuccess(`Пользователь ${inviteEmail} добавлен в организацию`);
      setInviteEmail("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setInviting(false); }
  };

  const handleToggleMember = async (memberId: number, is_active: boolean) => {
    try {
      await lkAuth.updateMember(memberId, { is_active });
      await load();
    } catch (_e) { /* noop */ }
  };

  const inpStyle = { width: "100%", padding: "8px 11px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Организация</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e2e8f0", marginBottom: 24 }}>
        {[
          { key: "org", label: "Реквизиты" },
          ...(isAdmin ? [{ key: "members", label: "Сотрудники" }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as "org" | "members")} style={{
            padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
            fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? "#2563eb" : "#64748b",
            borderBottom: tab === t.key ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2, fontSize: "0.875rem",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.85rem" }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#059669", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: "0.85rem" }}>{success}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
      ) : tab === "org" ? (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 22px" }}>
            {[
              ["Название организации *", "name", "ООО Агент"],
              ["ИНН", "inn", "1234567890"],
              ["КПП", "kpp", "123456789"],
              ["Адрес", "address", "Москва, ул. Ленина 1"],
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
                <input value={orgForm[key as keyof typeof orgForm] as string}
                  onChange={e => setOrgForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph} style={inpStyle} />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox"
                  checked={orgForm.nonresident_payment_enabled}
                  onChange={e => setOrgForm(p => ({ ...p, nonresident_payment_enabled: e.target.checked }))}
                  style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Доступна оплата через нерезидента (в рублях)</span>
              </label>
            </div>

            <button onClick={handleSaveOrg} disabled={saving || !isAdmin} style={{
              padding: "9px 20px", background: saving || !isAdmin ? "#94a3b8" : "#2563eb",
              color: "#fff", borderRadius: 8, border: "none", cursor: isAdmin ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: "0.875rem",
            }}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            {!isAdmin && <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 8 }}>Только администратор может редактировать реквизиты</div>}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 700 }}>
          {/* Invite */}
          {isAdmin && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 12, fontSize: "0.9rem" }}>Добавить сотрудника</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@example.com" type="email"
                  style={{ ...inpStyle, flex: 1, minWidth: 200 }} />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.875rem" }}>
                  <option value="OPERATOR">Оператор</option>
                  <option value="MANAGER">Менеджер</option>
                  <option value="ADMIN">Администратор</option>
                </select>
                <button onClick={handleInvite} disabled={inviting} style={{
                  padding: "8px 16px", background: inviting ? "#94a3b8" : "#2563eb",
                  color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                }}>
                  {inviting ? "..." : "Добавить"}
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {members.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: "0.85rem" }}>Нет сотрудников</div>
            ) : members.map((m: Record<string, unknown>, i) => (
              <div key={m.id as number} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                borderBottom: i < members.length - 1 ? "1px solid #f1f5f9" : "none",
                opacity: m.is_active ? 1 : 0.5,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="User" size={16} style={{ color: "#2563eb" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}>{m.full_name as string || m.email as string}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{m.email as string}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 10, fontSize: "0.72rem", fontWeight: 600,
                    background: m.role === "OWNER" ? "#ede9fe" : m.role === "ADMIN" ? "#dbeafe" : "#f1f5f9",
                    color: m.role === "OWNER" ? "#7c3aed" : m.role === "ADMIN" ? "#2563eb" : "#374151",
                  }}>{m.role as string}</span>
                  {isAdmin && m.role !== "OWNER" && (
                    <button onClick={() => handleToggleMember(m.id as number, !(m.is_active as boolean))} style={{
                      padding: "4px 10px", border: "1px solid #e2e8f0", background: "none",
                      borderRadius: 6, cursor: "pointer", fontSize: "0.72rem",
                      color: m.is_active ? "#dc2626" : "#059669",
                    }}>
                      {m.is_active ? "Отключить" : "Включить"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </LkLayout>
  );
}
