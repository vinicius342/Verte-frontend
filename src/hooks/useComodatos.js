import { useEffect, useState } from "react";
import { observarComodatos } from "../services/comodatoService";

export function useComodatos() {
  const [comodatos, setComodatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cancelar = observarComodatos(
      (dados) => {
        setComodatos(dados);
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
  }, []);

  return { comodatos, loading, erro };
}