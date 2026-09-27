import { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";
import ComodatoPage from "../pages/ComodatoPage";
// import Signup from "../pages/Signup";

export default function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      <Route path="/comodato" element={<ComodatoPage />} />
      {/* <Route path="/signup" element={<Signup />} /> */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}