import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import SignaturePad from "../components/common/SignaturePad";
import { useAuth } from "../hooks/useAuth";
import { usePerfil } from "../hooks/usePerfil";
import { salvarPerfil } from "../services/perfilService";

function CampoLeitura({ rotulo, valor, mono = false }) {
  return (
    <div className="campo">
      <span className="campo-rotulo">{rotulo}</span>
      <span className={`campo-valor ${mono ? "mono" : ""}`}>{valor || "—"}</span>
    </div>
  );
}

function PerfilForm({ perfil, exigeSupervisor, supervisorEncontrado, supervisorErro, uid, revendedoraId }) {
  const [assinatura, setAssinatura] = useState(perfil?.assinatura ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      await salvarPerfil(revendedoraId, uid, { assinatura });
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
      <div className="campo-linha">
        <CampoLeitura rotulo="Nome" valor={perfil?.vendedor} />
        <CampoLeitura rotulo="Código" valor={perfil?.vendedorCodigo} mono />
      </div>

      {exigeSupervisor ? (
        supervisorEncontrado ? (
          <div className="campo-linha">
            <CampoLeitura rotulo="Supervisor" valor={perfil?.supervisor} />
            <CampoLeitura rotulo="Código do supervisor" valor={perfil?.supervisorCodigo} mono />
          </div>
        ) : (
          <p className="estado-erro">
            {supervisorErro
              ? "Não foi possível carregar os dados do seu supervisor. Tente novamente ou entre em contato com seu gerente ou administrador."
              : "Você ainda não tem um supervisor vinculado. Entre em contato com seu gerente ou administrador para resolver."}
          </p>
        )
      ) : null}

      <div className="campo">
        <span className="campo-rotulo">Assinatura</span>
        <SignaturePad
          valor={assinatura}
          onAlterar={(dataUrl) => {
            setSucesso(false);
            setAssinatura(dataUrl);
          }}
        />
      </div>

      {erro ? <p className="estado-erro">{erro}</p> : null}
      {sucesso ? <p className="estado-sucesso">Assinatura salva.</p> : null}

      <div className="formulario-acoes">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar assinatura"}
        </Button>
      </div>
    </form>
  );
}

export default function PerfilPage() {
  const { usuario: usuarioAuth, uid, revendedoraId, loading: loadingAuth } = useAuth();
  const { perfil, supervisor, exigeSupervisor, supervisorErro, loading, erro } = usePerfil();
  const [menuAberto, setMenuAberto] = useState(false);

  let conteudo;
  if (loadingAuth || loading) {
    conteudo = <p className="estado-vazio">Carregando…</p>;
  } else if (!usuarioAuth) {
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
    conteudo = (
      <PerfilForm
        perfil={perfil}
        exigeSupervisor={exigeSupervisor}
        supervisorEncontrado={Boolean(supervisor)}
        supervisorErro={supervisorErro}
        uid={uid}
        revendedoraId={revendedoraId}
      />
    );
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