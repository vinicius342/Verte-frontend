import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Carregando from "../components/common/Carregando";
import { useRotas } from "../hooks/useRotas";
import { Button } from "../components/ui/button";

function formatarDataHoje() {
  return new Date().toLocaleDateString("pt-BR");
}

function obterProgresso(rota) {
  const total = rota?.totalParadas ?? rota?.paradas?.length ?? 0;
  const entregues = rota?.entregues ?? rota?.contadores?.entregues ?? 0;
  return { total, entregues };
}

function obterStatus(rota) {
  return rota?.status ?? "em_andamento";
}

export default function RotaDoDiaPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const { itens, loading } = useRotas();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <header className="conteudo-topo">
          <h1 className="titulo-secao">Rota do dia</h1>
          <span className="contador">{formatarDataHoje()}</span>
        </header>

        {loading && (!itens || itens.length === 0) ? (
          <Carregando tela />
        ) : (
          <div>
            {(!itens || itens.length === 0) && <p className="estado-vazio">Nenhuma rota hoje. Toque em Nova rota para começar.</p>}
            {(itens || []).map((rota) => {
              const { total, entregues } = obterProgresso(rota);
              const status = obterStatus(rota);
              const finalizada = status === "finalizada";
              return (
                <button
                  key={rota.id}
                  type="button"
                  className="rota-cartao"
                  onClick={() => navigate(`/rota-do-dia/${rota.id}`)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ fontWeight: 700 }}>{rota?.numero}ª rota do dia</div>
                    <span className={`selo-confirmacao ${finalizada ? "selo-confirmacao--confirmado" : "selo-confirmacao--pendente"}`}>
                      {finalizada ? "Finalizada" : "Em andamento"}
                    </span>
                  </div>
                  <div className="rota-progresso">
                    <div
                      className="rota-progresso-barra"
                      style={{ width: total > 0 ? `${Math.min(100, (entregues / total) * 100)}%` : "0%" }}
                    />
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--texto-2)" }}>
                    {entregues} de {total} entregues
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <Button className="botao-adicionar-fixo" onClick={() => navigate("/rota-do-dia/nova")}>
        Nova rota
      </Button>
    </div>
  );
}
