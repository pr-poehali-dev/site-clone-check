import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLkAuth } from "@/hooks/useLkAuth";
import Icon from "@/components/ui/icon";

const NAV = [
  { to: "/lk/admin", label: "Обзор", icon: "LayoutDashboard", end: true },
  { to: "/lk/admin/users", label: "Пользователи", icon: "Users" },
  { to: "/lk/admin/orgs", label: "Организации", icon: "Building2" },
  { to: "/lk/admin/companies", label: "Компании", icon: "Briefcase" },
  { to: "/lk/admin/requests", label: "Заявки", icon: "FileText" },
  { to: "/lk/admin/offers", label: "Офферы", icon: "Tag" },
  { to: "/lk/admin/files", label: "Файлы", icon: "Paperclip" },
  { to: "/lk/admin/dicts", label: "Справочники", icon: "BookOpen" },
  { to: "/lk/admin/reports", label: "Экспорт", icon: "Download" },
  { to: "/lk/admin/audit", label: "Аудит", icon: "Shield" },
  { to: "/lk/admin/settings", label: "Настройки", icon: "Settings" },
];

export default function AdminLayout() {
  const { user, logout } = useLkAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/lk/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "#0f172a", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
      }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>ВалютаПэй</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>Панель администратора</div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px", textDecoration: "none",
                fontSize: "0.82rem", fontWeight: 500,
                color: isActive ? "#fff" : "#94a3b8",
                background: isActive ? "#1e40af" : "transparent",
                borderRadius: 6, margin: "1px 8px",
                transition: "all 0.15s",
              })}
            >
              <Icon name={item.icon as "Users"} size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/lk/requests")}
              style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer" }}
            >
              В ЛК
            </button>
            <button
              onClick={handleLogout}
              style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Выйти
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: "24px", minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
