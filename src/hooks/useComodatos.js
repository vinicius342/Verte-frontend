import { useEffect, useState } from "react";
import { observarComodatos } from "../services/comodatoService";
import { useAuth } from "./useAuth";

export function useComodatos() {
  const { revendedoraId } = useAuth();
  const [comodatos, setComodatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!revendedoraId) return;
    setLoading(true);
    const cancelar = observarComodatos(
      revendedoraId,
      (dados) => {
        setComodatos(dados);
        setErro(null);
        setLoading(false);
      },
      (erroSnapshot) => {
        console.error("Falha ao observar comodatos:", erroSnapshot);
        setErro(
          erroSnapshot?.code === "permission-denied"
            ? "Você não tem permissão para ver os comodatos."
            : "Não foi possível carregar os comodatos.",
        );
        setLoading(false);
      },
    );
    return cancelar;
  }, [revendedoraId]);

  return { comodatos, loading, erro };
}