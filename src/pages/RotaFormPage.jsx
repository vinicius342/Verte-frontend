import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Carregando from "../components/common/Carregando";
import { Button } from "../components/ui/button";
import { listarClientes } from "../services/clientService";
import { criarRota, atualizarRota, listarClientesEmUso } from "../services/rotaService";
import { useAuth } from "../hooks/useAuth";
import { useRota } from "../hooks/useRota";

function normalizarTexto(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function RotaFormPage() {
  const { id } = useParams();
  const editar = Boolean(id);
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { revendedoraId } = useAuth();
  const { rota, loading: loadingRota } = useRota(id);

  const [clientes, setClientes] = useState([]);
  const [emUso, setEmUso] = useState([]);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState(new Set());
  const [ordem, setOrdem] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    async function carregar() {
      if (!revendedoraId) return;
      setCarregando(true);
      try {
        const [listaClientes, listaUso] = await Promise.all([listarClientes(revendedoraId), listarClientesEmUso(revendedoraId)]);
        setClientes(listaClientes?.itens ?? listaClientes ?? []);
        setEmUso(listaUso?.itens ?? []);
      } catch (e) {
        console.error(e);
        setErro("Não foi possível carregar os clientes.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [revendedoraId]);

  useEffect(() => {
    if (editar && rota) {
      if (rota.status === "finalizada") {
        navigate(`/rota-do-dia/${id}`, { replace: true });
        return;
      }
      const paradas = rota.paradas || [];
      const ids = paradas.map((p) => p.clienteId).filter(Boolean);
      setOrdem(ids);
      setSelecionados(new Set(ids));
    }
  }, [editar, rota, id, navigate]);

  const mapaUso = useMemo(() => {
    const mapa = new Map();
    (emUso || []).forEach((item) => {
      if (item.clienteId) mapa.set(item.clienteId, item);
    });
    return mapa;
  }, [emUso]);

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca);
    if (!termo) return clientes;
    return (clientes || []).filter((c) => {
      const nome = normalizarTexto(c.nomeCliente || c.nome || "");
      const comercio = normalizarTexto(c.nomeComercio || "");
      return nome.includes(termo) || comercio.includes(termo);
    });
  }, [clientes, busca]);

  function alternar(clienteId) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(clienteId)) {
        novo.delete(clienteId);
        setOrdem((o) => o.filter((x) => x !== clienteId));
      } else {
        novo.add(clienteId);
        setOrdem((o) => (o.includes(clienteId) ? o : [...o, clienteId]));
      }
      return novo;
    });
  }

  async function salvar() {
    if (salvando) return;
    const clienteIds = ordem.filter((cid) => selecionados.has(cid));
    if (clienteIds.length === 0) return;
    setSalvando(true);
    setErro(null);
    try {
      if (editar) {
        await atualizarRota(revendedoraId, id, clienteIds);
        navigate(`/rota-do-dia/${id}`, { replace: true });
      } else {
        const resp = await criarRota(revendedoraId, clienteIds);
        const novoId = resp?.id || resp?.rotaId;
        navigate(`/rota-do-dia/${novoId}`, { replace: true });
      }
    } catch (e) {
      console.error(e);
      setErro("Não foi possível salvar a rota.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || (editar && loadingRota && !rota)) {
    return (
      <div className="pagina">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
        <Carregando tela />
      </div>
    );
  }

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <header className="conteudo-topo">
          <h1 className="titulo-secao">{editar ? "Editar rota" : "Nova rota"}</h1>
          <span className="contador">{selecionados.size} selecionados</span>
        </header>

        <div className="busca" style={{ marginBottom: "1rem" }}>
          <span className="busca-icone" aria-hidden>🔍</span>
          <input
            className="busca-campo"
            placeholder="Buscar cliente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {erro && <p className="estado-erro">{erro}</p>}

        <div>
          {filtrados.map((cliente) => {
            const cid = cliente.id || cliente.clienteId;
            const marcado = selecionados.has(cid);
            const uso = mapaUso.get(cid);
            return (
              <label key={cid} className="rota-cartao" style={{ cursor: "pointer", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <input type="checkbox" checked={marcado} onChange={() => alternar(cid)} style={{ marginTop: "0.2rem" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div style={{ fontWeight: 600 }}>{cliente.nomeCliente || cliente.nome}</div>
                    {cliente.nomeComercio && <div style={{ fontSize: "0.85rem", color: "var(--texto-2)" }}>{cliente.nomeComercio}</div>}
                    {uso && (
                      <div style={{ fontSize: "0.8rem", color: "var(--texto-3)" }}>
                        Na {uso.numero}ª rota de {uso.motoristaNome} hoje
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </main>

      <Button className="botao-adicionar-fixo" onClick={salvar} disabled={selecionados.size === 0 || salvando}>
        {salvando ? "Salvando..." : "Salvar rota"}
      </Button>
    </div>
  );
}
