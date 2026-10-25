import { useCallback, useEffect, useState } from "react";
import { listarAtivos } from "../services/ativoService";
import { escutarAlteracoes } from "../services/apiFetch";
import { useAuth } from "./useAuth";

export function useAtivos() {
  const { revendedoraId } = useAuth();
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!revendedoraId) return;
    try {
      setAtivos(await listarAtivos(revendedoraId));
      setErro(null);
    } catch (e) {
      console.error("Falha ao carregar ativos:", e);
      setErro("Não foi possível carregar os ativos.");
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

  useEffect(() => {
    if (!revendedoraId) return;
    setLoading(true);
    carregar();
    const pararAlteracoes = escutarAlteracoes("ativos", carregar);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      pararAlteracoes();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [revendedoraId, carregar]);

  return { ativos, loading, erro, recarregar: carregar };
}
