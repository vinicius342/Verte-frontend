import { useCallback, useEffect, useRef, useState } from "react";
import { listarClientesPublicos } from "../services/clientService";

// Página pública do vendedor: busca ao abrir e quando a aba volta a ficar
// visível. Não usa cache local nem exige usuário logado.
export function useClientesPublicos(slug) {
  const [clientes, setClientes] = useState([]);
  const [vendedor, setVendedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    if (!slug) return;
    const minha = ++requisicao.current;

    try {
      const dados = await listarClientesPublicos(slug);
      if (minha !== requisicao.current) return;
      setVendedor(dados?.vendedor ?? null);
      setClientes(dados?.clientes ?? []);
      setErro(null);
      setNaoEncontrado(false);
    } catch (e) {
      if (minha !== requisicao.current) return;
      if (e?.status === 404) {
        setVendedor(null);
        setClientes([]);
        setErro(null);
        setNaoEncontrado(true);
      } else {
        setErro(e?.message ?? "Não foi possível carregar os clientes.");
      }
    } finally {
      if (minha === requisicao.current) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    requisicao.current++;
    setClientes([]);
    setVendedor(null);
    setErro(null);
    setNaoEncontrado(false);
    setLoading(true);

    carregar();

    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [slug, carregar]);

  return { clientes, vendedor, loading, erro, naoEncontrado };
}

export default useClientesPublicos;
