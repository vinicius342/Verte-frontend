import { useEffect, useState } from "react";
import { observarLimites } from "../services/limiteService";

export function useLimites() {
  const [limites, setLimites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarLimites(
      (dados) => {
        setLimites(dados);
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
  }, []);

  return { limites, loading, erro };
}