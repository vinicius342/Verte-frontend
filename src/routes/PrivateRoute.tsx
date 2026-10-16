import { Navigate, Outlet } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute(): JSX.Element {
  const { uid, revendedoraId, loading } = useAuth();

  if (loading) return <></>;
  if (!uid) return <Navigate to="/login" replace />;
  if (!revendedoraId) {
    return <p>Seu usuário não está vinculado a nenhuma revendedora. Fale com o administrador.</p>;
  }

  return <Outlet />;
}