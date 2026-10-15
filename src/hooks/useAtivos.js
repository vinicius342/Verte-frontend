import { useEffect, useState } from "react";
import { observarAtivos } from "../services/ativoService";
import { useAuth } from "./useAuth";

export function useAtivos() {
  const { uid } = useAuth();
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const cancelar = observarAtivos(
      uid,
      (lista) => {
        setAtivos(lista);
        setErro(null);
        setLoading(false);
      },
      (e) => {
        console.error("Falha ao carregar ativos:", e);
        setErro("Não foi possível carregar os ativos.");
        setLoading(false);
      },
    );
    return cancelar;
  }, [uid]);

  return { ativos, loading, erro };
}