import { useCallback, useEffect, useRef, useState } from "react";
import { escutarAlteracoes } from "../services/apiFetch";
import { listarRotas } from "../services/rotaService";
import { useAuth } from "./useAuth";

export function useRotas() {
  const { revendedoraId, ehMotorista } = useAuth();
  const ativo = Boolean(revendedoraId) && ehMotorista;
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    if (!ativo) return;
    const minha = ++requisicao.current;
    setLoading(true);
    setErro(null);
    try {
      const dados = await listarRotas(revendedoraId);
      if (minha !== requisicao.current) return;
      setItens(dados?.itens ?? []);
    } catch (e) {
      if (minha !== requisicao.current) return;
      console.error("Falha ao carregar rotas:", e);
      setErro(e);
    } finally {
      if (minha === requisicao.current) setLoading(false);
    }
  }, [ativo, revendedoraId]);

  useEffect(() => {
    requisicao.current++;

    if (!ativo) {
      setItens([]);
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

  return { itens, loading, erro, recarregar: carregar };
}
