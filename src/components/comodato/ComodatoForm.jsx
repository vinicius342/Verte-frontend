import { useEffect, useState } from "react";
import Button from "../common/Button";
import { formatarCpfCnpj, validarCpfCnpj } from "../../utils/validators";
import { buscarConfiguracao } from "../../services/configService";
import { useAuth } from "../../hooks/useAuth";

function linhaVazia() {
  return { codMaterial: "", descricao: "", quantidade: "" };
}

function dadosIniciais(comodatoExistente) {
  return {
    revenda: comodatoExistente?.revenda ?? "",
    vendedor: comodatoExistente?.vendedor ?? "",
    vendedorCodigo: comodatoExistente?.vendedorCodigo ?? "",
    supervisor: comodatoExistente?.supervisor ?? "",
    supervisorCodigo: comodatoExistente?.supervisorCodigo ?? "",
    codPdv: comodatoExistente?.codPdv ?? "",
    razaoSocial: comodatoExistente?.razaoSocial ?? "",
    cpf: comodatoExistente?.cpf ?? "",
  };
}

function materiaisIniciais(comodatoExistente) {
  const materiais = comodatoExistente?.materiais ?? [];
  if (materiais.length === 0) return [linhaVazia(), linhaVazia()];

  return materiais.map((material) => ({
    codMaterial: material.codMaterial ?? "",
    descricao: material.descricao ?? "",
    quantidade: material.quantidade ?? "",
  }));
}

function preencherComConfiguracao(atual, config) {
  const vendedores = [config.nomeVendedor, config.codigoVendedor].filter(Boolean).join(" ");
  const supervisores = [config.nomeSupervisor, config.codigoSupervisor].filter(Boolean).join(" ");

  return {
    ...atual,
    revenda: atual.revenda?.trim() ? atual.revenda : config.codigoRevenda ?? "",
    vendedor: atual.vendedor?.trim() ? atual.vendedor : vendedores,
    vendedorCodigo: atual.vendedorCodigo?.trim() ? atual.vendedorCodigo : config.codigoVendedor ?? "",
    supervisor: atual.supervisor?.trim() ? atual.supervisor : supervisores,
    supervisorCodigo: atual.supervisorCodigo?.trim() ? atual.supervisorCodigo : config.codigoSupervisor ?? "",
  };
}

export default function ComodatoForm({ onSalvar, onCancelar, comodatoExistente }) {
  const { uid } = useAuth();
  const [dados, setDados] = useState(() => dadosIniciais(comodatoExistente));
  const [materiais, setMateriais] = useState(() => materiaisIniciais(comodatoExistente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [carregandoConfig, setCarregandoConfig] = useState(true);

  useEffect(() => {
    setDados(dadosIniciais(comodatoExistente));
    setMateriais(materiaisIniciais(comodatoExistente));
    setErros({});
    setErroGeral(null);
  }, [comodatoExistente]);

  useEffect(() => {
    let ativo = true;
    buscarConfiguracao(uid)
      .then((config) => {
        if (!ativo || !config) return;
        setDados((atual) => preencherComConfiguracao(atual, config));
      })
      .finally(() => ativo && setCarregandoConfig(false));
    return () => {
      ativo = false;
    };
  }, [uid]);

  function alterar(campo) {
    return (e) => {
      const valor = campo === "cpf" ? formatarCpfCnpj(e.target.value) : e.target.value;
      setDados((atual) => ({ ...atual, [campo]: valor }));
    };
  }

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
    const novosErros = {};
    if (!dados.razaoSocial?.trim()) novosErros.razaoSocial = "Informe o cliente.";
    if (!validarCpfCnpj(dados.cpf)) novosErros.cpf = "CPF/CNPJ inválido.";

    const materiaisPreenchidos = materiais.filter((m) => m.descricao?.trim() || m.codMaterial?.trim());
    if (materiaisPreenchidos.length === 0) novosErros.materiais = "Adicione ao menos um material.";

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

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

  if (carregandoConfig) {
    return (
      <div className="comodato-carregando-config comodato-carregando-config--formulario">
        <span className="spinner" aria-hidden="true" />
        <span>Carregando dados da revenda…</span>
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
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

      <label className="campo">
        <span className="campo-rotulo">Cód PDV</span>
        <input className="campo-input mono" value={dados.codPdv} onChange={alterar("codPdv")} />
      </label>

      <label className="campo">
        <span className="campo-rotulo">Cliente *</span>
        <input className="campo-input" value={dados.razaoSocial} onChange={alterar("razaoSocial")} required />
        {erros.razaoSocial ? <span className="campo-erro">{erros.razaoSocial}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">CPF/CNPJ *</span>
        <input
          className="campo-input mono"
          value={dados.cpf}
          onChange={alterar("cpf")}
          inputMode="numeric"
          placeholder="000.000.000-00"
        />
        {erros.cpf ? <span className="campo-erro">{erros.cpf}</span> : null}
      </label>

      <div className="campo">
        <div className="comodato-materiais-cabecalho">
          <span className="campo-rotulo">Materiais</span>
          <span className="comodato-materiais-contador">
            {materiais.length} {materiais.length === 1 ? "Item" : "Itens"}
          </span>
        </div>

        <div className="comodato-lista-cards-material">
          {materiais.map((linha, indice) => (
            <div className="comodato-card-material" key={indice}>
              <div className="comodato-card-material-topo">
                <span className="comodato-card-material-titulo">Material {indice + 1}</span>
                <button
                  type="button"
                  className="comodato-card-material-remover"
                  onClick={() => removerLinha(indice)}
                  aria-label="Remover material"
                >
                  ×
                </button>
              </div>

              <div className="comodato-card-material-linha">
                <label className="comodato-campo-mobile">
                  <span className="comodato-rotulo-mobile">Cód. material</span>
                  <input
                    className="campo-input mono"
                    placeholder="Ex. 0042"
                    value={linha.codMaterial}
                    onChange={(e) => alterarMaterial(indice, "codMaterial", e.target.value)}
                  />
                </label>
                <label className="comodato-campo-mobile comodato-campo-qtd">
                  <span className="comodato-rotulo-mobile">Qtd</span>
                  <input
                    className="campo-input mono"
                    placeholder="0"
                    value={linha.quantidade}
                    onChange={(e) => alterarMaterial(indice, "quantidade", e.target.value)}
                    inputMode="numeric"
                  />
                </label>
              </div>

              <label className="comodato-campo-mobile">
                <span className="comodato-rotulo-mobile">Descrição</span>
                <input
                  className="campo-input"
                  placeholder="Detalhe do material"
                  value={linha.descricao}
                  onChange={(e) => alterarMaterial(indice, "descricao", e.target.value)}
                />
              </label>
            </div>
          ))}
        </div>

        {erros.materiais ? <span className="campo-erro">{erros.materiais}</span> : null}
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