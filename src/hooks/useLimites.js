import { useCallback, useEffect, useState } from "react";
import { listarLimites } from "../services/limiteService";
import { escutarAlteracoes } from "../services/apiFetch";
import { useAuth } from "./useAuth";

export function useLimites() {
  const { revendedoraId } = useAuth();
  const [limites, setLimites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!revendedoraId) return;
    try {
      setLimites(await listarLimites(revendedoraId));
      setErro(null);
    } catch (e) {
      console.error("Falha ao carregar limites:", e);
      setErro(
        e?.code === "permission-denied"
          ? "Você não tem permissão para ver as solicitações."
          : "Não foi possível carregar as solicitações.",
      );
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

  useEffect(() => {
    if (!revendedoraId) return;
    setLoading(true);
    carregar();
    const pararAlteracoes = escutarAlteracoes("limites", carregar);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      pararAlteracoes();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [revendedoraId, carregar]);

  return { limites, loading, erro, recarregar: carregar };
}
