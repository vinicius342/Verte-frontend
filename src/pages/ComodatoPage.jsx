import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import Carregando from "../components/common/Carregando";
import AddComodatoModal from "../components/comodato/AddComodatoModal";
import ComodatoList from "../components/comodato/ComodatoList";
import ComodatoDetailModal from "../components/comodato/ComodatoDetailModal";
import { useAuth } from "../hooks/useAuth";
import { useComodatos } from "../hooks/useComodatos";

export default function ComodatoPage() {
  const { papel, loading: authLoading } = useAuth();
  const { comodatos, loading, erro } = useComodatos();
  const carregando = authLoading || loading;
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const ehSupervisor = papel === "supervisor";
  const ehGerente = papel === "gerente";
  const filtros = [
    { id: "todos", rotulo: "Todos" },
    ...(ehSupervisor || ehGerente ? [{ id: "minha-vez", rotulo: "Minha vez" }] : []),
    { id: "pendentes", rotulo: "Pendentes" },
    { id: "confirmados", rotulo: "Confirmados" },
    { id: "rejeitados", rotulo: "Rejeitados" },
  ];

  const comodatosFiltrados = comodatos.filter((comodato) => {
    if (filtro === "minha-vez") {
      if (ehSupervisor) return comodato.confirmacaoSupervisor === "pendente";
      if (ehGerente) return comodato.confirmacaoGerente === "pendente";
      return true;
    }
    if (filtro === "pendentes") return comodato.statusComodato === "pendente";
    if (filtro === "confirmados") return comodato.statusComodato === "confirmado";
    if (filtro === "rejeitados") return comodato.statusComodato === "rejeitado";
    return true;
  });

  const mostrarNenhumNoFiltro =
    !carregando && !erro && comodatos.length > 0 && comodatosFiltrados.length === 0;

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar
        aberta={menuAberto}
        onFechar={() => setMenuAberto(false)}
      />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Comodatos</h1>
          <span className="contador mono">
            {comodatosFiltrados.length === comodatos.length
              ? comodatosFiltrados.length
              : `${comodatosFiltrados.length} de ${comodatos.length}`}
          </span>
        </div>

        <div className="comodato-filtros">
          {filtros.map(({ id, rotulo }) => (
            <button
              key={id}
              type="button"
              className={`comodato-filtro${filtro === id ? " comodato-filtro--ativo" : ""}`}
              aria-pressed={filtro === id}
              onClick={() => setFiltro(id)}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {carregando ? (
          <Carregando tela />
        ) : mostrarNenhumNoFiltro ? (
          <p className="estado-vazio">Nenhum comodato neste filtro.</p>
        ) : (
          <ComodatoList
            comodatos={comodatosFiltrados}
            loading={loading}
            erro={erro}
            onSelecionar={setSelecionado}
          />
        )}
      </main>

      {papel === "vendedor" && (
        <Button
          className="botao-adicionar-fixo"
          aria-label="Novo comodato"
          onClick={() => setAdicionando(true)}
        >
          <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
          <span>Novo comodato</span>
        </Button>
      )}

      <AddComodatoModal
        aberto={adicionando}
        onFechar={() => setAdicionando(false)}
        onSalvo={(dados) => {
          setAdicionando(false);
          setSelecionado(dados);
        }}
      />
      <ComodatoDetailModal comodato={selecionado} onFechar={() => setSelecionado(null)} />
    </div>
  );
}