import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/authService";

export default function Sidebar({ aberta, onFechar, onAdicionar }) {
  const { usuario, nome } = useAuth();
  const navigate = useNavigate();

  async function sair() {
    await logout();
    onFechar();
    navigate("/");
  }

  return (
    <>
      <div className={`overlay ${aberta ? "overlay-visivel" : ""}`} onClick={onFechar} role="presentation" />
      <aside className={`sidebar ${aberta ? "sidebar-aberta" : ""}`} aria-hidden={!aberta}>
        <div className="sidebar-cabecalho">
          <span className="sidebar-titulo">Menu</span>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar menu">
            ✕
          </button>
        </div>

        {usuario ? (
          <>
            <p className="sidebar-usuario">{nome}</p>
            {onAdicionar ? (
              <button
                type="button"
                className="sidebar-item"
                onClick={() => {
                  onFechar();
                  onAdicionar();
                }}
              >
                Adicionar nova localização
              </button>
            ) : null}
            <button
              type="button"
              className="sidebar-item"
              onClick={() => {
                onFechar();
                navigate("/configuracoes");
              }}
            >
              Configurações
            </button>
            <button type="button" className="sidebar-item sidebar-sair" onClick={sair}>
              Sair
            </button>
          </>
        ) : (
          <button
            type="button"
            className="sidebar-item"
            onClick={() => {
              onFechar();
              navigate("/login");
            }}
          >
            Entrar
          </button>
        )}
      </aside>
    </>
  );
}
