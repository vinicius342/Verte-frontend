import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  MapPin,
  Navigation,
  Pencil,
  Route,
  Store,
  Trash2,
  X,
} from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Carregando from "../components/common/Carregando";
import BotaoVoltar from "../components/rota/BotaoVoltar";
import { useRota } from "../hooks/useRota";
import { atualizarStatusParada, atualizarRota, finalizarRota, excluirRota } from "../services/rotaService";
import { useAuth } from "../hooks/useAuth";
import { abrirMapa } from "../utils/mapLinks";

function formatarData(data) {
  if (!data) return "";
  try {
    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function obterProgresso(rota) {
  const total = rota?.totalParadas ?? rota?.paradas?.length ?? 0;
  const entregues = rota?.entregues ?? rota?.contadores?.entregues ?? 0;
  const naoEntregues = rota?.naoEntregues ?? rota?.contadores?.naoEntregues ?? 0;
  return { total, entregues, naoEntregues };
}

export default function RotaDetalhePage() {
  const { id } = useParams();
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { revendedoraId } = useAuth();
  const { rota, loading, erro, setRota } = useRota(id);
  const [reordenando, setReordenando] = useState(false);
  const [ordem, setOrdem] = useState([]);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [alterando, setAlterando] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (rota?.paradas) {
      setOrdem(rota.paradas.map((p) => p.clienteId).filter(Boolean));
    }
  }, [rota]);

  const finalizada = rota?.status === "finalizada";
  const { total, entregues, naoEntregues } = obterProgresso(rota);
  const concluidas = Math.min(total, entregues + naoEntregues);
  const progresso = total > 0 ? (concluidas / total) * 100 : 0;

  const paradasOrdenadas = useMemo(() => {
    if (!rota?.paradas) return [];
    const mapa = new Map(rota.paradas.map((p) => [p.clienteId, p]));
    const lista = [];
    ordem.forEach((cid) => {
      if (mapa.has(cid)) lista.push(mapa.get(cid));
    });
    rota.paradas.forEach((p) => {
      if (p.clienteId && !ordem.includes(p.clienteId)) lista.push(p);
    });
    return lista;
  }, [rota, ordem]);

  async function mudarStatus(parada, status) {
    if (finalizada) return;
    if (!revendedoraId || !parada?.clienteId) return;
    const statusAnterior = parada.status;
    setAlterando(parada.clienteId);
    setErroAcao(null);
    setRota((atual) => {
      if (!atual?.paradas) return atual;
      return {
        ...atual,
        paradas: atual.paradas.map((p) => (p.clienteId === parada.clienteId ? { ...p, status } : p)),
      };
    });
    try {
      await atualizarStatusParada(revendedoraId, id, parada.clienteId, status);
    } catch (e) {
      console.error(e);
      setRota((atual) => {
        if (!atual?.paradas) return atual;
        return {
          ...atual,
          paradas: atual.paradas.map((p) => (p.clienteId === parada.clienteId ? { ...p, status: statusAnterior } : p)),
        };
      });
      setErroAcao("Não foi possível alterar o status da parada.");
    } finally {
      setAlterando(null);
    }
  }

  function mover(indice, direcao) {
    setOrdem((atual) => {
      const novo = [...atual];
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= novo.length) return atual;
      const temp = novo[indice];
      novo[indice] = novo[alvo];
      novo[alvo] = temp;
      return novo;
    });
  }

  async function salvarOrdem() {
    if (salvandoOrdem || !revendedoraId) return;
    setSalvandoOrdem(true);
    setErroAcao(null);
    try {
      await atualizarRota(revendedoraId, id, ordem.filter(Boolean));
      setReordenando(false);
    } catch (e) {
      console.error(e);
      setErroAcao("Não foi possível salvar a ordem.");
    } finally {
      setSalvandoOrdem(false);
    }
  }

  async function acaoFinalizar() {
    if (finalizada) return;
    if (!window.confirm("Finalizar esta rota? As entregas pendentes continuarão como pendentes.")) return;
    try {
      await finalizarRota(revendedoraId, id);
      navigate(0);
    } catch (e) {
      console.error(e);
      setErroAcao("Não foi possível finalizar a rota.");
    }
  }

  async function acaoExcluir() {
    if (!window.confirm("Excluir esta rota?")) return;
    try {
      await excluirRota(revendedoraId, id);
      navigate("/rota-do-dia");
    } catch (e) {
      console.error(e);
      setErroAcao("Não foi possível excluir a rota.");
    }
  }

  if (loading && !rota) {
    return (
      <div className="pagina rota-pagina">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
        <Carregando tela />
      </div>
    );
  }

  if (erro) {
    const status = erro?.status || erro?.response?.status;
    return (
      <div className="pagina rota-pagina">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
        <main className="conteudo rota-conteudo">
          <BotaoVoltar para="/rota-do-dia" />
          <p className="estado-erro">{status === 403 || status === 404 ? "Não foi possível acessar esta rota." : "Erro ao carregar rota."}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="pagina rota-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo rota-conteudo">
        <BotaoVoltar para="/rota-do-dia" />
        <div className="rota-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="rota-rotulo">
              {rota?.numero}ª rota do dia · {formatarData(rota?.data)}
            </span>
            <h1 className="rota-titulo">
              {entregues} de {total} entregues
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className={`rota-selo ${finalizada ? "rota-selo--finalizada" : "rota-selo--andamento"}`}>
              <span className="rota-selo-ponto" />
              {finalizada ? "Finalizada" : "Em andamento"}
            </span>
          </div>
          <div className="rota-barra">
            <div className="rota-barra-preenchida" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        {finalizada && (
          <p style={{ marginTop: "0.9rem", color: "var(--r-muted-texto)" }}>
            {rota?.finalizadaAutomaticamente ? "Rota finalizada automaticamente (mais de 7 dias em andamento)" : "Rota finalizada"}
          </p>
        )}
        {erroAcao && <p className="estado-erro" style={{ marginTop: "0.9rem" }}>{erroAcao}</p>}

        {!finalizada && !reordenando && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.9rem" }}>
            <button type="button" className="rota-botao" onClick={() => setReordenando(true)}>
              <ArrowUpDown size={16} />
              Reordenar
            </button>
            <button type="button" className="rota-botao" onClick={() => navigate(`/rota-do-dia/${id}/editar`)}>
              <Pencil size={16} />
              Editar clientes
            </button>
            <button type="button" className="rota-botao rota-botao--primario" onClick={acaoFinalizar}>
              <Check size={16} />
              Finalizar
            </button>
          </div>
        )}

        {reordenando && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.9rem" }}>
            <button type="button" className="rota-botao" onClick={() => setReordenando(false)}>
              Cancelar
            </button>
            <button type="button" className="rota-botao rota-botao--primario" onClick={salvarOrdem} disabled={salvandoOrdem}>
              <Route size={16} />
              {salvandoOrdem ? "Salvando..." : "Salvar ordem"}
            </button>
          </div>
        )}

        <ol className="rota-lista" style={{ marginTop: "1.25rem", padding: 0, listStyle: "none", gap: "0.9rem" }}>
          {paradasOrdenadas.map((parada, indice) => {
            const cliente = parada.cliente;
            const temCliente = Boolean(cliente);
            const status = parada.status || "pendente";
            const numeroClasse =
              status === "entregue"
                ? "rota-parada-numero rota-parada-numero--entregue"
                : status === "nao_entregue"
                  ? "rota-parada-numero rota-parada-numero--nao_entregue"
                  : "rota-parada-numero rota-parada-numero--pendente";
            return (
              <li key={parada.clienteId || indice}>
                <div className="rota-card rota-parada-card">
                  <div className="rota-parada-topo">
                    <div className={numeroClasse}>
                      {status === "entregue" ? <Check size={16} /> : status === "nao_entregue" ? <X size={16} /> : indice + 1}
                    </div>
                    <div className="rota-parada-topo-info">
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {temCliente && cliente?.codigo && <span className="rota-parada-codigo">{cliente.codigo}</span>}
                          <div className="rota-parada-nome">{temCliente ? cliente.nomeCliente || cliente.nome : "Cliente removido"}</div>
                          {temCliente && cliente.nomeComercio && (
                            <div className="rota-parada-linha">
                              <span className="rota-parada-icone">
                                <Store size={14} />
                              </span>
                              <span>{cliente.nomeComercio}</span>
                            </div>
                          )}
                          {temCliente && (
                            <div className="rota-parada-linha rota-parada-linha--endereco">
                              <span className="rota-parada-icone">
                                <MapPin size={14} />
                              </span>
                              <span>
                                {(cliente.rua || "")}
                                {cliente.numero ? `, ${cliente.numero}` : ""}
                                {cliente.complemento ? ` — ${cliente.complemento}` : ""}
                              </span>
                            </div>
                          )}
                          {!temCliente && <div style={{ fontStyle: "italic", color: "var(--r-muted-texto)", fontSize: "0.9rem", marginTop: "0.25rem" }}>Cliente removido</div>}
                        </div>
                        {reordenando ? (
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button type="button" className="rota-botao" style={{ height: "2.25rem", padding: "0 0.5rem" }} onClick={() => mover(indice, -1)} disabled={indice === 0} aria-label="Subir">
                              <ArrowUp size={16} />
                            </button>
                            <button type="button" className="rota-botao" style={{ height: "2.25rem", padding: "0 0.5rem" }} onClick={() => mover(indice, 1)} disabled={indice === paradasOrdenadas.length - 1} aria-label="Descer">
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`rota-selo ${
                              status === "entregue"
                                ? "rota-selo--entregue"
                                : status === "nao_entregue"
                                  ? "rota-selo--nao_entregue"
                                  : "rota-selo--pendente"
                            }`}
                            style={{ display: "none" }}
                          >
                            <span className="rota-selo-ponto" />
                            {status === "entregue" ? "Entregue" : status === "nao_entregue" ? "Não entregue" : "Pendente"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!reordenando && (
                    <>
                      <div className="rota-parada-divisor" />
                      {!finalizada && temCliente && (
                        <div className="rota-segmentos">
                          <button
                            type="button"
                            className={`rota-segmento ${status === "pendente" ? "rota-segmento--ativo" : ""}`}
                            onClick={() => mudarStatus(parada, "pendente")}
                            disabled={alterando === parada.clienteId}
                          >
                            Pendente
                          </button>
                          <button
                            type="button"
                            className={`rota-segmento ${status === "entregue" ? "rota-segmento--ativo" : ""}`}
                            onClick={() => mudarStatus(parada, "entregue")}
                            disabled={alterando === parada.clienteId}
                          >
                            Entregue
                          </button>
                          <button
                            type="button"
                            className={`rota-segmento ${status === "nao_entregue" ? "rota-segmento--ativo" : ""}`}
                            onClick={() => mudarStatus(parada, "nao_entregue")}
                            disabled={alterando === parada.clienteId}
                          >
                            Não entregue
                          </button>
                        </div>
                      )}
                      {temCliente && (
                        <button type="button" className="rota-botao-mapa" style={{ marginTop: "0.75rem" }} onClick={() => abrirMapa(cliente)}>
                          <Navigation size={16} />
                          Abrir no mapa
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
          <button type="button" className="rota-botao rota-botao--perigo" onClick={acaoExcluir}>
            <Trash2 size={16} />
            Excluir rota
          </button>
        </div>
      </main>
    </div>
  );
}
