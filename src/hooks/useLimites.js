import { useEffect, useState } from "react";
import { observarLimites } from "../services/limiteService";
import { useAuth } from "./useAuth";

export function useLimites() {
  const { revendedoraId } = useAuth();
  const [limites, setLimites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!revendedoraId) return;
    setLoading(true);
    const cancelar = observarLimites(
      revendedoraId,
      (dados) => {
        setLimites(dados);
        setErro(null);
        setLoading(false);
      },
      (erroSnapshot) => {
        console.error("Falha ao observar limites:", erroSnapshot);
        setErro(
          erroSnapshot?.code === "permission-denied"
            ? "Você não tem permissão para ver as solicitações."
            : "Não foi possível carregar as solicitações.",
        );
        setLoading(false);
      },
    );
    return cancelar;
  }, [revendedoraId]);

  return { limites, loading, erro };
}