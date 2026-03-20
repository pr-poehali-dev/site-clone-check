import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

interface Setting { key: string; value: unknown; description: string; }

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [broadcast, setBroadcast] = useState({ title: "", body: "" });
  const [sending, setSending] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  useEffect(() => {
    adminApi.settingsGet().then(r => setSettings(r.settings || []));
  }, []);

  const save = async (key: string) => {
    setSaving(true);
    let parsed: unknown = editVal;
    try { parsed = JSON.parse(editVal); } catch { parsed = editVal; }
    await adminApi.settingsSave(key, parsed);
    const r = await adminApi.settingsGet();
    setSettings(r.settings || []);
    setEditing(null);
    setMsg("Сохранено");
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  const sendBroadcast = async () => {
    if (!broadcast.title) return;
    setSending(true);
    await adminApi.notificationsBroadcast(broadcast.title, broadcast.body);
    setBroadcast({ title: "", body: "" });
    setBroadcastMsg("Уведомление отправлено всем пользователям");
    setSending(false);
    setTimeout(() => setBroadcastMsg(""), 3000);
  };

  const fmtVal = (v: unknown) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Настройки платформы</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Настройки */}
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#374151", marginBottom: 12 }}>Параметры</div>
          {msg && <div style={{ color: "#059669", fontSize: "0.82rem", marginBottom: 12 }}>{msg}</div>}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {settings.map((s, i) => (
              <div key={s.key} style={{ padding: "16px 20px", borderBottom: i < settings.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{s.key}</div>
                    {s.description && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{s.description}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {editing === s.key ? (
                      <>
                        <input value={editVal} onChange={e => setEditVal(e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1.5px solid #2563eb", fontSize: "0.85rem", width: 150 }} />
                        <button onClick={() => save(s.key)} disabled={saving}
                          style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
                          ✓
                        </button>
                        <button onClick={() => setEditing(null)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: "0.8rem", cursor: "pointer" }}>
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <code style={{ fontSize: "0.82rem", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, color: "#0f172a" }}>
                          {fmtVal(s.value)}
                        </code>
                        <button onClick={() => { setEditing(s.key); setEditVal(fmtVal(s.value)); }}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "transparent", fontSize: "0.75rem", cursor: "pointer", color: "#374151" }}>
                          Изменить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Рассылка уведомлений */}
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#374151", marginBottom: 12 }}>Рассылка уведомлений</div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: 4 }}>Заголовок *</label>
              <input value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))}
                placeholder="Важное обновление платформы"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: 4 }}>Текст</label>
              <textarea value={broadcast.body} onChange={e => setBroadcast(p => ({ ...p, body: e.target.value }))} rows={4}
                placeholder="Текст уведомления..."
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            {broadcastMsg && <div style={{ color: "#059669", fontSize: "0.82rem", marginBottom: 10 }}>{broadcastMsg}</div>}
            <button onClick={sendBroadcast} disabled={sending || !broadcast.title}
              style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
              {sending ? "Отправка..." : "Отправить всем"}
            </button>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 8, textAlign: "center" }}>
              Уведомление получат все активные пользователи
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
