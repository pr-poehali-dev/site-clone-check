import { useState, useEffect } from "react";
import { lkCompanies, LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; }

const emptyForm = { name: "", inn: "", kpp: "", address: "", email: "", phone: "" };

export default function ClientCompanies({ user, unreadCount }: Props) {
  const [companies, setCompanies] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await lkCompanies.list();
      setCompanies(data.companies || []);
    } catch (_e) { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowForm(true); setError(""); };

  const openEdit = (c: Record<string, unknown>) => {
    const contacts = (c.contacts as Record<string, string>) || {};
    setForm({
      name: c.name as string || "",
      inn: c.inn as string || "",
      kpp: c.kpp as string || "",
      address: c.address as string || "",
      email: contacts.email || "",
      phone: contacts.phone || "",
    });
    setEditing(c.id as string);
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!form.name) { setError("Название обязательно"); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        await lkCompanies.update(editing, form);
      } else {
        await lkCompanies.create(form);
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const inpStyle = { width: "100%", padding: "8px 11px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Мои компании</h1>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
          background: "#2563eb", color: "#fff", borderRadius: 8, border: "none",
          cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
        }}>
          <Icon name="Plus" size={15} />Добавить
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #bfdbfe", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 16 }}>
            {editing ? "Редактирование компании" : "Новая компания"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Название *", "name", "ООО Ромашка"],
              ["ИНН", "inn", "1234567890"],
              ["КПП", "kpp", "123456789"],
              ["Адрес", "address", "Москва, ул. Пушкина 1"],
              ["Email", "email", "info@company.ru"],
              ["Телефон", "phone", "+7 900 000-00-00"],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph} style={inpStyle} />
              </div>
            ))}
          </div>
          {error && <div style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: 10 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: "8px 18px", background: saving ? "#94a3b8" : "#2563eb",
              color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
            }}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: "8px 14px", background: "none", border: "1px solid #e2e8f0",
              borderRadius: 8, cursor: "pointer", color: "#64748b", fontSize: "0.875rem",
            }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
      ) : companies.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
          <Icon name="Building2" size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: "0.9rem", marginBottom: 16 }}>Компаний пока нет</div>
          <button onClick={openCreate} style={{
            padding: "9px 18px", background: "#2563eb", color: "#fff",
            borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
          }}>Добавить компанию</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {companies.map((c: Record<string, unknown>) => {
            const contacts = (c.contacts as Record<string, string>) || {};
            return (
              <div key={c.id as string} style={{
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: "18px 20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{c.name as string}</div>
                  <button onClick={() => openEdit(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                    <Icon name="Pencil" size={15} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {c.inn && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>ИНН: {c.inn as string}{c.kpp ? ` / КПП: ${c.kpp as string}` : ""}</div>}
                  {c.address && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{c.address as string}</div>}
                  {contacts.email && <div style={{ fontSize: "0.8rem", color: "#2563eb" }}>{contacts.email}</div>}
                  {contacts.phone && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{contacts.phone}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </LkLayout>
  );
}