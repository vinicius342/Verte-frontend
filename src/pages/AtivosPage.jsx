import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import AddAtivoModal from "../components/ativo/AddAtivoModal";
import AtivoList from "../components/ativo/AtivoList";
import { useAuth } from "../hooks/useAuth";
import { useAtivos } from "../hooks/useAtivos";
import AtivoDetailModal from "../components/ativo/AtivoDetailModal";

export default function AtivosPage() {
  const { usuario } = useAuth();
  const { ativos, loading, erro } = useAtivos();
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Ativos</h1>
          <span className="contador mono">{ativos.length}</span>
        </div>
        <AtivoList ativos={ativos} loading={loading} erro={erro} onSelecionar={setSelecionado} />
      </main>

      {usuario && (
        <Button className="botao-adicionar-fixo" aria-label="Novo ativo" onClick={() => setAdicionando(true)}>
          <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
          <span>Novo ativo</span>
        </Button>
      )}

      <AddAtivoModal
        aberto={adicionando}
        onFechar={() => setAdicionando(false)}
        onSalvo={(ativo) => {
          setAdicionando(false);
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