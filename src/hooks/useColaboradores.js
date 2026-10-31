import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { listarColaboradores } from "../services/colaboradorService";

export function useColaboradores() {
  const { revendedoraId } = useAuth();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!revendedoraId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      setColaboradores(await listarColaboradores(revendedoraId));
    } catch (e) {
      console.error("listarColaboradores:", e);
      setErro(`Não foi possível carregar os colaboradores${e?.code ? ` (${e.code})` : ""}.`);
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { colaboradores, loading, erro, recarregar: carregar };
}
