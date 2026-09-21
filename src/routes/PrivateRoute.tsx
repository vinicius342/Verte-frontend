// src/routes/PrivateRoute.tsx
// Rota protegida, disponível para uso futuro em páginas que exijam login.
// Não aplicada a nenhuma rota por enquanto: a Home é pública.
//
// Observação de plataforma: o roteador daqui é o TanStack Router (não o
// react-router-dom), então o padrão é o mesmo — usa <Outlet /> do roteador e
// consome o AuthContext via useAuth antes de renderizar os filhos.
import { Navigate, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute(): JSX.Element {
  const { uid, loading } = useAuth();

  if (loading) return null;

  return uid ? <Outlet /> : <Navigate to="/login" replace />;
}
