import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login as loginService,
  logout as logoutService,
  cadastrarUsuario as cadastrarService,
  observarUsuarioLogado,
} from "../services/authService";
import { isFirebaseConfigured } from "../firebase/config";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cancelar = observarUsuarioLogado((u) => {
      setUsuario(u ?? null);
      setLoading(false);
    });
    return cancelar;
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      uid: usuario?.uid ?? null,
      nome: usuario?.displayName ?? usuario?.email ?? null,
      loading,
      configurado: isFirebaseConfigured(),
      login: (email, senha) => loginService(email, senha),
      logout: () => logoutService(),
      cadastrar: (dados) => cadastrarService(dados),
    }),
    [usuario, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
