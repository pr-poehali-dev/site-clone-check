import { useState, useEffect } from "react";
import { lkAuth, LkUser } from "@/lib/lkApi";
import LkLayout from "@/components/lk/LkLayout";
import Icon from "@/components/ui/icon";

interface Props { user: LkUser; unreadCount?: number; onRead?: () => void; }

const TYPE_ICONS: Record<string, string> = {
  welcome: "Smile",
  new_offer: "HandCoins",
  offer_selected: "CheckCircle",
  payment_done: "CreditCard",
  reminder: "Bell",
};

export default function LkNotifications({ user, unreadCount, onRead }: Props) {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await lkAuth.notifications();
      setNotifications(data.notifications || []);
    } catch (_e) { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReadAll = async () => {
    await lkAuth.readNotification();
    await load();
    onRead?.();
  };

  const handleRead = async (id: string) => {
    await lkAuth.readNotification(id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x));
    onRead?.();
  };

  const unread = notifications.filter(n => !n.read_at);

  return (
    <LkLayout user={user} unreadCount={unreadCount}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Уведомления {unread.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, fontSize: "0.7rem", padding: "1px 7px", marginLeft: 8 }}>{unread.length}</span>}
        </h1>
        {unread.length > 0 && (
          <button onClick={handleReadAll} style={{ fontSize: "0.82rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
            Прочитать все
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Загрузка...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: "#94a3b8" }}>
          <Icon name="Bell" size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: "0.9rem" }}>Нет уведомлений</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n: Record<string, unknown>) => (
            <div key={n.id as string}
              onClick={() => !n.read_at && handleRead(n.id as string)}
              style={{
                background: n.read_at ? "#fff" : "#eff6ff",
                borderRadius: 10, border: `1px solid ${n.read_at ? "#e2e8f0" : "#bfdbfe"}`,
                padding: "14px 16px", cursor: n.read_at ? "default" : "pointer",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: n.read_at ? "#f1f5f9" : "#dbeafe",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={(TYPE_ICONS[n.type as string] || "Bell") as never} size={16}
                  style={{ color: n.read_at ? "#94a3b8" : "#2563eb" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.read_at ? 500 : 700, color: "#1e293b", fontSize: "0.875rem", marginBottom: 2 }}>
                  {n.title as string}
                </div>
                {n.body && <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{n.body as string}</div>}
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 5 }}>
                  {new Date(n.created_at as string).toLocaleString("ru")}
                </div>
              </div>
              {!n.read_at && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}
    </LkLayout>
  );
}
