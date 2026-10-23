import { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";
import PerfilPage from "../pages/PerfilPage";
import ComodatoPage from "../pages/ComodatoPage";
import LimitePage from "@/pages/LimitePage";
import AtivosPage from "@/pages/AtivosPage";
import UsuariosPage from "@/pages/Usuarios";
import PrivateRoute from "./PrivateRoute";
import RotaPublica from "./RotaPublica";
import RotaGerente from "./RotaGerente";
import RotaSemMotorista from "./RotaSemMotorista";

export default function AppRoutes(): JSX.Element {
  return (
    <Routes>
      {/* Só deslogado: usuário logado é redirecionado para "/" */}
      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Só logado: deslogado é redirecionado para "/login" */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<PerfilPage />} />

        <Route element={<RotaSemMotorista />}>
          <Route path="/comodato" element={<ComodatoPage />} />
          <Route path="/limite" element={<LimitePage />} />
          <Route path="/ativos" element={<AtivosPage />} />
        </Route>

        <Route element={<RotaGerente />}>
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
      </Route>

      {/* Qualquer rota desconhecida cai em "/", que redireciona para o login se não houver sessão */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}