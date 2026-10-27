import { forwardRef, useMemo, useState } from "react";
import Button from "./Button";
import Carregando from "./Carregando";

function normalizarTexto(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const ROTULOS_CAMPOS = {
  codPdv: "Cód PDV",
  cpf: "CPF/CNPJ",
};

function rotuloCampo(campo) {
  return ROTULOS_CAMPOS[campo] ?? campo;
}

function formatarCamposObrigatorios(campos) {
  return campos.map(rotuloCampo).join(" / ");
}

const ClienteAutocomplete = forwardRef(function ClienteAutocomplete(
  { valor, clienteId, clientes = [], loading, onDigitar, onSelecionar, camposObrigatorios = [], onIrParaCliente, erro },
  ref,
) {
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId) ?? null,
    [clientes, clienteId],
  );

  const camposClienteAusentes = useMemo(() => {
    if (!clienteSelecionado) return [];

    return camposObrigatorios
      .map((campo) => (clienteSelecionado?.[campo]?.toString().trim() ? null : rotuloCampo(campo)))
      .filter(Boolean);
  }, [camposObrigatorios, clienteSelecionado]);

  const clienteSelecionadoIncompleto = camposClienteAusentes.length > 0;
  const mensagemClienteIncompleto = clienteSelecionadoIncompleto
    ? `Este cliente está sem ${formatarCamposObrigatorios(camposClienteAusentes)}. Atualize o cadastro para continuar.`
    : "";

  const sugestoesCliente = useMemo(() => {
    const termo = normalizarTexto(valor).trim();
    if (!termo) return [];

    return clientes.filter((cliente) => normalizarTexto(cliente.nomeCliente).includes(termo)).slice(0, 8);
  }, [clientes, valor]);

  function digitar(texto) {
    onDigitar?.(texto);
    setDropdownAberto(true);
  }

  function selecionar(cliente) {
    onSelecionar?.(cliente);
    setDropdownAberto(false);
  }

  function irParaCliente(estado) {
    onIrParaCliente?.(estado);
  }

  return (
    <label className="campo comodato-autocomplete">
      <span className="campo-rotulo">Cliente *</span>
      <input
        ref={ref}
        className="campo-input"
        value={valor}
        onChange={(e) => digitar(e.target.value)}
        onFocus={() => setDropdownAberto(true)}
        onBlur={() => {
          window.setTimeout(() => setDropdownAberto(false), 0);
        }}
        autoComplete="off"
      />
      {loading ? <Carregando escala={0.6} /> : null}
      {!loading && dropdownAberto && sugestoesCliente.length > 0 ? (
        <div className="comodato-autocomplete-dropdown" role="listbox">
          {sugestoesCliente.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              className="comodato-autocomplete-item"
              onMouseDown={(event) => {
                event.preventDefault();
                selecionar(cliente);
              }}
            >
              <span className="comodato-autocomplete-nome">{cliente.nomeCliente}</span>
              {cliente.nomeComercio ? (
                <span className="comodato-autocomplete-comercio">{cliente.nomeComercio}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {erro ? (
        <div className="estado-erro comodato-alerta-cliente">
          <span>{erro}</span>
          <Button type="button" variant="secondary" onClick={() => irParaCliente({ novoCliente: valor })}>
            Cadastrar cliente
          </Button>
        </div>
      ) : null}

      {clienteSelecionadoIncompleto ? (
        <div className="estado-erro comodato-alerta-cliente">
          <span>{mensagemClienteIncompleto}</span>
          <Button type="button" variant="secondary" onClick={() => irParaCliente({ editarClienteId: clienteSelecionado.id })}>
            Atualizar cliente
          </Button>
        </div>
      ) : null}
    </label>
  );
});

export default ClienteAutocomplete;