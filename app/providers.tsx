"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, initializeSession, setAccessToken } from "../lib/api";

export type User = { id: number; name: string; email: string; phoneNumber?: string | null; role: "customer" | "admin" };
type ProfileUpdate = { name: string; phoneNumber?: string };
type SessionValue = {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phoneNumber?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (details: ProfileUpdate) => Promise<void>;
};
const SessionContext = createContext<SessionValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    initializeSession().then((current) => { if (active) setUser(current); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User; accessToken: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
    setAccessToken(result.accessToken); setUser(result.user); return result.user;
  }, []);
  const register = useCallback(async (name: string, email: string, password: string, phoneNumber?: string) => {
    const result = await api<{ user: User; accessToken: string }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, phoneNumber }) }, false);
    setAccessToken(result.accessToken); setUser(result.user); return result.user;
  }, []);
  const logout = useCallback(async () => {
    try { await api("/auth/logout", { method: "POST" }, false); } finally { setAccessToken(null); setUser(null); }
  }, []);
  const updateProfile = useCallback(async (details: ProfileUpdate) => {
    const profile = await api<User>("/users/me", { method: "PATCH", body: JSON.stringify(details) });
    setUser((current) => current?.id === profile.id
      ? { ...current, name: profile.name, phoneNumber: profile.phoneNumber }
      : current);
  }, []);
  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile }), [user, loading, login, register, logout, updateProfile]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within Providers");
  return context;
}
