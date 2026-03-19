import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: "admin" | "worker" | "superuser" | null;
  isSuperuser: boolean;
  tenantId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"admin" | "worker" | "superuser" | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserMeta = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roleList = roles || [];
    const hasSuperuser = roleList.some((r) => r.role === "superuser");
    setIsSuperuser(hasSuperuser);

    const tenantRole = roleList.find((r) => r.role === "admin" || r.role === "worker");
    if (tenantRole) {
      setRole(tenantRole.role as "admin" | "worker" | "superuser");
    } else if (hasSuperuser) {
      setRole("superuser");
    } else {
      setRole(null);
    }

    // Get tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    
    setTenantId(profile?.tenant_id || null);
  };

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserMeta(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock when querying inside callback
          setTimeout(() => fetchUserMeta(session.user.id), 0);
        } else {
          setRole(null);
          setIsSuperuser(false);
          setTenantId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || undefined,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setIsSuperuser(false);
    setTenantId(null);
  };

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchUserMeta(session.user.id);
    } else {
      setRole(null);
      setIsSuperuser(false);
      setTenantId(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isSuperuser, tenantId, loading, signIn, signUp, signInWithMagicLink, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
