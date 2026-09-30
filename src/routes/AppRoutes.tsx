import { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";
import ComodatoPage from "../pages/ComodatoPage";
import PrivateRoute from "./PrivateRoute"; // ajuste o caminho conforme onde ele está
import RotaPublica from "./RotaPublica";
// import Signup from "../pages/Signup";

export default function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        <Route path="/comodato" element={<ComodatoPage />} />
      </Route>

      {/* <Route path="/signup" element={<Signup />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}