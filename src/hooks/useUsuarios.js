import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { listarUsuarios } from "../services/usuarioAdminService";

export function useUsuarios() {
  const { revendedoraId } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
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
      setUsuarios(await listarUsuarios(revendedoraId));
    } catch (e) {
      console.error("listarUsuarios:", e);
      setErro(`Não foi possível carregar os usuários${e?.code ? ` (${e.code})` : ""}.`);
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { usuarios, loading, erro, recarregar: carregar };
}
