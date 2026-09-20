import ClientSearchBar from "../clients/ClientSearchBar";

export default function Header({ busca, onBuscar, onAbrirMenu }) {
  return (
    <header className="cabecalho">
      <div className="cabecalho-topo">
        <button type="button" className="menu-botao" onClick={onAbrirMenu} aria-label="Abrir menu">
          <span aria-hidden>☰</span>
        </button>
        <div className="marca">
          <span className="marca-pino" aria-hidden>
            ⚲
          </span>
          <span className="marca-nome">Rota Certa</span>
        </div>
      </div>
      <ClientSearchBar valor={busca} onChange={onBuscar} />
    </header>
  );
}
