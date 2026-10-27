import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import Carregando from "../components/common/Carregando";
import AddAtivoModal from "../components/ativo/AddAtivoModal";
import AtivoList from "../components/ativo/AtivoList";
import { useAuth } from "../hooks/useAuth";
import { useAtivos } from "../hooks/useAtivos";
import AtivoDetailModal from "../components/ativo/AtivoDetailModal";

export default function AtivosPage() {
  const { usuario, loading: authLoading } = useAuth();
  const { ativos, loading, erro } = useAtivos();
  const carregando = authLoading || loading;
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [valoresIniciais, setValoresIniciais] = useState(null);

  useEffect(() => {
    const novo = location.state?.novoAtivo;
    if (!novo) return;
    setValoresIniciais(novo);
    setAdicionando(true);
    navigate(location.pathname, { replace: true, state: null }); // evita reabrir ao recarregar
  }, [location, navigate]);

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Ativos</h1>
          <span className="contador mono">{ativos.length}</span>
        </div>
        {carregando ? (
          <Carregando tela />
        ) : (
          <AtivoList ativos={ativos} loading={loading} erro={erro} onSelecionar={setSelecionado} />
        )}
      </main>

      {usuario && (
        <Button className="botao-adicionar-fixo" aria-label="Novo ativo" onClick={() => setAdicionando(true)}>
          <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
          <span>Novo ativo</span>
        </Button>
      )}

      <AddAtivoModal
        aberto={adicionando}
        valoresIniciais={valoresIniciais}
        onFechar={() => {
          setAdicionando(false);
          setValoresIniciais(null);
        }}
        onSalvo={(ativo) => {
          setAdicionando(false);
          setValoresIniciais(null);
          setSelecionado(ativo);
        }}
      />

      <AtivoDetailModal
        ativo={selecionado}
        onFechar={
          () => setSelecionado(null)
        }
      />
    </div>
  );
}