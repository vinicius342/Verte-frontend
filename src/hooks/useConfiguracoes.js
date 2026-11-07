import { useCallback, useEffect, useState } from "react";
import { buscarConfiguracaoRevendedora } from "../services/revendedoraService";
import { useAuth } from "./useAuth";

// Configurações da revendedora (o perfil do usuário agora fica em usePerfil).
export function useConfiguracoes() {
  const { uid, revendedoraId, ehVisitante } = useAuth();
  const [revendedora, setRevendedora] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!uid || !revendedoraId || ehVisitante) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await buscarConfiguracaoRevendedora(revendedoraId);
      setRevendedora(r);
      setErro(null);
    } catch (e) {
      console.error("Falha ao carregar configurações:", e);
      setErro("Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  }, [uid, revendedoraId, ehVisitante]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { revendedora, loading, erro, recarregar: carregar };
}
