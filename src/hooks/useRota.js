import { useCallback, useEffect, useRef, useState } from "react";
import { escutarAlteracoes } from "../services/apiFetch";
import { buscarRota } from "../services/rotaService";
import { useAuth } from "./useAuth";

export function useRota(id) {
  const { revendedoraId, ehMotorista } = useAuth();
  const ativo = Boolean(revendedoraId) && ehMotorista && Boolean(id);
  const [rota, setRota] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    if (!ativo || !id) return;
    const minha = ++requisicao.current;
    setLoading(true);
    setErro(null);
    try {
      const dados = await buscarRota(revendedoraId, id);
      if (minha !== requisicao.current) return;
      setRota(dados ?? null);
    } catch (e) {
      if (minha !== requisicao.current) return;
      console.error("Falha ao carregar rota:", e);
      setErro(e);
    } finally {
      if (minha === requisicao.current) setLoading(false);
    }
  }, [ativo, revendedoraId, id]);

  useEffect(() => {
    requisicao.current++;

    if (!ativo) {
      setRota(null);
      setLoading(false);
      setErro(null);
      return;
    }

    carregar();
    const intervalo = setInterval(carregar, 60000);
    const pararAlteracoes = escutarAlteracoes("rotas", carregar);
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

  return { rota, loading, erro, recarregar: carregar, setRota };
}
