import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDadosUsuario } from "../../hooks/useFotoPerfil";
import { logout } from "../../services/authService";
import Avatar from "../common/Avatar";
import ClientSearchBar from "../clients/ClientSearchBar";

export default function Header({ busca, onBuscar, onAbrirMenu }) {
  const { usuario, nome: nomeAuth } = useAuth();
  const { nome: nomeCadastro, fotoUrl } = useDadosUsuario();
  const nome = nomeCadastro ?? nomeAuth;
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const usuarioRef = useRef(null);

  // Fecha o dropdown ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!menuAberto) return;

    function aoClicarFora(e) {
      if (usuarioRef.current && !usuarioRef.current.contains(e.target)) setMenuAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === "Escape") setMenuAberto(false);
    }

    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [menuAberto]);

  function irPara(caminho) {
    setMenuAberto(false);
    navigate(caminho);
  }

  async function sair() {
    setMenuAberto(false);
    await logout();
    navigate("/");
  }

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

          {usuario && (
            <div className="cabecalho-usuario" ref={usuarioRef}>
              <button
                type="button"
                className="cabecalho-avatar"
                aria-label="Menu do usuário"
                aria-expanded={menuAberto}
                aria-controls="cabecalho-menu-usuario"
                onClick={() => setMenuAberto((aberto) => !aberto)}
              >
                <Avatar nome={nome} fotoUrl={fotoUrl} />
              </button>

              {menuAberto && (
                <div id="cabecalho-menu-usuario" className="cabecalho-usuario-menu">
                  <button type="button" className="sidebar-item sidebar-item-menu" onClick={() => irPara("/perfil")}>
                    <svg
                      className="sidebar-icone"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Meu perfil</span>
                  </button>
                  <button type="button" className="sidebar-item sidebar-item-menu sidebar-sair" onClick={sair}>
                    <svg
                      className="sidebar-icone"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {onBuscar ? <ClientSearchBar valor={busca} onChange={onBuscar} /> : null}
      </div>
    </header>
  );
}
