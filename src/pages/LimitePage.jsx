import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import Carregando from "../components/common/Carregando";
import AddLimiteModal from "../components/limite/AddLimiteModal";
import LimiteList from "../components/limite/LimiteList";
import LimiteDetailModal from "../components/limite/LimiteDetailModal";
import { useAuth } from "../hooks/useAuth";
import { useLimites } from "../hooks/useLimites";

export default function LimitePage() {
  const { ehMotorista, loading: authLoading } = useAuth();
  const { limites, loading, erro } = useLimites();
  const carregando = authLoading || loading;
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [recemCriado, setRecemCriado] = useState(false);

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Solicitações de limite</h1>
          <span className="contador mono">{limites.length}</span>
        </div>

        <div data-tour="limites-lista">
          {carregando ? (
            <Carregando tela />
          ) : (
            <LimiteList limites={limites} loading={loading} erro={erro} onSelecionar={setSelecionado} />
          )}
        </div>
      </main>

      {!ehMotorista && (
        <Button
          className="botao-adicionar-fixo"
          data-tour="novo-limite"
          aria-label="Nova solicitação de limite"
          onClick={() => setAdicionando(true)}
        >
          <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
          <span>Novo limite</span>
        </Button>
      )}

      <AddLimiteModal
        aberto={adicionando}
        onFechar={() => setAdicionando(false)}
        onSalvo={(dados) => {
          setAdicionando(false);
          setSelecionado(dados);
          setRecemCriado(true);
        }}
      />
      <LimiteDetailModal
        limite={selecionado}
        recemCriado={recemCriado}
        onFechar={() => {
          setSelecionado(null);
          setRecemCriado(false);
        }}
      />
    </div>
  );
}