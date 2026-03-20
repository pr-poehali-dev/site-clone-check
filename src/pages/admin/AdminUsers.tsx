import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

const ROLES = ["", "CLIENT", "AGENT", "PARTNER", "ADMIN", "PLATFORM_ADMIN", "COMPLIANCE", "SUPPORT"];
const ROLE_COLORS: Record<string, string> = {
  CLIENT: "#3b82f6", AGENT: "#7c3aed", PARTNER: "#059669",
  ADMIN: "#dc2626", PLATFORM_ADMIN: "#dc2626", COMPLIANCE: "#f59e0b", SUPPORT: "#0891b2",
};

interface User {
  id: number; email: string; name: string; company: string; inn: string; phone: string;
  lk_role: string; is_active: boolean; is_admin: boolean; is_verified: boolean;
  created_at: string; requests_count: number; offers_count: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users({ q, role, page });
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [q, role, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (u: User) => {
    setSelected(u);
    const d = await adminApi.userDetail(u.id);
    setDetail(d);
  };

  const updateUser = async (field: string, value: unknown) => {
    if (!selected) return;
    setSaving(true);
    await adminApi.userUpdate(selected.id, { [field]: value });
    setSaving(false);
    load();
    setSelected(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Пользователи</h1>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Всего: {total}</div>
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по email, имени, ИНН..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}
        />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
          {ROLES.map(r => <option key={r} value={r}>{r || "Все роли"}</option>)}
        </select>
      </div>

      {/* Таблица */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "Email", "Имя / Компания", "Роль", "Статус", "Заявки", "Офферы", "Дата", ""].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: "#94a3b8" }}>#{u.id}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#1e293b" }}>{u.email}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{u.name || "—"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{u.company || ""}</div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${ROLE_COLORS[u.lk_role] || "#94a3b8"}20`, color: ROLE_COLORS[u.lk_role] || "#94a3b8" }}>
                    {u.lk_role || "—"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: u.is_active ? "#059669" : "#ef4444" }}>
                    {u.is_active ? "Активен" : "Заблокирован"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{u.requests_count}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{u.offers_count}</td>
                <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#94a3b8" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("ru-RU") : "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => openDetail(u)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "transparent", fontSize: "0.75rem", cursor: "pointer", color: "#374151" }}>
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e2e8f0", background: p === page ? "#2563eb" : "#fff", color: p === page ? "#fff" : "#374151", fontSize: "0.82rem", cursor: "pointer" }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Детальная панель */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
          onClick={() => { setSelected(null); setDetail(null); }}>
          <div style={{ width: 480, background: "#fff", height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{selected.name || selected.email}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{selected.email}</div>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <Icon name="X" size={20} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[["ИНН", selected.inn], ["Телефон", selected.phone], ["Компания", selected.company]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>{l}</div>
                    <div style={{ fontSize: "0.85rem", color: "#1e293b" }}>{v || "—"}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 8 }}>Роль</div>
                <select value={selected.lk_role} onChange={e => updateUser("lk_role", e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
                  {ROLES.filter(r => r).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button onClick={() => updateUser("is_active", !selected.is_active)} disabled={saving}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                    background: selected.is_active ? "#fee2e2" : "#dcfce7", color: selected.is_active ? "#dc2626" : "#059669" }}>
                  {selected.is_active ? "Заблокировать" : "Разблокировать"}
                </button>
                <button onClick={() => updateUser("is_admin", !selected.is_admin)} disabled={saving}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", background: "#fff", color: "#374151" }}>
                  {selected.is_admin ? "Снять is_admin" : "Назначить is_admin"}
                </button>
              </div>

              {detail && (
                <>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#374151", marginBottom: 8 }}>Заявки ({(detail.requests as unknown[])?.length || 0})</div>
                  {((detail.requests as { id: string; invoice_number: string; amount: number; currency: string; status: string }[]) || []).slice(0, 5).map(r => (
                    <div key={r.id} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 600 }}>{r.invoice_number}</span> — {r.amount.toLocaleString()} {r.currency}
                      <span style={{ marginLeft: 8, color: "#64748b" }}>{r.status}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
