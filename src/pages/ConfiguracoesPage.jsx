import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import Carregando from "../components/common/Carregando";
import { useAuth } from "../hooks/useAuth";
import { useConfiguracoes } from "../hooks/useConfiguracoes";
import { salvarConfiguracaoRevendedora } from "../services/revendedoraService";

function RevendedoraForm({ revendedora, uid, revendedoraId }) {
  const [codigoRevenda, setCodigoRevenda] = useState(revendedora?.codigoRevenda ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      await salvarConfiguracaoRevendedora(revendedoraId, { codigoRevenda }, uid);
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao salvar configuração da revendedora:", err);
      setErro(err?.message ?? "Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="formulario formulario-cartao" onSubmit={enviar} noValidate>
      <h2 className="titulo-secao">Configurações da revendedora</h2>

      <label className="campo">
        <span className="campo-rotulo">Código de revenda</span>
        <input
          className="campo-input mono"
          value={codigoRevenda}
          onChange={(e) => {
            setSucesso(false);
            setCodigoRevenda(e.target.value);
          }}
        />
      </label>

      {erro ? <p className="estado-erro">{erro}</p> : null}
      {sucesso ? <p className="estado-sucesso">Configurações salvas.</p> : null}

      <div className="formulario-acoes">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

export default function ConfiguracoesPage() {
  const { usuario, uid, revendedoraId, loading: loadingAuth } = useAuth();
  const { revendedora, loading, erro } = useConfiguracoes();
  const [menuAberto, setMenuAberto] = useState(false);

  // O acesso por papel (admin/gerente) é garantido pela RotaGerente em AppRoutes.
  let conteudo;
  if (loadingAuth || loading) {
    conteudo = <Carregando tela />;
  } else if (!usuario) {
    conteudo = (
      <p className="estado-vazio">
        Entre com sua conta para acessar as configurações. <Link to="/login">Fazer login</Link>
      </p>
    );
  } else if (!revendedoraId) {
    conteudo = <p className="estado-erro">Sua conta não está vinculada a uma revendedora.</p>;
  } else if (erro) {
    conteudo = <p className="estado-erro">{erro}</p>;
  } else {
    conteudo = <RevendedoraForm revendedora={revendedora} uid={uid} revendedoraId={revendedoraId} />;
  }

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Configurações</h1>
        </div>
        {conteudo}
      </main>
    </div>
  );
}