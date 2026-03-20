import { useState, useEffect, useCallback } from "react";
import { lkAuth, getToken, getUser, saveUser, clearToken, LkUser } from "@/lib/lkApi";

export function useLkAuth() {
  const [user, setUser] = useState<LkUser | null>(getUser());
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) { setChecked(true); return; }
    setLoading(true);
    try {
      const data = await lkAuth.me();
      if (data.user) {
        saveUser(data.user);
        setUser(data.user);
      }
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
      setChecked(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = () => { clearToken(); setUser(null); };

  return { user, loading, checked, logout, refresh };
}
