import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Account } from "../types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  account: Account | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

async function loadAccount(userId: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("owner_id", userId)
      .single();

    if (error) {
      console.log("Trying to load account for user:", userId);
      console.error("Failed to load account:", error.message, "for user:", userId);
      // Create account manually if trigger didn't fire
      const { data: newAccount, error: createError } = await supabase
        .from("accounts")
        .insert({ owner_id: userId, business_name: "My Business" })
        .select()
        .single();
      if (createError) {
        console.error("Failed to create account:", createError.message);
        return;
      }
      setAccount(newAccount as Account);
      return;
    }
    setAccount(data as Account);
  }

  async function refreshAccount() {
    if (user) await loadAccount(user.id);
  }

  useEffect(() => {
    console.log("Auth state changed, user:", session?.user?.id);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAccount(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadAccount(session.user.id);
        } else {
          setAccount(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, businessName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName },
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{
      user, session, account, loading,
      signIn, signUp, signOut, refreshAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}