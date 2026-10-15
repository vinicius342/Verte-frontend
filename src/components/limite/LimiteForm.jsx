import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import ClienteAutocomplete from "../common/ClienteAutocomplete";
import { listarClientes } from "../../services/clientService";
import { buscarConfiguracao } from "../../services/configService";
import { useAuth } from "../../hooks/useAuth";

const VAZIO = {
  clienteId: "",
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

function normalizarNome(texto) {
  return (texto ?? "").toString().trim().toLowerCase();
}

function localizarClienteInicial(limiteExistente, clientes) {
  if (!limiteExistente) return null;

  if (limiteExistente.clienteId) {
    return clientes.find((cliente) => cliente.id === limiteExistente.clienteId) ?? null;
  }

  const nomeLimite = normalizarNome(limiteExistente.razaoSocial);
  if (!nomeLimite) return null;

  return clientes.find((cliente) => normalizarNome(cliente.nomeCliente) === nomeLimite) ?? null;
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

export default function LimiteForm({ onSalvar, onCancelar, onFecharFormulario, limiteExistente }) {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const [dados, setDados] = useState(() => dadosIniciais(limiteExistente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [clienteInicialAplicado, setClienteInicialAplicado] = useState(false);
  const [erroClienteNaoCadastrado, setErroClienteNaoCadastrado] = useState("");

  useEffect(() => {
    if (!uid) return undefined;

    let ativo = true;
    buscarConfiguracao(uid)
      .then((config) => {
        if (!ativo || !config) return;
        setDados((atual) => ({
          ...atual,
          rota: atual.rota?.trim() ? atual.rota : config.codigoVendedor ?? "",
        }));
      })
      .catch((erro) => {
        console.error("Falha ao carregar configuração do usuário:", erro);
      });

    return () => {
      ativo = false;
    };
  }, [uid]);

  useEffect(() => {
    setDados(dadosIniciais(limiteExistente));
    setErros({});
    setErroGeral(null);
    setErroClienteNaoCadastrado("");
    setClienteInicialAplicado(false);
  }, [limiteExistente]);

  useEffect(() => {
    let ativo = true;
    listarClientes()
      .then((lista) => {
        if (!ativo) return;
        setClientes(lista);
      })
      .catch((erro) => {
        console.error("Falha ao carregar clientes:", erro);
        if (ativo) setClientes([]);
      })
      .finally(() => {
        if (ativo) setCarregandoClientes(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (carregandoClientes || clienteInicialAplicado) return;

    const clienteInicial = localizarClienteInicial(limiteExistente, clientes);
    if (clienteInicial) {
      setDados((atual) => ({ ...atual, clienteId: clienteInicial.id }));
    }

    setClienteInicialAplicado(true);
  }, [carregandoClientes, clienteInicialAplicado, clientes, limiteExistente]);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === dados.clienteId) ?? null,
    [clientes, dados.clienteId],
  );

  const codPdvEfetivo = clienteSelecionado?.codPdv?.trim() || dados.codPdv?.trim();
  const clienteValidoParaSalvar = Boolean(dados.clienteId) && Boolean(clienteSelecionado);

  function alterar(campo) {
    return (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));
  }

  function alterarCliente(valor) {
    setDados((atual) => {
      const limpandoSelecao = Boolean(atual.clienteId) && valor !== atual.razaoSocial;
      return {
        ...atual,
        razaoSocial: valor,
        ...(limpandoSelecao ? { clienteId: "", codPdv: "", fantasia: "" } : {}),
      };
    });
    setErroClienteNaoCadastrado("");
  }

  function selecionarCliente(cliente) {
    setDados((atual) => ({
      ...atual,
      clienteId: cliente.id,
      razaoSocial: cliente.nomeCliente ?? "",
      codPdv: cliente.codPdv ?? "",
      fantasia: cliente.nomeComercio ?? "",
      seguimento: cliente.seguimento ?? cliente.segmento ?? "",
      responsavel: cliente.responsavel ?? "",
      telefones: [cliente.whatsapp, cliente.whatsapp2, cliente.whatsapp3].filter(Boolean).length
        ? [cliente.whatsapp, cliente.whatsapp2, cliente.whatsapp3].filter(Boolean)
        : [""],
    }));
    setErroClienteNaoCadastrado("");
  }

  function irParaCliente(estado) {
    const fechar = onFecharFormulario ?? onCancelar;
    fechar?.();
    navigate("/", { replace: true, state: estado });
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
    if (!dados.limiteSolicitado?.trim()) novosErros.limiteSolicitado = "Informe o limite solicitado.";
    if (!dados.motivo?.trim()) novosErros.motivo = "Informe o motivo.";

    if (!clienteValidoParaSalvar) {
      setErroClienteNaoCadastrado("Cliente não cadastrado. Cadastre o cliente para continuar.");
      setErros(novosErros);
      return;
    }

    if (!codPdvEfetivo?.trim()) {
      setErros(novosErros);
      return;
    }

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

  const podeSalvarCliente = clienteValidoParaSalvar && Boolean(codPdvEfetivo?.trim());

  const p = { dados, erros, alterar };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <ClienteAutocomplete
        valor={dados.razaoSocial}
        clienteId={dados.clienteId}
        clientes={clientes}
        loading={carregandoClientes}
        onDigitar={alterarCliente}
        onSelecionar={selecionarCliente}
        camposObrigatorios={["codPdv"]}
        onIrParaCliente={irParaCliente}
        erro={erroClienteNaoCadastrado}
      />

      <Campo {...p} campo="codPdv" rotulo="Cód PDV" mono readOnly />
      <Campo {...p} campo="fantasia" rotulo="Fantasia" readOnly />
      <Campo {...p} campo="seguimento" rotulo="Seguimento" placeholder="Ex. Subdistribuidor" />
      <Campo {...p} campo="responsavel" rotulo="Responsável" placeholder="Ex. Sr Joelio" />

      <div className="campo campo-telefones">
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
        <Campo {...p} campo="rota" rotulo="Rota" obrigatorio mono inputMode="numeric" />
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
        <Button type="submit" disabled={enviando || !podeSalvarCliente}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}