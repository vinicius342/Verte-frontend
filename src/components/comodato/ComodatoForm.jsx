import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import ClienteAutocomplete from "../common/ClienteAutocomplete";
import { buscarConfiguracao } from "../../services/configService";
import { listarClientes } from "../../services/clientService";
import { useAuth } from "../../hooks/useAuth";
import AtivoAutocomplete from "../ativo/AtivoAutoComplete";
import { listarAtivos } from "../../services/ativoService";

function linhaVazia() {
  return { ativoId: "", codMaterial: "", descricao: "", quantidade: "" };
}

function materiaisIniciais(comodatoExistente) {
  const materiais = comodatoExistente?.materiais ?? [];
  if (materiais.length === 0) return [linhaVazia(), linhaVazia()];

  return materiais.map((material) => ({
    ativoId: "",
    codMaterial: material.codMaterial ?? "",
    descricao: material.descricao ?? "",
    quantidade: material.quantidade ?? "",
  }));
}


function dadosIniciais(comodatoExistente) {
  return {
    clienteId: comodatoExistente?.clienteId ?? "",
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

function normalizarTexto(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function localizarClienteInicial(comodatoExistente, clientes) {
  if (!comodatoExistente) return null;

  if (comodatoExistente.clienteId) {
    return clientes.find((cliente) => cliente.id === comodatoExistente.clienteId) ?? null;
  }

  const nomeComodato = normalizarTexto(comodatoExistente.razaoSocial).trim();
  if (!nomeComodato) return null;

  return clientes.find((cliente) => normalizarTexto(cliente.nomeCliente).trim() === nomeComodato) ?? null;
}

function aplicarClienteSelecionado(atual, cliente) {
  return {
    ...atual,
    clienteId: cliente.id,
    razaoSocial: cliente.nomeCliente ?? "",
    codPdv: cliente.codPdv ?? "",
    cpf: cliente.cpf ?? "",
  };
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
  const navigate = useNavigate();
  const clienteRef = useRef(null);
  const codPdvRef = useRef(null);
  const cpfRef = useRef(null);
  const revendaRef = useRef(null);
  const supervisorRef = useRef(null);
  const vendedorRef = useRef(null);
  const materiaisRef = useRef(null);
  const [dados, setDados] = useState(() => dadosIniciais(comodatoExistente));
  const [materiais, setMateriais] = useState(() => materiaisIniciais(comodatoExistente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [carregandoConfig, setCarregandoConfig] = useState(true);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [erroClienteNaoCadastrado, setErroClienteNaoCadastrado] = useState("");
  const [clienteInicialAplicado, setClienteInicialAplicado] = useState(false);
  const [ativos, setAtivos] = useState([]);
  const [carregandoAtivos, setCarregandoAtivos] = useState(true);
  const [ativosIniciaisAplicados, setAtivosIniciaisAplicados] = useState(false);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarAtivos()
      .then((lista) => ativo && setAtivos(lista))
      .catch((erro) => {
        console.error("Falha ao carregar ativos:", erro);
        if (ativo) setAtivos([]);
      })
      .finally(() => ativo && setCarregandoAtivos(false));
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (carregandoAtivos || ativosIniciaisAplicados) return;

    setMateriais((atual) =>
      atual.map((linha) => {
        const codigo = normalizarTexto(linha.codMaterial).trim();
        if (linha.ativoId || !codigo) return linha;
        const encontrado = ativos.find((a) => normalizarTexto(a.codigo).trim() === codigo);
        return encontrado ? { ...linha, ativoId: encontrado.id } : linha;
      }),
    );
    setAtivosIniciaisAplicados(true);
  }, [carregandoAtivos, ativosIniciaisAplicados, ativos]);

  useEffect(() => {
    setDados(dadosIniciais(comodatoExistente));
    setMateriais(materiaisIniciais(comodatoExistente));
    setErros({});
    setErroGeral(null);
    setErroClienteNaoCadastrado("");
    setClienteInicialAplicado(false);
    setAtivosIniciaisAplicados(false);
    setTentouEnviar(false);
  }, [comodatoExistente]);

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

    const clienteEncontrado = localizarClienteInicial(comodatoExistente, clientes);
    if (clienteEncontrado) {
      setDados((atual) => aplicarClienteSelecionado(atual, clienteEncontrado));
      setErroClienteNaoCadastrado("");
    } else if (comodatoExistente?.razaoSocial) {
      setDados((atual) => ({
        ...atual,
        clienteId: "",
        razaoSocial: comodatoExistente.razaoSocial ?? "",
        codPdv: "",
        cpf: "",
      }));
    }

    setClienteInicialAplicado(true);
  }, [carregandoClientes, clienteInicialAplicado, clientes, comodatoExistente]);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === dados.clienteId) ?? null,
    [clientes, dados.clienteId],
  );

  const camposClienteAusentes = clienteSelecionado
    ? [!clienteSelecionado.codPdv?.trim() ? "Cód PDV" : null, !clienteSelecionado.cpf?.trim() ? "CPF/CNPJ" : null].filter(Boolean)
    : [];
  const clienteSelecionadoIncompleto = camposClienteAusentes.length > 0;

  function digitarMaterial(indice, campo, valor) {
    const outro = campo === "codMaterial" ? "descricao" : "codMaterial";
    setMateriais((atual) =>
      atual.map((linha, i) =>
        i !== indice
          ? linha
          : {
            ...linha,
            [campo]: valor,
            // igual ao cliente: mexer num ativo já selecionado desfaz a seleção
            ...(linha.ativoId ? { ativoId: "", [outro]: "" } : {}),
          },
      ),
    );
  }

  function selecionarMaterial(indice, ativo) {
    setMateriais((atual) =>
      atual.map((linha, i) =>
        i === indice
          ? { ...linha, ativoId: ativo.id, codMaterial: ativo.codigo ?? "", descricao: ativo.material ?? "" }
          : linha,
      ),
    );
  }

  function irParaAtivos(linha) {
    onCancelar?.();
    navigate("/ativos", {
      replace: true,
      state: { novoAtivo: { codigo: linha.codMaterial, material: linha.descricao } },
    });
  }

  function rolarParaPrimeiroErro(novosErros, temErroCliente) {
    const ordem = [
      temErroCliente ? clienteRef : null,
      temErroCliente ? codPdvRef : null,
      temErroCliente ? cpfRef : null,
      novosErros.revenda ? revendaRef : null,
      novosErros.supervisor ? supervisorRef : null,
      novosErros.vendedor ? vendedorRef : null,
      novosErros.materiais ? materiaisRef : null,
    ].filter(Boolean);

    if (!ordem.length) return;
    window.requestAnimationFrame(() => {
      ordem[0].current?.scrollIntoView({ behavior: "smooth", block: "center" });
      ordem[0].current?.focus?.();
    });
  }

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
      const valor = e.target.value;
      setDados((atual) => ({ ...atual, [campo]: valor }));
    };
  }

  function alterarCliente(valor) {
    setDados((atual) => {
      const limpandoSelecao = Boolean(atual.clienteId) && valor !== atual.razaoSocial;
      return {
        ...atual,
        razaoSocial: valor,
        ...(limpandoSelecao ? { clienteId: "", codPdv: "", cpf: "" } : {}),
      };
    });
    setErroClienteNaoCadastrado("");
  }

  function selecionarCliente(cliente) {
    setDados((atual) => aplicarClienteSelecionado(atual, cliente));
    setErroClienteNaoCadastrado("");
  }

  function irParaCliente(estado) {
    onCancelar?.();
    navigate("/", { replace: true, state: estado });
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
    const temErroCliente = !dados.clienteId || !clienteSelecionado || clienteSelecionadoIncompleto;

    if (!dados.clienteId || !clienteSelecionado) {
      const mensagem = "Cliente não cadastrado. Cadastre o cliente para continuar.";
      setErroClienteNaoCadastrado(mensagem);
      setErros(novosErros);
      rolarParaPrimeiroErro(novosErros, true);
      return;
    }

    if (clienteSelecionadoIncompleto) {
      setErros(novosErros);
      rolarParaPrimeiroErro(novosErros, true);
      return;
    }

    const materiaisPreenchidos = materiais.filter((m) => m.descricao?.trim() || m.codMaterial?.trim());
    if (materiaisPreenchidos.length === 0) novosErros.materiais = "Adicione ao menos um material.";

    setTentouEnviar(true);

    const idsCadastrados = new Set(ativos.map((a) => a.id));
    if (materiaisPreenchidos.some((m) => !idsCadastrados.has(m.ativoId))) {
      novosErros.materiais = "Há materiais não cadastrados. Cadastre o ativo para continuar.";
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      rolarParaPrimeiroErro(novosErros, temErroCliente);
      return;
    }

    setEnviando(true);
    setErroGeral(null);
    try {
      await onSalvar({
        ...dados,
        materiais: materiaisPreenchidos.map(({ codMaterial, descricao, quantidade }) => ({ codMaterial, descricao, quantidade })),
      });
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
      <ClienteAutocomplete
        ref={clienteRef}
        valor={dados.razaoSocial}
        clienteId={dados.clienteId}
        clientes={clientes}
        loading={carregandoClientes}
        onDigitar={alterarCliente}
        onSelecionar={selecionarCliente}
        camposObrigatorios={["codPdv", "cpf"]}
        onIrParaCliente={irParaCliente}
        erro={erroClienteNaoCadastrado}
      />

      <label className="campo">
        <span className="campo-rotulo">Cód PDV</span>
        <input ref={codPdvRef} className="campo-input mono" value={dados.codPdv} readOnly />
      </label>

      <label className="campo">
        <span className="campo-rotulo">CPF/CNPJ</span>
        <input ref={cpfRef} className="campo-input mono" value={dados.cpf} readOnly inputMode="numeric" />
      </label>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Revenda</span>
          <input ref={revendaRef} className="campo-input" value={dados.revenda} onChange={alterar("revenda")} />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Supervisor</span>
          <input ref={supervisorRef} className="campo-input" value={dados.supervisor} onChange={alterar("supervisor")} />
        </label>
      </div>

      <label className="campo">
        <span className="campo-rotulo">Vendedor</span>
        <input ref={vendedorRef} className="campo-input" value={dados.vendedor} onChange={alterar("vendedor")} />
      </label>

      <div className="campo" ref={materiaisRef}>
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
                <div className="comodato-campo-mobile">
                  <span className="comodato-rotulo-mobile">Cód. material</span>
                  <AtivoAutocomplete
                    campo="codigo"
                    mono
                    placeholder="Ex. 0042"
                    valor={linha.codMaterial}
                    selecionado={Boolean(linha.ativoId)}
                    ativos={ativos}
                    loading={carregandoAtivos}
                    erro={tentouEnviar}
                    onDigitar={(v) => digitarMaterial(indice, "codMaterial", v)}
                    onSelecionar={(ativo) => selecionarMaterial(indice, ativo)}
                    onIrParaAtivos={() => irParaAtivos(linha)}
                  />
                </div>
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

              <div className="comodato-campo-mobile">
                <span className="comodato-rotulo-mobile">Descrição</span>
                <AtivoAutocomplete
                  campo="material"
                  placeholder="Detalhe do material"
                  valor={linha.descricao}
                  selecionado={Boolean(linha.ativoId)}
                  ativos={ativos}
                  loading={carregandoAtivos}
                  erro={tentouEnviar}
                  onDigitar={(v) => digitarMaterial(indice, "descricao", v)}
                  onSelecionar={(ativo) => selecionarMaterial(indice, ativo)}
                  onIrParaAtivos={() => irParaAtivos(linha)}
                />
              </div>
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
        <Button
          type="submit"
          disabled={enviando || carregandoClientes || clienteSelecionadoIncompleto || (Boolean(dados.clienteId) && !clienteSelecionado)}
        >
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}