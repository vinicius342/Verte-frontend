import { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RotaSemMotorista(): JSX.Element | null {
  const { ehMotorista, loading } = useAuth();

  if (loading) return null;
  return ehMotorista ? <Navigate to="/" replace /> : <Outlet />;
}
