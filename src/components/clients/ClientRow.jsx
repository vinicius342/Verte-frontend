export default function ClientRow({ cliente, onSelecionar }) {
  return (
    <li className="linha-cliente">
      <button type="button" className="linha-botao" onClick={() => onSelecionar(cliente)}>
        <span className="linha-pino" aria-hidden>
          ⚲
        </span>
        <span className="linha-texto">
          <span className="linha-nome-linha">
            <span className="linha-nome">{cliente.nomeCliente}</span>
            {cliente.cadastroIncompleto ? (
              <span className="selo-confirmacao selo-confirmacao--pendente">Cadastro incompleto</span>
            ) : null}
          </span>
          {cliente.nomeComercio ? <span className="linha-comercio">{cliente.nomeComercio}</span> : null}
          {cliente.rua ? (
            <span className="linha-endereco">
              {cliente.rua}
              {cliente.numero ? `, ${cliente.numero}` : ""}
            </span>
          ) : null}
        </span>
        <span className="linha-seta" aria-hidden>
          →
        </span>
      </button>
    </li>
  );
}
