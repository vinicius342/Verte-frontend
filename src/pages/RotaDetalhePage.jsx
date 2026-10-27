import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Carregando from "../components/common/Carregando";
import { Button } from "../components/ui/button";
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
  return { total, entregues };
}

function obterCorStatus(status) {
  if (status === "entregue") return "selo-confirmacao--confirmado";
  if (status === "nao_entregue") return "selo-confirmacao--rejeitado";
  return "selo-confirmacao--pendente";
}

function obterTextoStatus(status) {
  if (status === "entregue") return "Entregue";
  if (status === "nao_entregue") return "Não entregue";
  return "Pendente";
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
  const { total, entregues } = obterProgresso(rota);

  const paradasOrdenadas = useMemo(() => {
    if (!rota?.paradas) return [];
    const mapa = new Map(rota.paradas.map((p) => [p.clienteId, p]));
    const lista = [];
    ordem.forEach((cid) => {
      if (mapa.has(cid)) lista.push(mapa.get(cid));
    });
    // Adiciona paradas que por algum motivo não estejam na ordem
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
      <div className="pagina">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
        <Carregando tela />
      </div>
    );
  }

  if (erro) {
    const status = erro?.status || erro?.response?.status;
    return (
      <div className="pagina">
        <Header onAbrirMenu={() => setMenuAberto(true)} />
        <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
        <main className="conteudo">
          <p className="estado-erro">{status === 403 || status === 404 ? "Não foi possível acessar esta rota." : "Erro ao carregar rota."}</p>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/rota-do-dia")}>
            Voltar
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <header className="conteudo-topo" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
          <h1 className="titulo-secao">
            {rota?.numero}ª rota do dia · {formatarData(rota?.data)}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className={`selo-confirmacao ${finalizada ? "selo-confirmacao--confirmado" : "selo-confirmacao--pendente"}`}>
              {finalizada ? "Finalizada" : "Em andamento"}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--texto-2)" }}>
              {entregues} de {total} entregues
            </span>
          </div>
          <div className="rota-progresso" style={{ width: "100%" }}>
            <div
              className="rota-progresso-barra"
              style={{ width: total > 0 ? `${Math.min(100, (entregues / total) * 100)}%` : "0%" }}
            />
          </div>
        </header>

        {finalizada && <p className="estado-vazio">Rota finalizada</p>}
        {erroAcao && <p className="estado-erro">{erroAcao}</p>}

        {!finalizada && !reordenando && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Button variant="ghost" onClick={() => setReordenando(true)}>
              Reordenar
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/rota-do-dia/${id}/editar`)}>
              Editar clientes
            </Button>
            <Button variant="ghost" onClick={acaoFinalizar}>
              Finalizar rota
            </Button>
          </div>
        )}

        {reordenando && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Button variant="ghost" onClick={() => setReordenando(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarOrdem} disabled={salvandoOrdem}>
              {salvandoOrdem ? "Salvando..." : "Salvar ordem"}
            </Button>
          </div>
        )}

        <div>
          {paradasOrdenadas.map((parada, indice) => {
            const cliente = parada.cliente;
            const temCliente = Boolean(cliente);
            return (
              <div key={parada.clienteId || indice} className="rota-parada">
                {reordenando ? (
                  <div className="rota-reordenar-setas">
                    <button
                      type="button"
                      className="rota-reordenar-botao"
                      onClick={() => mover(indice, -1)}
                      disabled={indice === 0}
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rota-reordenar-botao"
                      onClick={() => mover(indice, 1)}
                      disabled={indice === paradasOrdenadas.length - 1}
                      aria-label="Descer"
                    >
                      ↓
                    </button>
                  </div>
                ) : (
                  <div className="rota-parada-numero">{indice + 1}</div>
                )}
                <div className="rota-parada-conteudo">
                  <div>
                    <div style={{ fontWeight: 700 }}>{temCliente ? cliente.nomeCliente || cliente.nome : "Cliente removido"}</div>
                    {temCliente && cliente.nomeComercio && (
                      <div style={{ fontSize: "0.9rem", color: "var(--texto-2)" }}>{cliente.nomeComercio}</div>
                    )}
                    {temCliente && (
                      <div style={{ fontSize: "0.85rem", color: "var(--texto-3)" }}>
                        {(cliente.rua || "")}
                        {cliente.numero ? `, ${cliente.numero}` : ""}
                        {cliente.complemento ? ` — ${cliente.complemento}` : ""}
                      </div>
                    )}
                  </div>
                  {!reordenando && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span className={`selo-confirmacao ${obterCorStatus(parada.status)}`}>{obterTextoStatus(parada.status)}</span>
                        {temCliente && (
                          <Button variant="ghost" onClick={() => abrirMapa(cliente)}>
                            Abrir no mapa
                          </Button>
                        )}
                      </div>
                      {!finalizada && temCliente && (
                        <div className="rota-parada-botoes">
                          <button
                            type="button"
                            className={`rota-botao-baixa ${parada.status === "entregue" ? "rota-botao-baixa--ativo" : ""}`}
                            onClick={() => mudarStatus(parada, "entregue")}
                            disabled={alterando === parada.clienteId}
                          >
                            Entregue
                          </button>
                          <button
                            type="button"
                            className={`rota-botao-baixa ${parada.status === "nao_entregue" ? "rota-botao-baixa--ativo" : ""}`}
                            onClick={() => mudarStatus(parada, "nao_entregue")}
                            disabled={alterando === parada.clienteId}
                          >
                            Não entregue
                          </button>
                          <button
                            type="button"
                            className={`rota-botao-baixa ${parada.status === "pendente" ? "rota-botao-baixa--ativo" : ""}`}
                            onClick={() => mudarStatus(parada, "pendente")}
                            disabled={alterando === parada.clienteId}
                          >
                            Pendente
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <Button variant="danger" onClick={acaoExcluir}>
            Excluir rota
          </Button>
        </div>
      </main>
    </div>
  );
}
