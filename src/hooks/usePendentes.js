import { useCallback, useEffect, useRef, useState } from "react";
import { escutarAlteracoes } from "../services/apiFetch";
import { listarPendentes, marcarComodatoVisto } from "../services/comodatoService";
import { useAuth } from "./useAuth";

export function usePendentes() {
  const { revendedoraId, papel } = useAuth();
  const ativo = Boolean(revendedoraId) && (papel === "supervisor" || papel === "gerente" || papel === "vendedor");
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    if (!ativo) return;
    const minha = ++requisicao.current;
    setLoading(true);
    try {
      const dados = await listarPendentes(revendedoraId);
      if (minha !== requisicao.current) return;
      setItens(dados?.itens ?? []);
      setTotal(dados?.total ?? 0);
    } catch (e) {
      console.error("Falha ao carregar pendências:", e);
    } finally {
      if (minha === requisicao.current) setLoading(false);
    }
  }, [ativo, revendedoraId]);

  useEffect(() => {
    requisicao.current++;

    if (!ativo) {
      setItens([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    carregar();
    const intervalo = setInterval(carregar, 60000);
    const pararAlteracoes = escutarAlteracoes("comodatos", carregar);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };

    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(intervalo);
      pararAlteracoes();
      document.removeEventListener("visibilitychange", aoVoltar);
      requisicao.current++;
    };
  }, [ativo, carregar]);

  const marcarVisto = useCallback(
    async (id) => {
      if (!revendedoraId || !id) return;

      setItens((atuais) => atuais.filter((item) => item.id !== id));
      setTotal((atual) => Math.max(0, atual - 1));

      try {
        await marcarComodatoVisto(revendedoraId, id);
      } catch (e) {
        console.error("Falha ao marcar comodato como visto:", e);
        carregar();
      }
    },
    [revendedoraId, carregar],
  );

  return { itens, total, loading, recarregar: carregar, marcarVisto };
}
