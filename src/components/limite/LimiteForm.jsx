import { useEffect, useState } from "react";
import Button from "../common/Button";

const VAZIO = {
  rota: "",
  codPdv: "",
  razaoSocial: "",
  fantasia: "",
  seguimento: "",
  telefones: [""],
  responsavel: "",
  prazoAtual: "0",
  prazoSolicitado: "",
  limiteAtual: "0,000",
  limiteSolicitado: "",
  valorVenda: "",
  qtdItens: "",
  qtdItensMix: "",
  qtdItensFoco: "",
  qtdItensValidade: "0",
  historicoAtraso: "NÃO",
  motivo: "",
};

function dadosIniciais(existente) {
  const d = { ...VAZIO };
  if (existente) {
    Object.keys(VAZIO).forEach((k) => {
      if (existente[k] !== undefined && existente[k] !== null) d[k] = existente[k];
    });
  }
  d.telefones = d.telefones?.length ? [...d.telefones] : [""];
  return d;
}

function Campo({ dados, erros, alterar, campo, rotulo, obrigatorio, mono, ...resto }) {
  return (
    <label className="campo">
      <span className="campo-rotulo">
        {rotulo}
        {obrigatorio ? " *" : ""}
      </span>
      <input
        className={`campo-input${mono ? " mono" : ""}`}
        value={dados[campo]}
        onChange={alterar(campo)}
        {...resto}
      />
      {erros[campo] ? <span className="campo-erro">{erros[campo]}</span> : null}
    </label>
  );
}

export default function LimiteForm({ onSalvar, onCancelar, limiteExistente }) {
  const [dados, setDados] = useState(() => dadosIniciais(limiteExistente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  useEffect(() => {
    setDados(dadosIniciais(limiteExistente));
    setErros({});
    setErroGeral(null);
  }, [limiteExistente]);

  function alterar(campo) {
    return (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));
  }

  function alterarTelefone(indice, valor) {
    setDados((atual) => ({
      ...atual,
      telefones: atual.telefones.map((t, i) => (i === indice ? valor : t)),
    }));
  }

  function adicionarTelefone() {
    setDados((atual) => ({ ...atual, telefones: [...atual.telefones, ""] }));
  }

  function removerTelefone(indice) {
    setDados((atual) => {
      const novos = atual.telefones.filter((_, i) => i !== indice);
      return { ...atual, telefones: novos.length ? novos : [""] };
    });
  }

  async function enviar(e) {
    e.preventDefault();
    const novosErros = {};
    if (!dados.rota?.trim()) novosErros.rota = "Informe a rota.";
    if (!dados.codPdv?.trim()) novosErros.codPdv = "Informe o Cód PDV.";
    if (!dados.razaoSocial?.trim()) novosErros.razaoSocial = "Informe a razão social.";
    if (!dados.limiteSolicitado?.trim()) novosErros.limiteSolicitado = "Informe o limite solicitado.";
    if (!dados.motivo?.trim()) novosErros.motivo = "Informe o motivo.";

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    setErroGeral(null);
    try {
      await onSalvar({
        ...dados,
        telefones: dados.telefones.map((t) => t.trim()).filter(Boolean),
      });
    } catch (erro) {
      setErroGeral(erro?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  const p = { dados, erros, alterar };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <div className="campo-linha">
        <Campo {...p} campo="rota" rotulo="Rota" obrigatorio mono inputMode="numeric" />
        <Campo {...p} campo="codPdv" rotulo="Cód PDV" obrigatorio mono />
      </div>

      <Campo {...p} campo="razaoSocial" rotulo="Razão Social" obrigatorio />
      <Campo {...p} campo="fantasia" rotulo="Fantasia" />
      <Campo {...p} campo="seguimento" rotulo="Seguimento" placeholder="Ex. Subdistribuidor" />
      <Campo {...p} campo="responsavel" rotulo="Responsável" placeholder="Ex. Sr Joelio" />

      <div className="campo">
        <span className="campo-rotulo">Telefones</span>
        {dados.telefones.map((tel, i) => (
          <div className="campo-linha" key={i}>
            <input
              className="campo-input mono"
              value={tel}
              inputMode="tel"
              placeholder="85 900000000"
              onChange={(e) => alterarTelefone(i, e.target.value)}
            />
            <button
              type="button"
              className="comodato-card-material-remover"
              onClick={() => removerTelefone(i)}
              aria-label="Remover telefone"
            >
              ×
            </button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={adicionarTelefone}>
          + Adicionar telefone
        </Button>
      </div>

      <div className="campo-linha">
        <Campo {...p} campo="prazoAtual" rotulo="Prazo Atual" />
        <Campo {...p} campo="prazoSolicitado" rotulo="Prazo Solicitado" placeholder="BOLETO 10 dias" />
      </div>

      <div className="campo-linha">
        <Campo {...p} campo="limiteAtual" rotulo="Limite Atual" mono />
        <Campo {...p} campo="limiteSolicitado" rotulo="Limite Solicitado" obrigatorio placeholder="2.000 MIL" />
      </div>

      <Campo {...p} campo="valorVenda" rotulo="Valor da Venda" placeholder="1.000 REAIS" />

      <div className="campo-linha">
        <Campo {...p} campo="qtdItens" rotulo="Qtd Itens" mono inputMode="numeric" />
        <Campo {...p} campo="qtdItensMix" rotulo="Qtd Itens MIX" mono inputMode="numeric" />
      </div>
      <div className="campo-linha">
        <Campo {...p} campo="qtdItensFoco" rotulo="Qtd Itens Foco" mono inputMode="numeric" />
        <Campo {...p} campo="qtdItensValidade" rotulo="Qtd Itens Validade" mono inputMode="numeric" />
      </div>

      <label className="campo">
        <span className="campo-rotulo">Possui Histórico de Atraso</span>
        <select className="campo-input" value={dados.historicoAtraso} onChange={alterar("historicoAtraso")}>
          <option value="NÃO">NÃO</option>
          <option value="SIM">SIM</option>
        </select>
      </label>

      <label className="campo">
        <span className="campo-rotulo">Motivo *</span>
        <textarea className="campo-input" rows={4} value={dados.motivo} onChange={alterar("motivo")} />
        {erros.motivo ? <span className="campo-erro">{erros.motivo}</span> : null}
      </label>

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