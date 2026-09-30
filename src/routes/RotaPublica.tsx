import { Navigate, Outlet } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";

export default function RotaPublica(): JSX.Element {
  const { uid, loading } = useAuth();

  if (loading) return <></>;

  return uid ? <Navigate to="/" replace /> : <Outlet />;
}