import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { lkAuth, setToken, saveUser } from "@/lib/lkApi";
import Icon from "@/components/ui/icon";

export default function LkLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await lkAuth.login(email, password);
      setToken(data.token);
      saveUser(data.user);
      if (data.user.lk_role === "AGENT") {
        navigate("/lk/agent/requests");
      } else {
        navigate("/lk/requests");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>ВалютаПэй</div>
          <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Войдите в личный кабинет</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Пароль</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 12px", fontSize: "0.85rem", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "11px", borderRadius: 8, border: "none",
              background: loading ? "#94a3b8" : "#2563eb", color: "#fff",
              fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#64748b" }}>
            Нет аккаунта?{" "}
            <Link to="/lk/register" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
