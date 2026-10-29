import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Hash, Trash2, Upload, User } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import SignaturePad from "../components/common/SignaturePad";
import Carregando from "../components/common/Carregando";
import Avatar from "../components/common/Avatar";
import { useAuth } from "../hooks/useAuth";
import { usePerfil } from "../hooks/usePerfil";
import { useFotoPerfil, atualizarFotoPerfil } from "../hooks/useFotoPerfil";
import { salvarPerfil, salvarFotoPerfil, removerFotoPerfil } from "../services/perfilService";
import "../styles/perfil.css";

const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024;

function Quadro({ icone: Icone, rotulo, valor, mono = false }) {
  return (
    <div className="perfil-quadro">
      <div className="perfil-quadro-icone">
        <Icone aria-hidden="true" />
      </div>
      <div>
        <p className="perfil-quadro-rotulo">{rotulo}</p>
        <p className={`perfil-quadro-valor ${mono ? "mono" : ""}`}>{valor || "—"}</p>
      </div>
    </div>
  );
}

function IdentidadeCard({ perfil, exigeSupervisor, supervisorEncontrado, supervisorErro, uid }) {
  const fotoUrl = useFotoPerfil();
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const nome = perfil?.vendedor;
  const codigo = perfil?.vendedorCodigo;

  async function aoEscolher(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) return setErro("Escolha um arquivo de imagem.");
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) return setErro("A imagem deve ter no máximo 10 MB.");

    setErro(null);
    setEnviando(true);
    try {
      const { fotoUrl: nova } = await salvarFotoPerfil(arquivo);
      atualizarFotoPerfil(uid, nova);
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
      setErro(err?.message ?? "Não foi possível enviar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setErro(null);
    setEnviando(true);
    try {
      await removerFotoPerfil();
      atualizarFotoPerfil(uid, null);
    } catch (err) {
      console.error("Erro ao remover foto:", err);
      setErro(err?.message ?? "Não foi possível remover a foto.");
    } finally {
      setEnviando(false);
    }
  }

  const abrirSeletor = () => inputRef.current?.click();

  return (
    <section className="perfil-cartao">
      <div className="perfil-identidade">
        <div className="perfil-avatar-wrap">
          <div className="perfil-avatar">
            <Avatar nome={nome} fotoUrl={fotoUrl} />
          </div>
          <button
            type="button"
            className="perfil-camera"
            aria-label="Alterar foto"
            disabled={enviando}
            onClick={abrirSeletor}
          >
            <Camera aria-hidden="true" />
          </button>
        </div>

        <div className="perfil-identidade-info">
          <h2 className="perfil-nome">{nome || "—"}</h2>
          {codigo ? <p className="perfil-codigo">Código #{codigo}</p> : null}

          <input ref={inputRef} type="file" accept="image/*" hidden onChange={aoEscolher} />
          <div className="perfil-acoes-foto">
            <button
              type="button"
              className="perfil-btn perfil-btn-primario"
              disabled={enviando}
              onClick={abrirSeletor}
            >
              <Upload aria-hidden="true" />
              {enviando ? "Enviando…" : fotoUrl ? "Alterar foto" : "Adicionar foto"}
            </button>
            {fotoUrl && !enviando ? (
              <button type="button" className="perfil-btn perfil-btn-perigo" onClick={remover}>
                <Trash2 aria-hidden="true" />
                Remover
              </button>
            ) : null}
          </div>
          {erro ? <p className="perfil-erro-foto">{erro}</p> : null}
        </div>
      </div>

      <div className="perfil-grade">
        <Quadro icone={User} rotulo="Nome" valor={nome} />
        <Quadro icone={Hash} rotulo="Código" valor={codigo} mono />
        {exigeSupervisor && supervisorEncontrado ? (
          <>
            <Quadro icone={User} rotulo="Supervisor" valor={perfil?.supervisor} />
            <Quadro icone={Hash} rotulo="Código do supervisor" valor={perfil?.supervisorCodigo} mono />
          </>
        ) : null}
      </div>

      {exigeSupervisor && !supervisorEncontrado ? (
        <p className="perfil-aviso-supervisor">
          {supervisorErro
            ? "Não foi possível carregar os dados do seu supervisor. Tente novamente ou entre em contato com seu gerente ou administrador."
            : "Você ainda não tem um supervisor vinculado. Entre em contato com seu gerente ou administrador para resolver."}
        </p>
      ) : null}
    </section>
  );
}

function PerfilForm({
  perfil,
  exigeSupervisor,
  supervisorEncontrado,
  supervisorErro,
  uid,
  revendedoraId,
}) {
  const { definirAssinaturaConfigurada } = useAuth();
  const [assinatura, setAssinatura] = useState(perfil?.assinatura ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    const assinaturaVazia =
      !assinatura || (typeof assinatura === "string" && assinatura.trim() === "");
    if (assinaturaVazia) {
      setErro("A assinatura é obrigatória.");
      return;
    }

    setSalvando(true);
    try {
      await salvarPerfil(revendedoraId, uid, { assinatura });
      definirAssinaturaConfigurada(true);
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setErro(err?.message ?? "Não foi possível salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <IdentidadeCard
        perfil={perfil}
        exigeSupervisor={exigeSupervisor}
        supervisorEncontrado={supervisorEncontrado}
        supervisorErro={supervisorErro}
        uid={uid}
      />

      <form className="perfil-cartao" onSubmit={enviar} noValidate>
        <div className="perfil-assinatura-topo">
          <h3 className="perfil-titulo-cartao">Assinatura</h3>
          <p className="perfil-subtitulo">Usada nos seus documentos.</p>
        </div>

        <SignaturePad
          valor={assinatura}
          onAlterar={(dataUrl) => {
            setSucesso(false);
            setAssinatura(dataUrl);
          }}
        />

        {erro || sucesso ? (
          <div className="perfil-mensagens">
            {erro ? <p className="estado-erro">{erro}</p> : null}
            {sucesso ? <p className="estado-sucesso">Assinatura salva.</p> : null}
          </div>
        ) : null}

        <div className="perfil-rodape">
          <button type="submit" className="perfil-btn perfil-btn-primario perfil-btn-salvar" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar assinatura"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function PerfilPage() {
  const {
    usuario: usuarioAuth,
    uid,
    revendedoraId,
    loading: loadingAuth,
    precisaConfigurarAssinatura,
  } = useAuth();
  const { perfil, supervisor, exigeSupervisor, supervisorErro, loading, erro } = usePerfil();
  const [menuAberto, setMenuAberto] = useState(false);

  let conteudo;
  if (loadingAuth || loading) {
    conteudo = <Carregando tela />;
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
    <div className="pagina perfil-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      <main className="conteudo perfil-main">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Meu perfil</h1>
        </div>
        {precisaConfigurarAssinatura ? (
          <p className="perfil-aviso-supervisor">Cadastre sua assinatura para liberar o sistema.</p>
        ) : null}
        {conteudo}
      </main>
    </div>
  );
}
