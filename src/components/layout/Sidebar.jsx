import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/authService";

export default function Sidebar({ aberta, onFechar, onAdicionar }) {
  const { usuario, nome, podeConfigurar } = useAuth();
  const navigate = useNavigate();

  async function sair() {
    await logout();
    onFechar();
    navigate("/");
  }

  function irPara(caminho) {
    onFechar();
    navigate(caminho);
  }

  return (
    <>
      <div className={`overlay ${aberta ? "overlay-visivel" : ""}`} onClick={onFechar} role="presentation" />
      <aside className={`sidebar ${aberta ? "sidebar-aberta" : ""}`} inert={!aberta}>
        <div className="sidebar-cabecalho">
          <div className="sidebar-marca">
            <span className="marca-pino sidebar-marca-pino" aria-hidden>
              ⚲
            </span>
            <span className="marca-nome sidebar-marca-nome">Verte</span>
          </div>
          {/* <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar menu">
            ✕
          </button> */}
        </div>

        {usuario ? (
          <>
            <button type="button" className="sidebar-item" onClick={() => irPara("/")}>
              Início
            </button>
            <button type="button" className="sidebar-item" onClick={() => irPara("/comodato")}>
              Comodato
            </button>
            <button type="button" className="sidebar-item" onClick={() => irPara("/limite")}>
              Solicitação de limites
            </button>
            <button type="button" className="sidebar-item" onClick={() => irPara("/ativos")}>
              Ativos
            </button>
            {podeConfigurar && (
              <button type="button" className="sidebar-item" onClick={() => irPara("/usuarios")}>
                Usuários
              </button>
            )}
            <button type="button" className="sidebar-item" onClick={() => irPara("/configuracoes")}>
              Configurações
            </button>
            <button type="button" className="sidebar-item sidebar-sair" onClick={sair}>
              Sair
            </button>

            <div className="sidebar-rodape">
              <span className="sidebar-rodape-rotulo">Conectado como</span>
              <span className="sidebar-rodape-nome">{nome}</span>
            </div>
          </>
        ) : (
          <button type="button" className="sidebar-item" onClick={() => irPara("/login")}>
            Entrar
          </button>
        )}
      </aside>
    </>
  );
}