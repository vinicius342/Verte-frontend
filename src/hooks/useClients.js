import { useEffect, useState } from "react";
import { observarClientes } from "../services/clientService";
import { isFirebaseConfigured } from "../firebase/config";

const CACHE_KEY = "rota-certa:clientes";

function lerCache() {
  try {
    const bruto = localStorage.getItem(CACHE_KEY);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

// Encapsula a escuta em tempo real dos clientes + loading/erro,
// com cache local para abrir rápido mesmo com conexão instável.
export function useClients() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const cache = lerCache();
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
        (lista) => {
          setClientes(lista);
          setErro(null);
          setLoading(false);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(lista));
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
  }, []);

  return { clientes, loading, erro };
}

export default useClients;
