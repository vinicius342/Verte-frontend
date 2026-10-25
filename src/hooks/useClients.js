import { useCallback, useEffect, useState } from "react";
import { listarClientes } from "../services/clientService";
import { escutarAlteracoes } from "../services/apiFetch";
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

// Sem tempo real: busca ao abrir, depois de qualquer alteração feita aqui
// e sempre que a aba volta a ficar visível (pega o que outros usuários mudaram).
export function useClients() {
  const { revendedoraId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!revendedoraId) return;
    try {
      const lista = await listarClientes(revendedoraId);
      setClientes(lista);
      setErro(null);
      try {
        localStorage.setItem(chaveCache(revendedoraId), JSON.stringify(lista));
      } catch {
        /* cache é opcional */
      }
    } catch (e) {
      setErro(e?.message ?? "Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, [revendedoraId]);

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

    carregar();
    const pararAlteracoes = escutarAlteracoes("clientes", carregar);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      pararAlteracoes();
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [revendedoraId, carregar]);

  return { clientes, loading, erro, recarregar: carregar };
}

export default useClients;
