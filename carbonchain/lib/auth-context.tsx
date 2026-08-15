"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { api, ApiError } from "@/lib/api-client";

export type UserRole = "OBLIGATED_ENTITY" | "VERIFIER" | "TRADER" | "AUDITOR" | "REGISTRY_ADMIN" | "SYSTEM_ADMIN";

export interface CarbonChainProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organization: { id: string; name: string; org_type: string };
}

interface AuthContextValue {
  session: Session | null;
  profile: CarbonChainProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CarbonChainProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.get<CarbonChainProfile>("/api/auth/me");
      setProfile(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "NO_PROFILE") {
        setError("This account has no CarbonChain profile provisioned. Contact your registry administrator.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
