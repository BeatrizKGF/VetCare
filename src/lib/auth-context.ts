import { createContext } from "react";

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

export interface AuthContextValue {
  user: UsuarioSessao | null;
  ready: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => void;
}

// Contexto isolado para manter identidade estável durante HMR
export const AuthContext = createContext<AuthContextValue | null>(null);
