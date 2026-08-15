"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
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
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CarbonChainProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mirrors `profile` for use inside the onAuthStateChange listener below,
  // which is registered once (empty-ish dep array) and would otherwise
  // close over a stale `profile` value from its first render.
  const profileRef = useRef<CarbonChainProfile | null>(null);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

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

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (!newSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Supabase fires this listener on routine token refreshes too —
      // e.g. every time the tab regains focus after being backgrounded.
      // Only show the full loading screen for a genuinely new sign-in;
      // a background token refresh should never re-trigger it, since we
      // already have a valid profile loaded from before.
      const isRoutineRefresh = event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION";
      if (isRoutineRefresh && profileRef.current) {
        return;
      }

      setLoading(true);
      loadProfile().finally(() => setLoading(false));
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

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      throw signUpError;
    }
    // If email confirmation is required, Supabase returns a user but no
    // active session yet — the account exists, but can't sign in until
    // confirmed. Either way, this account has no `profiles` row yet;
    // that's expected — a registry administrator provisions the role and
    // organization afterward. The "Account not fully provisioned" screen
    // in page.tsx already handles that state once they do get a session.
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, error, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
