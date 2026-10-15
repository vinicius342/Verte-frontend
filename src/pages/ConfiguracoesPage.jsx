import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";
import { buscarConfiguracao, salvarConfiguracao } from "../services/configService";
import SignaturePad from "../components/common/SignaturePad";

function estadoInicial(config) {
  return {
    codigoRevenda: config?.codigoRevenda ?? "",
    nomeVendedor: config?.nomeVendedor ?? "",
    codigoVendedor: config?.codigoVendedor ?? "",
    nomeSupervisor: config?.nomeSupervisor ?? "",
    codigoSupervisor: config?.codigoSupervisor ?? "",
    assinatura: config?.assinatura ?? "",
  };
}

export default function ConfiguracoesPage() {
  const { usuario, uid, loading } = useAuth();
  const [dados, setDados] = useState(() => estadoInicial(null));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!uid) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    buscarConfiguracao(uid)
      .then((config) => {
        if (!ativo) return;
        setDados(estadoInicial(config));
      })
      .catch((erro) => {
        console.error("Erro ao carregar configuração:", erro);
        if (ativo) setErroGeral("Não foi possível carregar suas configurações.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [uid]);

  const alterar = (campo) => (e) => {
    setSucesso(false);
    setDados((atual) => ({ ...atual, [campo]: e.target.value }));
  };

  async function enviar(e) {
    e.preventDefault();
    setErroGeral(null);
    setSucesso(false);
    setSalvando(true);
    try {
      await salvarConfiguracao(uid, {
        codigoRevenda: dados.codigoRevenda.trim(),
        nomeVendedor: dados.nomeVendedor.trim(),
        codigoVendedor: dados.codigoVendedor.trim(),
        nomeSupervisor: dados.nomeSupervisor.trim(),
        codigoSupervisor: dados.codigoSupervisor.trim(),
        assinatura: dados.assinatura,
      });
      setSucesso(true);
    } catch (erro) {
      console.error("Erro ao salvar configuração:", erro);
      setErroGeral(erro?.message ?? "Não foi possível salvar as configurações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Configurações</h1>
        </div>

        {loading || carregando ? (
          <p className="estado-vazio">Carregando…</p>
        ) : !usuario ? (
          <p className="estado-vazio">
            Entre com sua conta para acessar as configurações.{" "}
            <Link to="/login">Fazer login</Link>
          </p>
        ) : (
          <form className="formulario formulario-cartao" onSubmit={enviar} noValidate>
            <label className="campo">
              <span className="campo-rotulo">Código de revenda</span>
              <input
                className="campo-input mono"
                value={dados.codigoRevenda}
                onChange={alterar("codigoRevenda")}
              />
            </label>

            <div className="campo-linha">
              <label className="campo">
                <span className="campo-rotulo">Nome do vendedor</span>
                <input
                  className="campo-input"
                  value={dados.nomeVendedor}
                  onChange={alterar("nomeVendedor")}
                />
              </label>
              <label className="campo">
                <span className="campo-rotulo">Código do vendedor</span>
                <input
                  className="campo-input mono"
                  value={dados.codigoVendedor}
                  onChange={alterar("codigoVendedor")}
                />
              </label>
            </div>

            <div className="campo-linha">
              <label className="campo">
                <span className="campo-rotulo">Nome do supervisor</span>
                <input
                  className="campo-input"
                  value={dados.nomeSupervisor}
                  onChange={alterar("nomeSupervisor")}
                />
              </label>
              <label className="campo">
                <span className="campo-rotulo">Código do supervisor</span>
                <input
                  className="campo-input mono"
                  value={dados.codigoSupervisor}
                  onChange={alterar("codigoSupervisor")}
                />
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

            {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}
            {sucesso ? <p className="estado-sucesso">Configurações salvas.</p> : null}

            <div className="formulario-acoes">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}