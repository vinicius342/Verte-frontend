import { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";

export default function RotaGerente(): JSX.Element | null {
  const { podeConfigurar, loading } = useAuth();

  if (loading) return <Carregando cheia />;
  return podeConfigurar ? <Outlet /> : <Navigate to="/" replace />;
}
