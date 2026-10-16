import { useEffect, useState } from "react";
import { observarClientes } from "../services/clientService";
import { isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "./useAuth";

const chaveCache = (revendedoraId) => `rota-certa:clientes:${revendedoraId}`;

function lerCache(revendedoraId) {
  try {
    const bruto = localStorage.getItem(chaveCache(revendedoraId));
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function useClients() {
  const { revendedoraId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!revendedoraId) return;

    const cache = lerCache(revendedoraId);
    if (cache?.length) {
      setClientes(cache);
      setLoading(false);
    }

    if (!isFirebaseConfigured()) {
      setErro("Firebase não configurado. Adicione as chaves no arquivo .env.");
      setLoading(false);
      return;
    }

    let cancelar = () => {};
    try {
      cancelar = observarClientes(
        revendedoraId,
        (lista) => {
          setClientes(lista);
          setErro(null);
          setLoading(false);
          try {
            localStorage.setItem(chaveCache(revendedoraId), JSON.stringify(lista));
          } catch {
            /* cache é opcional */
          }
        },
        (e) => {
          setErro(e?.message ?? "Não foi possível carregar os clientes.");
          setLoading(false);
        },
      );
    } catch (e) {
      setErro(e?.message ?? "Não foi possível carregar os clientes.");
      setLoading(false);
    }
    return () => cancelar();
  }, [revendedoraId]);

  return { clientes, loading, erro };
}

export default useClients;