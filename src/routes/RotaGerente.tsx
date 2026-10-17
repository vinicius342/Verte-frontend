import { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RotaGerente(): JSX.Element | null {
  const { podeConfigurar, loading } = useAuth();

  if (loading) return null; // espera o papel carregar antes de decidir
  return podeConfigurar ? <Outlet /> : <Navigate to="/" replace />;
}