import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

interface Currency { code: string; name: string; symbol: string; is_active: boolean; }
interface Country { code: string; name: string; is_active: boolean; }

export default function AdminDicts() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tab, setTab] = useState<"currencies" | "countries">("currencies");
  const [form, setForm] = useState({ code: "", name: "", symbol: "", is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    adminApi.dictsCurrencies().then(r => setCurrencies(r.currencies || []));
    adminApi.dictsCountries().then(r => setCountries(r.countries || []));
  }, []);

  const saveCurrency = async () => {
    if (!form.code || !form.name) return;
    setSaving(true);
    await adminApi.dictsSaveCurrency(form);
    const r = await adminApi.dictsCurrencies();
    setCurrencies(r.currencies || []);
    setForm({ code: "", name: "", symbol: "", is_active: true });
    setMsg("Сохранено");
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Справочники</h1>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#f1f5f9", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {(["currencies", "countries"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
              background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0f172a" : "#64748b",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t === "currencies" ? "Валюты" : "Страны"}
          </button>
        ))}
      </div>

      {tab === "currencies" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Код", "Название", "Символ", "Статус"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currencies.map(c => (
                  <tr key={c.code} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => setForm({ code: c.code, name: c.name, symbol: c.symbol, is_active: c.is_active })}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{c.code}</td>
                    <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#374151" }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#374151" }}>{c.symbol}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: "0.75rem", color: c.is_active ? "#059669" : "#ef4444", fontWeight: 600 }}>
                        {c.is_active ? "Активна" : "Отключена"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 16 }}>
              {form.code && currencies.find(c => c.code === form.code) ? "Редактировать" : "Добавить валюту"}
            </div>
            {[["Код (USD, EUR...)", "code"], ["Название", "name"], ["Символ ($, €...)", "symbol"]].map(([ph, key]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: 4 }}>{ph}</label>
                <input value={(form as Record<string, unknown>)[key] as string}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.85rem", boxSizing: "border-box" }} />
              </div>
            ))}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#374151", marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              Активна
            </label>
            {msg && <div style={{ color: "#059669", fontSize: "0.82rem", marginBottom: 8 }}>{msg}</div>}
            <button onClick={saveCurrency} disabled={saving || !form.code || !form.name}
              style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      {tab === "countries" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Код", "Название", "Статус"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countries.map(c => (
                <tr key={c.code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{c.code}</td>
                  <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#374151" }}>{c.name}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: "0.75rem", color: c.is_active ? "#059669" : "#ef4444", fontWeight: 600 }}>
                      {c.is_active ? "Активна" : "Отключена"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
