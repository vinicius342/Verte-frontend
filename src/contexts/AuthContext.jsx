import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  login as loginService,
  logout as logoutService,
  cadastrarUsuario as cadastrarService,
  observarUsuarioLogado,
} from "../services/authService";
import { buscarVinculo } from "../services/userService";
import { isFirebaseConfigured } from "../firebase/config";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [revendedoraId, setRevendedoraId] = useState(null);
  const [papel, setPapel] = useState(null);
  const [loading, setLoading] = useState(true);
  const requisicao = useRef(0);

  // Só a busca mais recente vale: evita que uma resposta antiga sobrescreva a nova.
  const carregarPerfil = useCallback(async (uid) => {
    const minha = ++requisicao.current;
    let vinculo = { revendedoraId: null, papel: null };
    try {
      vinculo = await buscarVinculo(uid);
    } catch (e) {
      console.error("Falha ao buscar o vínculo do usuário:", e);
    }
    if (minha === requisicao.current) {
      setRevendedoraId(vinculo.revendedoraId);
      setPapel(vinculo.papel);
    }
    return vinculo.revendedoraId;
  }, []);

  useEffect(() => {
    const cancelar = observarUsuarioLogado(async (u) => {
      setUsuario(u ?? null);
      if (!u) {
        requisicao.current++;
        setRevendedoraId(null);
        setPapel(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      await carregarPerfil(u.uid);
      setLoading(false);
    });
    return cancelar;
  }, [carregarPerfil]);

  const value = useMemo(
    () => ({
      usuario,
      uid: usuario?.uid ?? null,
      revendedoraId,
      papel,
      podeConfigurar: papel === "admin" || papel === "gerente",
      nome: usuario?.displayName ?? usuario?.email ?? null,
      loading,
      configurado: isFirebaseConfigured(),
      login: (email, senha) => loginService(email, senha),
      logout: () => logoutService(),
      // O listener de auth dispara antes de o perfil ser criado; busca de novo ao terminar.
      cadastrar: async (dados) => {
        const u = await cadastrarService(dados);
        await carregarPerfil(u.uid);
        return u;
      },
    }),
    [usuario, revendedoraId, papel, loading, carregarPerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}