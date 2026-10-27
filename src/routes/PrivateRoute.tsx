import { Navigate, Outlet } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";
import { logout } from "../services/authService";

export default function PrivateRoute(): JSX.Element {
  const { uid, revendedoraId, loading } = useAuth();

  if (loading) return <Carregando cheia />;
  if (!uid) return <Navigate to="/login" replace />;

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

  return <Outlet />;
}
