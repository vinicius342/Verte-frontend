import { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";
import PerfilPage from "../pages/PerfilPage";
import ComodatoPage from "../pages/ComodatoPage";
import PrivateRoute from "./PrivateRoute"; // ajuste o caminho conforme onde ele está
import RotaPublica from "./RotaPublica";
import LimitePage from "@/pages/LimitePage";
import AtivosPage from "@/pages/AtivosPage";
import UsuariosPage from "@/pages/Usuarios";
import RotaGerente from "./RotaGerente";
import Signup from "../pages/Signup";

export default function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/comodato" element={<ComodatoPage />} />
        <Route path="/limite" element={<LimitePage />} />
        <Route path="/ativos" element={<AtivosPage />} />
        <Route element={<RotaGerente />}>
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
      </Route>

      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}