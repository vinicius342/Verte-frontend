import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";
import AvisoNotificacoes from "../components/common/AvisoNotificacoes";
import { logout } from "../services/authService";

export default function PrivateRoute(): JSX.Element {
  const { usuario, revendedoraId, loading, precisaConfigurarAssinatura } = useAuth();
  const location = useLocation();

  if (loading) return <Carregando cheia />;
  if (!usuario) return <Navigate to="/login" replace />;

  if (!revendedoraId) {
    return (
      <div style={{ padding: 24 }}>
        <p>Seu usuário não está vinculado a nenhuma revendedora. Fale com o administrador.</p>
        <button type="button" onClick={() => logout()}>
          Sair
        </button>
      </div>
    );
  }

  if (precisaConfigurarAssinatura && location.pathname !== "/perfil") {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <>
      <Outlet />
      <AvisoNotificacoes />
    </>
  );
}
