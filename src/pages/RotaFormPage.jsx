import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Route, Search, Store } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Carregando from "../components/common/Carregando";
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
      const codigo = normalizarTexto(c.codigo || c.idCliente || "");
      return nome.includes(termo) || comercio.includes(termo) || codigo.includes(termo);
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
      <div className="pagina rota-pagina">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
        <Carregando tela />
      </div>
    );
  }

  const totalClientes = clientes.length;

  return (
    <div className="pagina rota-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo rota-conteudo">
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="rota-rotulo">Rota do dia</span>
            <h1 className="rota-titulo">{editar ? "Editar rota" : "Nova rota"}</h1>
          </div>
          <span className="rota-pilula">
            {selecionados.size} de {totalClientes}
          </span>
        </header>

        <div className="rota-busca-wrap">
          <div className="rota-busca">
            <span className="rota-busca-icone">
              <Search size={16} />
            </span>
            <input
              className="rota-busca-input"
              placeholder="Buscar por nome, código ou loja"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {erro && <p className="estado-erro">{erro}</p>}

        <div className="rota-lista" style={{ marginTop: "1rem" }}>
          {filtrados.length === 0 && <div className="rota-card rota-card-vazio">Nenhum cliente encontrado.</div>}
          {filtrados.map((cliente) => {
            const cid = cliente.id || cliente.clienteId;
            const marcado = selecionados.has(cid);
            const uso = mapaUso.get(cid);
            const codigo = cliente.codigo || cliente.idCliente;
            const nome = cliente.nomeCliente || cliente.nome;
            const comercio = cliente.nomeComercio;
            return (
              <label key={cid} className={`rota-cliente ${marcado ? "rota-cliente--selecionado" : ""}`}>
                <input className="rota-checkbox" type="checkbox" checked={marcado} onChange={() => alternar(cid)} />
                <div className="rota-check">{marcado && <Check size={14} />}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
                  {codigo && <span style={{ fontFamily: "var(--fonte-mono)", fontSize: "0.7rem", color: "var(--r-muted-texto)" }}>{codigo}</span>}
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{nome}</div>
                  {comercio && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--r-muted-texto)" }}>
                      <Store size={12} />
                      <span>{comercio}</span>
                    </div>
                  )}
                  {uso && (
                    <div style={{ fontSize: "0.75rem", color: "var(--r-aviso-texto)" }}>
                      Na {uso.numero}ª rota de {uso.motoristaNome} hoje
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </main>

      <div className="rota-barra-fixa">
        <div className="rota-barra-fixa-inner">
          <div style={{ fontWeight: 600 }}>
            {selecionados.size} cliente(s) selecionado(s)
          </div>
          <button type="button" className="rota-botao rota-botao--primario" onClick={salvar} disabled={selecionados.size === 0 || salvando}>
            <Route size={16} />
            {salvando ? "Salvando..." : "Salvar rota"}
          </button>
        </div>
      </div>
    </div>
  );
}
