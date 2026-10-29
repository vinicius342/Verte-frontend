import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";

export default function AssinaturaPendenteModal() {
  const navigate = useNavigate();
  const botaoPrincipalRef = useRef(null);

  useEffect(() => {
    botaoPrincipalRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal-painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assinatura-pendente-titulo"
        aria-describedby="assinatura-pendente-texto"
      >
        <div className="modal-cabecalho">
          <h2 className="modal-titulo" id="assinatura-pendente-titulo">
            Falta configurar seu perfil
          </h2>
        </div>
        <div className="modal-corpo">
          <p id="assinatura-pendente-texto">
            Para usar o sistema, você precisa cadastrar a sua assinatura no seu perfil.
          </p>
          <div className="assinatura-pendente-acoes">
            <button
              ref={botaoPrincipalRef}
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/perfil")}
            >
              Ir para meu perfil
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => logout()}>
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
