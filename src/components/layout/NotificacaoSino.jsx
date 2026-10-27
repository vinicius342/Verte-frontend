import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carregando from "../common/Carregando";
import { usePendentes } from "../../hooks/usePendentes";
import { useAuth } from "../../hooks/useAuth";

const formatadorRelativo = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function tempoRelativo(valor) {
  if (!valor) return "";
  const data =
    typeof valor?.toDate === "function"
      ? valor.toDate()
      : valor instanceof Date
        ? valor
        : new Date(valor);
  if (Number.isNaN(data?.getTime?.())) return "";

  const segundos = Math.round((data.getTime() - Date.now()) / 1000);
  const absoluto = Math.abs(segundos);

  if (absoluto < 60) return formatadorRelativo.format(segundos, "second");
  if (absoluto < 3600) return formatadorRelativo.format(Math.round(segundos / 60), "minute");
  if (absoluto < 86400) return formatadorRelativo.format(Math.round(segundos / 3600), "hour");
  if (absoluto < 2592000) return formatadorRelativo.format(Math.round(segundos / 86400), "day");
  if (absoluto < 31536000)
    return formatadorRelativo.format(Math.round(segundos / 2592000), "month");
  return formatadorRelativo.format(Math.round(segundos / 31536000), "year");
}

function obterTextoRejeitado(rejeitadoPor) {
  if (rejeitadoPor === "ambos") return "Rejeitado pelo supervisor e pelo gerente";
  if (rejeitadoPor === "gerente") return "Rejeitado pelo gerente";
  if (rejeitadoPor === "supervisor") return "Rejeitado pelo supervisor";
  return "Rejeitado pelo supervisor e pelo gerente";
}

export default function NotificacaoSino() {
  const { itens, total, loading, recarregar, marcarVisto } = usePendentes();
  const { papel } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const sinoRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(e) {
      if (
        sinoRef.current &&
        !sinoRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setAberto(false);
      }
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setAberto(false);
    }

    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function alternar() {
    if (!aberto) recarregar();
    setAberto((atual) => !atual);
  }

  function abrirComodato(item) {
    marcarVisto(item.id);
    setAberto(false);
    navigate("/comodato", { state: { abrirComodatoId: item.id } });
  }

  function verMinhasPendencias() {
    setAberto(false);
    if (papel === "vendedor") {
      navigate("/comodato");
      return;
    }
    navigate("/comodato", { state: { filtro: "minha-vez" } });
  }

  return (
    <>
      <button
        ref={sinoRef}
        type="button"
        className="cabecalho-sino"
        aria-label="Notificações"
        aria-expanded={aberto}
        aria-controls="notificacoes-menu"
        onClick={alternar}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {total > 0 && <span className="cabecalho-sino-selo">{total > 9 ? "9+" : total}</span>}
      </button>

      {aberto && (
        <div id="notificacoes-menu" ref={menuRef} className="notificacoes-menu">
          <div className="notificacoes-topo">Notificações</div>

          {loading && itens.length === 0 ? (
            <Carregando escala={0.5} />
          ) : (
            <div>
              {itens.length === 0 && total === 0 && (
                <p className="notificacoes-vazio">Nenhuma notificação nova.</p>
              )}
              {itens.map((item) => {
                const tipo = item.tipo || "responder";
                if (tipo === "confirmado") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="notificacao-item"
                      onClick={() => abrirComodato(item)}
                    >
                      <span className="notificacao-item-titulo" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span
                          style={{
                            width: "0.5rem",
                            height: "0.5rem",
                            borderRadius: "50%",
                            background: "var(--cabecalho-pino)",
                            flex: "0 0 auto",
                          }}
                          aria-hidden="true"
                        />
                        Comodato confirmado
                      </span>
                      <span className="notificacao-item-linha">Aprovado pelo supervisor e pelo gerente</span>
                      <span className="notificacao-item-linha-suave">
                        {item.notificadoEm
                          ? `${item.razaoSocial || "Sem razão social"} · ${tempoRelativo(item.notificadoEm)}`
                          : item.razaoSocial || "Sem razão social"}
                      </span>
                    </button>
                  );
                }
                if (tipo === "rejeitado") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="notificacao-item"
                      onClick={() => abrirComodato(item)}
                    >
                      <span className="notificacao-item-titulo" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span
                          style={{
                            width: "0.5rem",
                            height: "0.5rem",
                            borderRadius: "50%",
                            background: "var(--perigo)",
                            flex: "0 0 auto",
                          }}
                          aria-hidden="true"
                        />
                        Comodato rejeitado
                      </span>
                      <span className="notificacao-item-linha">{obterTextoRejeitado(item.rejeitadoPor)}</span>
                      <span className="notificacao-item-linha-suave">
                        {item.notificadoEm
                          ? `${item.razaoSocial || "Sem razão social"} · ${tempoRelativo(item.notificadoEm)}`
                          : item.razaoSocial || "Sem razão social"}
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="notificacao-item"
                    onClick={() => abrirComodato(item)}
                  >
                    <span className="notificacao-item-titulo">Nova solicitação de comodato</span>
                    <span className="notificacao-item-linha">
                      Feita por: {item.vendedor && item.vendedor.trim() ? item.vendedor : "vendedor não identificado"}
                    </span>
                    <span className="notificacao-item-linha-suave">
                      {item.createdAt
                        ? `${item.razaoSocial || "Sem razão social"} · ${tempoRelativo(item.createdAt)}`
                        : item.razaoSocial || "Sem razão social"}
                    </span>
                  </button>
                );
              })}
              {total > itens.length && (
                <p className="notificacoes-restantes">+{total - itens.length} pendências</p>
              )}
            </div>
          )}

          <button type="button" className="notificacoes-rodape" onClick={verMinhasPendencias}>
            {papel === "vendedor" ? "Ver meus comodatos" : "Ver todas as minhas pendências"}
          </button>
        </div>
      )}
    </>
  );
}
