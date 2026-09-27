import { useEffect, useState } from "react";
import Button from "../common/Button";
import { buscarConfiguracao } from "../../services/configService";
import { useAuth } from "../../hooks/useAuth";

function linhaVazia() {
  return { codMaterial: "", descricao: "", quantidade: "" };
}

export default function ComodatoForm({ onSalvar, onCancelar }) {
  const { uid } = useAuth();
  const [dados, setDados] = useState({
    numeroTermo: "",
    revenda: "",
    vendedor: "",
    supervisor: "",
    codPdv: "",
    razaoSocial: "",
  });
  const [materiais, setMateriais] = useState([linhaVazia(), linhaVazia()]);
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [carregandoConfig, setCarregandoConfig] = useState(true);

  useEffect(() => {
    let ativo = true;
    buscarConfiguracao(uid)
      .then((config) => {
        if (!ativo || !config) return;
        setDados((atual) => ({
          ...atual,
          revenda: config.codigoRevenda ?? "",
          vendedor: config.codigoVendedor ?? "",
          supervisor: config.codigoSupervisor ?? "",
        }));
      })
      .finally(() => ativo && setCarregandoConfig(false));
    return () => {
      ativo = false;
    };
  }, [uid]);

  const alterar = (campo) => (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));

  function alterarMaterial(indice, campo, valor) {
    setMateriais((atual) => atual.map((linha, i) => (i === indice ? { ...linha, [campo]: valor } : linha)));
  }

  function adicionarLinha() {
    setMateriais((atual) => [...atual, linhaVazia()]);
  }

  function removerLinha(indice) {
    setMateriais((atual) => atual.filter((_, i) => i !== indice));
  }

  async function enviar(e) {
    e.preventDefault();
    const materiaisPreenchidos = materiais.filter((m) => m.descricao?.trim());
    if (materiaisPreenchidos.length === 0) {
      setErroGeral("Adicione ao menos um material.");
      return;
    }

    setEnviando(true);
    setErroGeral(null);
    try {
      await onSalvar({ ...dados, materiais: materiaisPreenchidos });
    } catch (erro) {
      setErroGeral(erro?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      {carregandoConfig ? <p className="campo-dica">Carregando dados da revenda...</p> : null}

      <label className="campo">
        <span className="campo-rotulo">Número do termo</span>
        <input className="campo-input mono" value={dados.numeroTermo} onChange={alterar("numeroTermo")} />
      </label>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Revenda</span>
          <input className="campo-input" value={dados.revenda} onChange={alterar("revenda")} />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Supervisor</span>
          <input className="campo-input" value={dados.supervisor} onChange={alterar("supervisor")} />
        </label>
      </div>

      <label className="campo">
        <span className="campo-rotulo">Vendedor</span>
        <input className="campo-input" value={dados.vendedor} onChange={alterar("vendedor")} />
      </label>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Cód PDV</span>
          <input className="campo-input mono" value={dados.codPdv} onChange={alterar("codPdv")} />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Razão social</span>
          <input className="campo-input" value={dados.razaoSocial} onChange={alterar("razaoSocial")} />
        </label>
      </div>

      <div className="campo">
        <span className="campo-rotulo">Materiais</span>
        <div className="comodato-tabela-materiais">
          <div className="comodato-linha-material comodato-linha-cabecalho">
            <span>Cód material</span>
            <span>Descrição</span>
            <span>Qtd</span>
            <span />
          </div>
          {materiais.map((linha, indice) => (
            <div className="comodato-linha-material" key={indice}>
              <input
                className="campo-input mono"
                value={linha.codMaterial}
                onChange={(e) => alterarMaterial(indice, "codMaterial", e.target.value)}
              />
              <input
                className="campo-input"
                value={linha.descricao}
                onChange={(e) => alterarMaterial(indice, "descricao", e.target.value)}
              />
              <input
                className="campo-input mono"
                value={linha.quantidade}
                onChange={(e) => alterarMaterial(indice, "quantidade", e.target.value)}
                inputMode="numeric"
              />
              <button
                type="button"
                className="lista-anexos-remover"
                onClick={() => removerLinha(indice)}
                aria-label="Remover linha"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" onClick={adicionarLinha}>
          + Adicionar material
        </Button>
      </div>

      {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

      <div className="formulario-acoes">
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}