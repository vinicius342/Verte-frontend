import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import Carregando from "../common/Carregando";
import ClienteAutocomplete from "../common/ClienteAutocomplete";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";
import { listarClientes } from "../../services/clientService";
import { buscarUsuario } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import AtivoAutocomplete from "../ativo/AtivoAutoComplete";
import { listarAtivos } from "../../services/ativoService";
import { usePerfil } from "../../hooks/usePerfil";

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

export default function ComodatoForm({ onSalvar, onCancelar, comodatoExistente }) {
  const navigate = useNavigate();
  const clienteRef = useRef(null);
  const codPdvRef = useRef(null);
  const cpfRef = useRef(null);
  const revendaRef = useRef(null);
  const materiaisRef = useRef(null);
  const [dados, setDados] = useState(() => dadosIniciais(comodatoExistente));
  const [materiais, setMateriais] = useState(() => materiaisIniciais(comodatoExistente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const { revendedoraId, papel, uid, nome } = useAuth();
  const { revendedora, loading: carregandoRevendedora } = useConfiguracoes();
  const {
    perfil,
    supervisor: supervisorVinculado,
    supervisorErro,
    temGerente,
    loading: carregandoPerfil,
  } = usePerfil();
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [usuarioSupervisor, setUsuarioSupervisor] = useState(null);
  const [usuarioSupervisorCarregado, setUsuarioSupervisorCarregado] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [erroClienteNaoCadastrado, setErroClienteNaoCadastrado] = useState("");
  const [clienteInicialAplicado, setClienteInicialAplicado] = useState(false);
  const [ativos, setAtivos] = useState([]);
  const [carregandoAtivos, setCarregandoAtivos] = useState(true);
  const [ativosIniciaisAplicados, setAtivosIniciaisAplicados] = useState(false);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const carregandoUsuarioSupervisor = papel === "supervisor" && Boolean(uid) && !usuarioSupervisorCarregado;
  const carregandoConfig = carregandoRevendedora || carregandoPerfil || carregandoUsuarioSupervisor;

  const ocultarVendedor = papel === "vendedor";
  const ocultarSupervisor = papel === "supervisor" || papel === "vendedor";
  const semSupervisor = papel === "vendedor" && !supervisorVinculado;
  const mensagemSemSupervisor = supervisorErro
    ? "Não foi possível carregar o seu supervisor. Tente novamente."
    : "Você não tem supervisor vinculado. Peça a um gerente ou administrador para vincular um supervisor ao seu usuário.";
  const semGerente = papel === "vendedor" && !temGerente;
  const mensagemSemGerente =
    "Você não tem gerente vinculado. Peça a um administrador para vincular um gerente ao seu usuário.";

  useEffect(() => {
    let ativo = true;

    if (papel !== "supervisor" || !uid) {
      setUsuarioSupervisor(null);
      setUsuarioSupervisorCarregado(true);
      return () => {
        ativo = false;
      };
    }

    setUsuarioSupervisorCarregado(false);
    buscarUsuario(uid)
      .then((usuario) => {
        if (ativo) setUsuarioSupervisor(usuario);
      })
      .catch((erro) => {
        console.error("Falha ao carregar usuário supervisor:", erro);
        if (ativo) setUsuarioSupervisor(null);
      })
      .finally(() => {
        if (ativo) setUsuarioSupervisorCarregado(true);
      });

    return () => {
      ativo = false;
    };
  }, [papel, uid]);

  useEffect(() => {
    let ativo = true;
    listarAtivos(revendedoraId)
      .then((lista) => ativo && setAtivos(lista))
      .catch((erro) => {
        console.error("Falha ao carregar ativos:", erro);
        if (ativo) setAtivos([]);
      })
      .finally(() => ativo && setCarregandoAtivos(false));
    return () => {
      ativo = false;
    };
  }, [revendedoraId]);

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
    listarClientes(revendedoraId)
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
  }, [revendedoraId]);

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

  function preencherComConfiguracao(atual, perfil, revendedora, papel, usuarioSupervisor) {
    if (comodatoExistente) {
      return {
        ...atual,
        revenda: atual.revenda?.trim() ? atual.revenda : revendedora?.codigoRevenda ?? "",
      };
    }

    const p = perfil ?? {};
    const ehVendedor = papel === "vendedor";
    const ehSupervisor = papel === "supervisor";

    const vendedores = ehVendedor ? [p.vendedor, p.vendedorCodigo].filter(Boolean).join(" ") : "";
    const supervisores = ehVendedor ? [p.supervisor, p.supervisorCodigo].filter(Boolean).join(" ") : "";
    const nomeSupervisor = usuarioSupervisor?.nome ?? nome;
    const codigoSupervisor = usuarioSupervisor?.codigo ?? "";
    const supervisorAtual = ehSupervisor
      ? [nomeSupervisor, codigoSupervisor].filter(Boolean).join(" ")
      : supervisores;

    return {
      ...atual,
      revenda: atual.revenda?.trim() ? atual.revenda : revendedora?.codigoRevenda ?? "",
      vendedor: atual.vendedor?.trim() ? atual.vendedor : vendedores,
      vendedorCodigo: atual.vendedorCodigo?.trim() ? atual.vendedorCodigo : ehVendedor ? p.vendedorCodigo ?? "" : "",
      supervisor: atual.supervisor?.trim() ? atual.supervisor : supervisorAtual,
      supervisorCodigo: atual.supervisorCodigo?.trim()
        ? atual.supervisorCodigo
        : ehSupervisor
          ? codigoSupervisor
          : ehVendedor
            ? p.supervisorCodigo ?? ""
            : "",
    };
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
      novosErros.materiais ? materiaisRef : null,
    ].filter(Boolean);

    if (!ordem.length) return;
    window.requestAnimationFrame(() => {
      ordem[0].current?.scrollIntoView({ behavior: "smooth", block: "center" });
      ordem[0].current?.focus?.();
    });
  }

  useEffect(() => {
    if (carregandoConfig || (!perfil && !revendedora && papel !== "supervisor")) return;
    setDados((atual) => preencherComConfiguracao(atual, perfil, revendedora, papel, usuarioSupervisor));
  }, [carregandoConfig, perfil, revendedora, papel, usuarioSupervisor, nome]);

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
    if (semSupervisor) {
      setErroGeral(mensagemSemSupervisor);
      return;
    }
    if (semGerente) {
      setErroGeral(mensagemSemGerente);
      return;
    }
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

    if (!dados.revenda?.trim()) {
      novosErros.revenda = "Revenda não informada. Configure o código da revenda em Configurações para continuar.";
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
        clienteId: dados.clienteId,
        revenda: dados.revenda,
        codPdv: dados.codPdv,
        razaoSocial: dados.razaoSocial,
        cpf: dados.cpf,
        materiais: materiaisPreenchidos.map(({ codMaterial, descricao, quantidade }) => ({ codMaterial, descricao, quantidade })),
      });
    } catch (erro) {
      setErroGeral(erro?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoConfig || carregandoClientes || carregandoAtivos) {
    return <Carregando escala={0.6} />;
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
        <div className="campo" ref={revendaRef}>
          <span className="campo-rotulo">Revenda</span>
          <span className="campo-valor">{dados.revenda || "—"}</span>
          {erros.revenda ? <span className="campo-erro">{erros.revenda}</span> : null}
        </div>
        <div className="campo">
          <span className="campo-rotulo">Supervisor</span>
          <span className="campo-valor">{dados.supervisor || "—"}</span>
        </div>
      </div>

      <div className="campo">
        <span className="campo-rotulo">Vendedor</span>
        <span className="campo-valor">{dados.vendedor || "—"}</span>
      </div>

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

              <div className="comodato-campo-mobile">
                <span className="comodato-rotulo-mobile">Nome do material</span>
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

            </div>
          ))}
        </div>

        {erros.materiais ? <span className="campo-erro">{erros.materiais}</span> : null}
        <Button type="button" variant="ghost" onClick={adicionarLinha}>
          + Adicionar material
        </Button>
      </div>

      {semSupervisor ? <p className="estado-erro">{mensagemSemSupervisor}</p> : null}
      {semGerente ? <p className="estado-erro">{mensagemSemGerente}</p> : null}
      {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

      <div className="formulario-acoes">
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            enviando ||
            carregandoClientes ||
            semSupervisor ||
            semGerente ||
            clienteSelecionadoIncompleto ||
            (Boolean(dados.clienteId) && !clienteSelecionado)
          }
        >
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
