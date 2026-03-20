import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useLkAuth } from "@/hooks/useLkAuth";
import { lkAuth, LkUser } from "@/lib/lkApi";

import LkLogin from "./LkLogin";
import LkRegister from "./LkRegister";
import ClientRequests from "./client/ClientRequests";
import NewRequest from "./client/NewRequest";
import RequestDetail from "./client/RequestDetail";
import ClientCompanies from "./client/ClientCompanies";
import AgentRequests from "./agent/AgentRequests";
import AgentRequestDetail from "./agent/AgentRequestDetail";
import AgentOffers from "./agent/AgentOffers";
import AgentOrg from "./agent/AgentOrg";
import LkNotifications from "./LkNotifications";
import LkProfile from "./LkProfile";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminOrgs from "@/pages/admin/AdminOrgs";
import AdminCompanies from "@/pages/admin/AdminCompanies";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminOffers from "@/pages/admin/AdminOffers";
import AdminFiles from "@/pages/admin/AdminFiles";
import AdminDicts from "@/pages/admin/AdminDicts";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReports from "@/pages/admin/AdminReports";

function RequireAuth({ user, checked, children }: { user: LkUser | null; checked: boolean; children: React.ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (checked && !user) navigate("/lk/login");
  }, [checked, user, navigate]);
  if (!checked) return <div style={{ textAlign: "center", padding: 64, color: "#94a3b8" }}>Загрузка...</div>;
  if (!user) return null;
  return <>{children}</>;
}

export default function LkRouter() {
  const { user: authUser, checked, refresh } = useLkAuth();
  const [user, setUser] = useState<LkUser | null>(authUser);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { setUser(authUser); }, [authUser]);

  const loadUnread = useCallback(async () => {
    if (!user) return;
    try {
      const data = await lkAuth.notifications();
      const count = (data.notifications || []).filter((n: Record<string, unknown>) => !n.read_at).length;
      setUnreadCount(count);
    } catch (_e) { /* noop */ }
  }, [user]);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [loadUnread]);

  const handleUserUpdate = (u: LkUser) => { setUser(u); };

  const commonProps = { user: user!, unreadCount };

  return (
    <Routes>
      <Route path="login" element={<LkLogin />} />
      <Route path="register" element={<LkRegister />} />

      {/* Client routes */}
      <Route path="requests" element={
        <RequireAuth user={user} checked={checked}>
          <ClientRequests {...commonProps} />
        </RequireAuth>
      } />
      <Route path="requests/new" element={
        <RequireAuth user={user} checked={checked}>
          <NewRequest {...commonProps} />
        </RequireAuth>
      } />
      <Route path="requests/:id" element={
        <RequireAuth user={user} checked={checked}>
          <RequestDetail {...commonProps} />
        </RequireAuth>
      } />
      <Route path="companies" element={
        <RequireAuth user={user} checked={checked}>
          <ClientCompanies {...commonProps} />
        </RequireAuth>
      } />

      {/* Agent routes */}
      <Route path="agent/requests" element={
        <RequireAuth user={user} checked={checked}>
          <AgentRequests {...commonProps} />
        </RequireAuth>
      } />
      <Route path="agent/requests/:id" element={
        <RequireAuth user={user} checked={checked}>
          <AgentRequestDetail {...commonProps} />
        </RequireAuth>
      } />
      <Route path="agent/offers" element={
        <RequireAuth user={user} checked={checked}>
          <AgentOffers {...commonProps} />
        </RequireAuth>
      } />
      <Route path="agent/org" element={
        <RequireAuth user={user} checked={checked}>
          <AgentOrg {...commonProps} />
        </RequireAuth>
      } />

      {/* Shared */}
      <Route path="notifications" element={
        <RequireAuth user={user} checked={checked}>
          <LkNotifications {...commonProps} onRead={loadUnread} />
        </RequireAuth>
      } />
      <Route path="profile" element={
        <RequireAuth user={user} checked={checked}>
          <LkProfile {...commonProps} onUpdate={handleUserUpdate} />
        </RequireAuth>
      } />

      {/* Admin routes */}
      <Route path="admin" element={
        <RequireAuth user={user} checked={checked}>
          <AdminLayout />
        </RequireAuth>
      }>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orgs" element={<AdminOrgs />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="files" element={<AdminFiles />} />
        <Route path="dicts" element={<AdminDicts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={
        checked ? (
          user ? (
            <Navigate to={user.lk_role === "AGENT" ? "/lk/agent/requests" : (["ADMIN", "PLATFORM_ADMIN"].includes(user.lk_role) || user.is_admin) ? "/lk/admin" : "/lk/requests"} replace />
          ) : (
            <Navigate to="/lk/login" replace />
          )
        ) : null
      } />
    </Routes>
  );
}