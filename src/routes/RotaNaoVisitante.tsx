import { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";

export default function RotaNaoVisitante(): JSX.Element {
  const { ehVisitante, loading } = useAuth();

  if (loading) return <Carregando cheia />;
  return ehVisitante ? <Navigate to="/" replace /> : <Outlet />;
}
