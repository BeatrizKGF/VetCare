import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import bcrypt from "bcryptjs";

import { AuthContext, type AuthContextValue, type UsuarioSessao } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "vetcare.sessao";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioSessao | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as UsuarioSessao);
    } catch {
      // sessão inválida — ignora
    }
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, senha: string) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, senha_hash, perfil, ativo")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("E-mail ou senha incorretos.");
    if (data.ativo === false) throw new Error("Este usuário está inativo.");

    const hash = String(data.senha_hash ?? "").replace(/^\$2b\$/, "$2a$");
    const ok = await bcrypt.compare(senha, hash);
    if (!ok) throw new Error("E-mail ou senha incorretos.");

    const sessao: UsuarioSessao = {
      id: data.id as string,
      nome: (data.nome as string) ?? "",
      email: data.email as string,
      perfil: (data.perfil as string) ?? "usuario",
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
    setUser(sessao);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, signIn, signOut }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
