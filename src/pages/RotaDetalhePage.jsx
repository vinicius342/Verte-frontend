import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import BotaoVoltar from "../components/rota/BotaoVoltar";
import { useRota } from "../hooks/useRota";
import { atualizarStatusParada, atualizarRota, finalizarRota, excluirRota } from "../services/rotaService";
import { useAuth } from "../hooks/useAuth";
import { abrirMapa } from "../utils/mapLinks";
import {
  formatarDistancia,
  haversineMetros,
  obterPonto,
  obterPosicao,
} from "../utils/distancia";
import { montarTrechos } from "../utils/googleMaps";

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

function textoOrganizacao(aviso) {
  if (!aviso) return "";
  if (aviso.organizacao === "proximidade") {
    const base = "Clientes organizados por proximidade, do mais perto de você ao mais distante.";
    if (aviso.semLocalizacao > 0) {
      return `${base} ${aviso.semLocalizacao} cliente(s) sem localização ficaram no fim da lista.`;
    }
    return base;
  }
  return "Não foi possível obter sua localização. A rota foi salva na ordem em que você selecionou os clientes.";
}

export default function RotaDetalhePage() {
  const { id } = useParams();
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { revendedoraId } = useAuth();
  const { rota, loading, erro, setRota } = useRota(id);
  const [reordenando, setReordenando] = useState(false);
  const [ordem, setOrdem] = useState([]);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [alterando, setAlterando] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);
  const [avisoOrganizacao, setAvisoOrganizacao] = useState(null);
  const [posicao, setPosicao] = useState(null);
  const [modalTrechosAberto, setModalTrechosAberto] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const estado = location.state;
    if (!estado?.organizacao) return;
    setAvisoOrganizacao({
      organizacao: estado.organizacao,
      semLocalizacao: estado.semLocalizacao ?? 0,
      estimados: estado.estimados ?? 0,
    });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    let ativo = true;
    obterPosicao().then((resultado) => {
      if (ativo) setPosicao(resultado);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  async function atualizarDistancias() {
    const resultado = await obterPosicao();
    setPosicao(resultado);
  }

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

  const paradasPendentes = paradasOrdenadas.filter((parada) => (parada.status || "pendente") === "pendente");
  const { trechos: trechosGoogleMaps, semLocal: paradasSemLocal } = montarTrechos(paradasPendentes);
  const totalAproximadas = trechosGoogleMaps.reduce((total, trecho) => total + trecho.aproximadas, 0);

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
            <button
              type="button"
              className="rota-botao"
              style={{ height: "2.25rem", padding: "0 0.75rem", fontSize: "0.8rem" }}
              onClick={atualizarDistancias}
            >
              <Navigation size={14} />
              Atualizar distâncias
            </button>
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
            {trechosGoogleMaps.length === 1 ? (
              <a
                className="rota-botao rota-botao--primario"
                href={trechosGoogleMaps[0].url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Navigation size={16} />
                Abrir rota no Google Maps
              </a>
            ) : trechosGoogleMaps.length > 1 ? (
              <button
                type="button"
                className="rota-botao rota-botao--primario"
                onClick={() => setModalTrechosAberto(true)}
              >
                <Navigation size={16} />
                Abrir rota no Google Maps
              </button>
            ) : null}
            {trechosGoogleMaps.length > 0 && totalAproximadas > 0 ? (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--r-aviso-texto)" }}>
                {totalAproximadas} parada(s) usam localização aproximada e podem aparecer no lugar errado no mapa.
              </p>
            ) : null}
            {trechosGoogleMaps.length > 0 && paradasSemLocal > 0 ? (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--r-aviso-texto)" }}>
                {paradasSemLocal} parada(s) sem localização ficaram de fora.
              </p>
            ) : null}
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
            const ponto = obterPonto(cliente);
            const distancia =
              posicao && status === "pendente" && ponto
                ? haversineMetros(posicao, ponto)
                : null;
            const distanciaAproximada = ponto?.estimada === true;
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
                          {distancia != null && (
                            <div className="rota-parada-linha" style={{ color: "var(--r-muted-texto)", fontSize: "0.8rem" }}>
                              <span className="rota-parada-icone">
                                <Navigation style={{ width: "0.8rem", height: "0.8rem" }} />
                              </span>
                              <span>
                                {formatarDistancia(distancia)}
                                {distanciaAproximada ? " (aprox.)" : ""}
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

      <Modal
        aberto={modalTrechosAberto}
        titulo="Abrir rota no Google Maps"
        onFechar={() => setModalTrechosAberto(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0 }}>
            O Google Maps aceita no máximo 10 paradas por vez. Abra os trechos em ordem.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {trechosGoogleMaps.map((trecho, indice) => (
              <div
                key={`${trecho.inicio}-${trecho.fim}-${indice}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}
              >
                <span>
                  Paradas {trecho.inicio} a {trecho.fim}
                </span>
                <a
                  className="rota-botao"
                  href={trecho.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", height: "2.25rem", padding: "0 0.75rem", fontSize: "0.8rem" }}
                >
                  Abrir
                </a>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        aberto={Boolean(avisoOrganizacao)}
        titulo="Rota organizada"
        onFechar={() => setAvisoOrganizacao(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <p style={{ margin: 0 }}>{textoOrganizacao(avisoOrganizacao)}</p>
          {avisoOrganizacao?.organizacao === "proximidade" && avisoOrganizacao?.estimados > 0 && (
            <p style={{ margin: 0 }}>
              Alguns clientes usam localização aproximada (endereço, bairro ou CEP) e a ordem entre eles pode variar.
              Capturar o GPS do cliente melhora a precisão.
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={() => setAvisoOrganizacao(null)}>Entendi</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
