import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Route } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Carregando from "../components/common/Carregando";
import { useRotas } from "../hooks/useRotas";

function formatarDataCurta(data) {
  if (!data) return "";
  const partes = String(data).split("-");
  if (partes.length === 3) {
    const [a, m, d] = partes;
    return `${d}/${m}/${a.slice(2)}`;
  }
  try {
    const dt = new Date(data);
    const dia = String(dt.getDate()).padStart(2, "0");
    const mes = String(dt.getMonth() + 1).padStart(2, "0");
    const ano = String(dt.getFullYear()).slice(2);
    return `${dia}/${mes}/${ano}`;
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

  const rotas = itens || [];
  const totalRotas = rotas.length;

  return (
    <div className="pagina rota-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo rota-conteudo">
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
          <h1 className="rota-titulo">Rota do dia</h1>
          <span className="rota-pilula">
            {totalRotas} {totalRotas === 1 ? "rota" : "rotas"}
          </span>
        </header>

        {loading && rotas.length === 0 ? (
          <Carregando tela />
        ) : (
          <div>
            {rotas.length === 0 && (
              <div className="rota-card rota-card-vazio">Nenhuma rota ainda. Toque em Nova rota para começar.</div>
            )}
            <div className="rota-grid-rotas">
              {rotas.map((rota) => {
                const { total, entregues, naoEntregues } = obterProgresso(rota);
                const status = obterStatus(rota);
                const finalizada = status === "finalizada";
                const concluidas = Math.min(total, entregues + naoEntregues);
                const progresso = total > 0 ? (concluidas / total) * 100 : 0;
                const dataCurta = formatarDataCurta(rota?.data);
                return (
                  <button
                    key={rota.id}
                    type="button"
                    className="rota-card rota-card-clicavel"
                    onClick={() => navigate(`/rota-do-dia/${rota.id}`)}
                  >
                    <div className="rota-icone-quadrado">
                      <Route size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                        <div className="rota-cartao-titulo">{rota?.numero}ª rota do dia</div>
                        {dataCurta && <span style={{ fontFamily: "var(--fonte-mono)", fontSize: "0.8rem", color: "var(--r-muted-texto)", whiteSpace: "nowrap" }}>{dataCurta}</span>}
                      </div>
                      <div className="rota-barra">
                        <div className="rota-barra-preenchida" style={{ width: `${progresso}%` }} />
                      </div>
                      <div className="rota-cartao-rodape">
                        <div className="rota-cartao-rodape-texto">
                          {entregues} de {total} entregues
                        </div>
                        <span className={`rota-selo ${finalizada ? "rota-selo--finalizada" : "rota-selo--andamento"}`}>
                          <span className="rota-selo-ponto" />
                          {finalizada ? "Finalizada" : "Em andamento"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--r-muted-texto)" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <button type="button" className="rota-fab" onClick={() => navigate("/rota-do-dia/nova")} aria-label="Nova rota">
        <Plus size={20} />
        <span className="rota-fab-texto">Nova rota</span>
      </button>
    </div>
  );
}
