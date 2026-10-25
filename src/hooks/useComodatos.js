import { useCallback, useEffect, useState } from "react";
import { listarComodatos } from "../services/comodatoService";
import { escutarAlteracoes } from "../services/apiFetch";
import { useAuth } from "./useAuth";

export function useComodatos() {
  const { revendedoraId } = useAuth();
  const [comodatos, setComodatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!revendedoraId) return;
    try {
      setComodatos(await listarComodatos(revendedoraId));
      setErro(null);
    } catch (e) {
      console.error("Falha ao carregar comodatos:", e);
      setErro(
        e?.code === "permission-denied"
          ? "Você não tem permissão para ver os comodatos."
          : "Não foi possível carregar os comodatos.",
      );
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

  useEffect(() => {
    if (!revendedoraId) return;
    setLoading(true);
    carregar();
    const pararAlteracoes = escutarAlteracoes("comodatos", carregar);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      pararAlteracoes();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [revendedoraId, carregar]);

  return { comodatos, loading, erro, recarregar: carregar };
}
