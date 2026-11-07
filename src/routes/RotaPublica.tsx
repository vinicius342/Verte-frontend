import { Navigate, Outlet } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";

export default function RotaPublica(): JSX.Element {
  const { usuario, loading } = useAuth();

  if (loading) return <Carregando cheia />;

  return usuario && !usuario.isAnonymous ? <Navigate to="/" replace /> : <Outlet />;
}
