import { useCallback, useEffect, useState } from "react";
import { buscarPerfil } from "../services/perfilService";
import { buscarConfiguracaoRevendedora } from "../services/revendedoraService";
import { useAuth } from "./useAuth";

export function useConfiguracoes() {
  const { uid, revendedoraId } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [revendedora, setRevendedora] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!uid || !revendedoraId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        buscarPerfil(revendedoraId, uid),
        buscarConfiguracaoRevendedora(revendedoraId),
      ]);
      setPerfil(p);
      setRevendedora(r);
      setErro(null);
    } catch (e) {
      console.error("Falha ao carregar configurações:", e);
      setErro("Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  }, [uid, revendedoraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { perfil, revendedora, loading, erro, recarregar: carregar };
}
