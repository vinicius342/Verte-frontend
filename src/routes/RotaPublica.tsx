import { Navigate, Outlet } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";

export default function RotaPublica(): JSX.Element {
  const { uid, loading } = useAuth();

  if (loading) return <Carregando cheia />;

  return uid ? <Navigate to="/" replace /> : <Outlet />;
}
