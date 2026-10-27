import { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";

export default function RotaSemMotorista(): JSX.Element | null {
  const { ehMotorista, loading } = useAuth();

  if (loading) return <Carregando cheia />;
  return ehMotorista ? <Navigate to="/" replace /> : <Outlet />;
}
