import { Navigate, Outlet } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute(): JSX.Element {
  const { uid, loading } = useAuth();

  if (loading) return <></>;

  return uid ? <Outlet /> : <Navigate to="/login" replace />;
}
