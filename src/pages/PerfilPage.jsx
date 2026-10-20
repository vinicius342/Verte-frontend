import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import SignaturePad from "../components/common/SignaturePad";
import { useAuth } from "../hooks/useAuth";
import { usePerfil } from "../hooks/usePerfil";
import { salvarPerfil } from "../services/perfilService";

function PerfilForm({ perfil, uid, revendedoraId }) {
  const [dados, setDados] = useState({
    vendedor: perfil?.vendedor ?? "",
    vendedorCodigo: perfil?.vendedorCodigo ?? "",
    supervisor: perfil?.supervisor ?? "",
    supervisorCodigo: perfil?.supervisorCodigo ?? "",
    assinatura: perfil?.assinatura ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const alterar = (campo) => (e) => {
    setSucesso(false);
    setDados((atual) => ({ ...atual, [campo]: e.target.value }));
  };

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      await salvarPerfil(revendedoraId, uid, dados);
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setErro(err?.message ?? "Não foi possível salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="formulario formulario-cartao" onSubmit={enviar} noValidate>
      <h2 className="titulo-secao">Meu perfil</h2>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Nome do vendedor</span>
          <input className="campo-input" value={dados.vendedor} onChange={alterar("vendedor")} />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Código do vendedor</span>
          <input className="campo-input mono" value={dados.vendedorCodigo} onChange={alterar("vendedorCodigo")} />
        </label>
      </div>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Nome do supervisor</span>
          <input className="campo-input" value={dados.supervisor} onChange={alterar("supervisor")} />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Código do supervisor</span>
          <input className="campo-input mono" value={dados.supervisorCodigo} onChange={alterar("supervisorCodigo")} />
        </label>
      </div>

      <div className="campo">
        <span className="campo-rotulo">Assinatura</span>
        <SignaturePad
          valor={dados.assinatura}
          onAlterar={(dataUrl) => {
            setSucesso(false);
            setDados((atual) => ({ ...atual, assinatura: dataUrl }));
          }}
        />
      </div>

      {erro ? <p className="estado-erro">{erro}</p> : null}
      {sucesso ? <p className="estado-sucesso">Perfil salvo.</p> : null}

      <div className="formulario-acoes">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}

export default function PerfilPage() {
  const { usuario, uid, revendedoraId, loading: loadingAuth } = useAuth();
  const { perfil, loading, erro } = usePerfil();
  const [menuAberto, setMenuAberto] = useState(false);

  let conteudo;
  if (loadingAuth || loading) {
    conteudo = <p className="estado-vazio">Carregando…</p>;
  } else if (!usuario) {
    conteudo = (
      <p className="estado-vazio">
        Entre com sua conta para acessar seu perfil. <Link to="/login">Fazer login</Link>
      </p>
    );
  } else if (!revendedoraId) {
    conteudo = <p className="estado-erro">Sua conta não está vinculada a uma revendedora.</p>;
  } else if (erro) {
    conteudo = <p className="estado-erro">{erro}</p>;
  } else {
    conteudo = <PerfilForm perfil={perfil} uid={uid} revendedoraId={revendedoraId} />;
  }

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Meu perfil</h1>
        </div>
        {conteudo}
      </main>
    </div>
  );
}