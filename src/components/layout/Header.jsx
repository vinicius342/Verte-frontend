import { useAuth } from "../../hooks/useAuth";
import ClientSearchBar from "../clients/ClientSearchBar";
import NotificacaoSino from "./NotificacaoSino";

export default function Header({ busca, onBuscar, onAbrirMenu }) {
  const { papel } = useAuth();

  return (
    <header className="cabecalho">
      <div className="cabecalho-conteudo">
        <div className={`cabecalho-topo ${onBuscar ? "cabecalho-topo-com-busca" : ""}`}>
          <button type="button" className="menu-botao" onClick={onAbrirMenu} aria-label="Abrir menu">
            <span aria-hidden>☰</span>
          </button>

          <div className="marca">
            <span className="marca-pino marca-pino-icone" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span className="marca-nome">Verte</span>
          </div>

          {(papel === "supervisor" || papel === "gerente" || papel === "vendedor") && (
            <div className="cabecalho-usuario">
              <NotificacaoSino />
            </div>
          )}
        </div>

        {onBuscar ? <ClientSearchBar valor={busca} onChange={onBuscar} /> : null}
      </div>
    </header>
  );
}
