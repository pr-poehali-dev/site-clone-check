import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { clearToken, LkUser } from "@/lib/lkApi";

interface LkLayoutProps {
  user: LkUser;
  children: React.ReactNode;
  unreadCount?: number;
}

export default function LkLayout({ user, children, unreadCount = 0 }: LkLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAgent = user.lk_role === "AGENT";

  const clientNav = [
    { path: "/lk/requests", label: "Мои заявки", icon: "FileText" },
    { path: "/lk/companies", label: "Мои компании", icon: "Building2" },
    { path: "/lk/notifications", label: "Уведомления", icon: "Bell", badge: unreadCount },
    { path: "/lk/profile", label: "Профиль", icon: "User" },
  ];

  const agentNav = [
    { path: "/lk/agent/requests", label: "Каталог заявок", icon: "List" },
    { path: "/lk/agent/offers", label: "Мои предложения", icon: "HandCoins" },
    { path: "/lk/agent/org", label: "Организация", icon: "Building2" },
    { path: "/lk/notifications", label: "Уведомления", icon: "Bell", badge: unreadCount },
    { path: "/lk/profile", label: "Профиль", icon: "User" },
  ];

  const nav = isAgent ? agentNav : clientNav;

  const handleLogout = () => {
    clearToken();
    navigate("/lk/login");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar desktop */}
      <aside style={{
        width: 240, background: "#fff", borderRight: "1px solid #e2e8f0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh",
      }} className="hidden lg:flex">
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>ВалютаПэй</div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
              {isAgent ? "Личный кабинет агента" : "Личный кабинет клиента"}
            </div>
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {nav.map(item => (
            <button key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                background: isActive(item.path) ? "#eff6ff" : "transparent",
                color: isActive(item.path) ? "#2563eb" : "#374151",
                fontWeight: isActive(item.path) ? 600 : 400,
                fontSize: "0.875rem", textAlign: "left", marginBottom: 2,
                position: "relative",
              }}>
              <Icon name={item.icon as never} size={16} />
              {item.label}
              {(item.badge || 0) > 0 && (
                <span style={{
                  marginLeft: "auto", background: "#ef4444", color: "#fff",
                  borderRadius: 10, fontSize: "0.65rem", fontWeight: 700,
                  padding: "1px 6px", minWidth: 18, textAlign: "center",
                }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b" }}>{user.full_name || user.email}</div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{user.email}</div>
          </div>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#ef4444", fontSize: "0.85rem",
          }}>
            <Icon name="LogOut" size={15} />Выйти
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <header style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "12px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }} className="lg:hidden">
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>ВалютаПэй</div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name={mobileOpen ? "X" : "Menu"} size={22} style={{ color: "#374151" }} />
          </button>
        </header>

        {mobileOpen && (
          <div style={{
            background: "#fff", borderBottom: "1px solid #e2e8f0",
            padding: "8px 12px 16px",
          }} className="lg:hidden">
            {nav.map(item => (
              <button key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 8px", background: "none", border: "none",
                  borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                  color: isActive(item.path) ? "#2563eb" : "#374151",
                  fontWeight: isActive(item.path) ? 600 : 400, fontSize: "0.9rem",
                }}>
                <Icon name={item.icon as never} size={16} />{item.label}
                {(item.badge || 0) > 0 && (
                  <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: 10, fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px" }}>{item.badge}</span>
                )}
              </button>
            ))}
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 8px",
              background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.9rem",
            }}>
              <Icon name="LogOut" size={15} />Выйти
            </button>
          </div>
        )}

        <main style={{ flex: 1, padding: "24px 16px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
