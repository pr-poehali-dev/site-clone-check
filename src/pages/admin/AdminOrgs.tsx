import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Org {
  id: string; type: string; name: string; inn: string; kpp: string; address: string;
  is_active: boolean; owner_email: string; owner_name: string; created_at: string; members_count: number;
}

export default function AdminOrgs() {
  const [items, setItems] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.orgs({ q, type, page });
      setItems(res.orgs || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally { setLoading(false); }
  }, [q, type, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    const d = await adminApi.orgDetail(id);
    setSelected(d);
  };

  const toggleActive = async () => {
    if (!selected) return;
    setSaving(true);
    await adminApi.orgUpdate(selected.id as string, { is_active: !selected.is_active });
    setSaving(false);
    setSelected(prev => prev ? { ...prev, is_active: !prev.is_active } : prev);
    load();
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Организации</h1>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Всего: {total}</div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Поиск по названию, ИНН..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }} />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem" }}>
          <option value="">Все типы</option>
          <option value="AGENT">AGENT</option>
          <option value="BANK">BANK</option>
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Тип", "Название", "ИНН", "Владелец", "Участников", "Статус", ""].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Загрузка...</td></tr>
            ) : items.map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#2563eb" }}>{o.type}</span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{o.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{o.address}</div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{o.inn}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{o.owner_name || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{o.owner_email}</div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "#374151" }}>{o.members_count}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: o.is_active ? "#059669" : "#ef4444" }}>
                    {o.is_active ? "Активна" : "Заблокирована"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => openDetail(o.id)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "transparent", fontSize: "0.75rem", cursor: "pointer" }}>
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setSelected(null)}>
          <div style={{ width: 480, background: "#fff", height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{selected.name as string}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{selected.type as string} · {selected.inn as string}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <Icon name="X" size={20} />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[["КПП", selected.kpp], ["Адрес", selected.address], ["Владелец", selected.owner_email]].map(([l, v]) => (
                  <div key={l as string}>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{l}</div>
                    <div style={{ fontSize: "0.82rem", color: "#1e293b" }}>{v as string || "—"}</div>
                  </div>
                ))}
              </div>
              <button onClick={toggleActive} disabled={saving}
                style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                  background: selected.is_active ? "#fee2e2" : "#dcfce7", color: selected.is_active ? "#dc2626" : "#059669" }}>
                {selected.is_active ? "Заблокировать" : "Разблокировать"}
              </button>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 10 }}>
                  Участники ({(selected.members as unknown[])?.length || 0})
                </div>
                {((selected.members as { id: number; email: string; name: string; role: string; is_active: boolean }[]) || []).map(m => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.8rem" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.name || m.email}</div>
                      <div style={{ color: "#94a3b8" }}>{m.email}</div>
                    </div>
                    <span style={{ color: "#7c3aed", fontWeight: 600 }}>{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
