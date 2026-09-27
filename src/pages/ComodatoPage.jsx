import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import AddComodatoModal from "../components/comodato/AddComodatoModal";
import ComodatoList from "../components/comodato/ComodatoList";
import ComodatoDetailModal from "../components/comodato/ComodatoDetailModal";
import { useAuth } from "../hooks/useAuth";
import { useComodatos } from "../hooks/useComodatos";

export default function ComodatoPage() {
  const { usuario } = useAuth();
  const { comodatos, loading, erro } = useComodatos();
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);

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
          <span className="contador mono">{comodatos.length}</span>
        </div>
        <ComodatoList
          comodatos={comodatos}
          loading={loading}
          erro={erro}
          onSelecionar={setSelecionado}
        />
      </main>

      {usuario && (
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