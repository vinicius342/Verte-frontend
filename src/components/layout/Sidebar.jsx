import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDadosUsuario } from "../../hooks/useFotoPerfil";
import { logout } from "../../services/authService";
import Avatar from "../common/Avatar";

/* Ícones em SVG inline (traço estilo Lucide), sem depender de nenhuma biblioteca. */
function Icone({ children }) {
  return (
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
      {children}
    </svg>
  );
}

const icones = {
  pino: (
    <Icone>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Icone>
  ),
  inicio: (
    <Icone>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Icone>
  ),
  comodato: (
    <Icone>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </Icone>
  ),
  limite: (
    <Icone>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </Icone>
  ),
  ativos: (
    <Icone>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </Icone>
  ),
  usuarios: (
    <Icone>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icone>
  ),
  configuracoes: (
    <Icone>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Icone>
  ),
  perfil: (
    <Icone>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icone>
  ),
  sair: (
    <Icone>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icone>
  ),
  rota: (
    <Icone>
      <path d="M3 7h5l2 3h6l2-2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M5 17H3v-6h8" />
      <path d="M19 17h2v-4l-3-3" />
    </Icone>
  ),
  entrar: (
    <Icone>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </Icone>
  ),
  seta: (
    <Icone>
      <path d="m18 15-6-6-6 6" />
    </Icone>
  ),
};

/* Itens do menu principal. `restrito` = só aparece se podeConfigurar. */
const itensMenu = [
  { caminho: "/", rotulo: "Início", icone: icones.inicio },
  { caminho: "/rota-do-dia", rotulo: "Rota do dia", icone: icones.rota, soMotorista: true },
  { caminho: "/comodato", rotulo: "Comodato", icone: icones.comodato, ocultoMotorista: true },
  { caminho: "/limite", rotulo: "Solicitação de limites", icone: icones.limite, ocultoMotorista: true },
  { caminho: "/colaboradores", rotulo: "Colaboradores", icone: icones.usuarios },
  { caminho: "/ativos", rotulo: "Ativos", icone: icones.ativos, ocultoMotorista: true },
  { caminho: "/usuarios", rotulo: "Usuários", icone: icones.usuarios, restrito: true },
  { caminho: "/configuracoes", rotulo: "Configurações", icone: icones.configuracoes, restrito: true },
];

export default function Sidebar({ aberta, onFechar, onAdicionar }) {
  const { usuario, nome: nomeAuth, podeConfigurar, ehMotorista } = useAuth();
  const { nome: nomeCadastro, fotoUrl } = useDadosUsuario();
  const nome = nomeCadastro ?? nomeAuth;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);

  // Ao fechar a sidebar, o dropdown do usuário volta a ficar recolhido.
  useEffect(() => {
    if (!aberta) setMenuUsuarioAberto(false);
  }, [aberta]);

  async function sair() {
    await logout();
    onFechar();
    navigate("/");
  }

  function irPara(caminho) {
    onFechar();
    navigate(caminho);
  }

  function estaAtivo(caminho) {
    if (caminho === "/") return pathname === "/";
    return pathname === caminho || pathname.startsWith(`${caminho}/`);
  }

  return (
    <>
      <div className={`overlay ${aberta ? "overlay-visivel" : ""}`} onClick={onFechar} role="presentation" />
      <aside className={`sidebar ${aberta ? "sidebar-aberta" : ""}`} inert={!aberta}>
        <div className="sidebar-cabecalho">
          <div className="sidebar-marca">
            <span className="marca-pino sidebar-marca-pino" aria-hidden>
              {icones.pino}
            </span>
            <span className="marca-nome sidebar-marca-nome">Verte</span>
          </div>
        </div>

        {usuario ? (
          <>
            <nav className="sidebar-nav" aria-label="Menu principal">
              {itensMenu
                .filter((item) => {
                  if (item.restrito && !podeConfigurar) return false;
                  if (item.ocultoMotorista && ehMotorista) return false;
                  if (item.soMotorista && !ehMotorista) return false;
                  return true;
                })
                .map((item) => {
                  const ativo = estaAtivo(item.caminho);
                  return (
                    <button
                      key={item.caminho}
                      type="button"
                      className={`sidebar-item ${ativo ? "sidebar-item-ativo" : ""}`}
                      aria-current={ativo ? "page" : undefined}
                      onClick={() => irPara(item.caminho)}
                    >
                      {item.icone}
                      <span>{item.rotulo}</span>
                    </button>
                  );
                })}
            </nav>

            <div className="sidebar-usuario">
              {menuUsuarioAberto && (
                <div id="sidebar-menu-usuario" className="sidebar-menu-usuario">
                  <button type="button" className="sidebar-item sidebar-item-menu" onClick={() => irPara("/perfil")}>
                    {icones.perfil}
                    <span>Meu perfil</span>
                  </button>
                  <button type="button" className="sidebar-item sidebar-item-menu sidebar-sair" onClick={sair}>
                    {icones.sair}
                    <span>Sair</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                className="sidebar-rodape"
                aria-expanded={menuUsuarioAberto}
                aria-controls="sidebar-menu-usuario"
                onClick={() => setMenuUsuarioAberto((aberto) => !aberto)}
              >
                <span className="sidebar-avatar" aria-hidden>
                  <Avatar nome={nome} fotoUrl={fotoUrl} />
                </span>
                <span className="sidebar-rodape-texto">
                  <span className="sidebar-rodape-rotulo">Conectado como</span>
                  <span className="sidebar-rodape-nome">{nome}</span>
                </span>
                <span
                  className={`sidebar-rodape-seta ${menuUsuarioAberto ? "sidebar-rodape-seta-aberta" : ""}`}
                  aria-hidden
                >
                  {icones.seta}
                </span>
              </button>
            </div>
          </>
        ) : (
          <nav className="sidebar-nav" aria-label="Menu principal">
            <button type="button" className="sidebar-item" onClick={() => irPara("/login")}>
              {icones.entrar}
              <span>Entrar</span>
            </button>
          </nav>
        )}
      </aside>
    </>
  );
}
