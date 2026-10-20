import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { buscarPerfil } from "../services/perfilService";

// Carrega o perfil (vendedor, supervisor, assinatura) do usuário logado.
export function usePerfil() {
  const { uid, revendedoraId, loading: loadingAuth } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (loadingAuth) return;
    if (!uid || !revendedoraId) {
      setLoading(false);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setErro(null);

    buscarPerfil(revendedoraId, uid)
      .then((dados) => {
        if (!cancelado) setPerfil(dados);
      })
      .catch((err) => {
        console.error("Erro ao carregar perfil:", err);
        if (!cancelado) setErro(err?.message ?? "Não foi possível carregar o perfil.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [uid, revendedoraId, loadingAuth]);

  return { perfil, loading, erro };
}