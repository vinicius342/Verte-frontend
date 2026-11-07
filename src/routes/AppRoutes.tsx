import { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Carregando from "../components/common/Carregando";
import DefinirSenhaPage from "../pages/DefinirSenhaPage";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import EsqueciSenha from "../pages/EsqueciSenha";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";
import PerfilPage from "../pages/PerfilPage";
import ComodatoPage from "../pages/ComodatoPage";
import LimitePage from "@/pages/LimitePage";
import AtivosPage from "@/pages/AtivosPage";
import UsuariosPage from "@/pages/Usuarios";
import ColaboradoresPage from "../pages/ColaboradoresPage";
import PrivateRoute from "./PrivateRoute";
import RotaPublica from "./RotaPublica";
import RotaGerente from "./RotaGerente";
import RotaSemMotorista from "./RotaSemMotorista";
import RotaMotorista from "./RotaMotorista";
import RotaNaoVisitante from "./RotaNaoVisitante";
import RotaDoDiaPage from "../pages/RotaDoDiaPage";
import RotaFormPage from "../pages/RotaFormPage";
import RotaDetalhePage from "../pages/RotaDetalhePage";

export default function AppRoutes(): JSX.Element {
  const { usuario, loading, trocarSenha, trocandoSenha } = useAuth();

  if (loading) return <Carregando cheia />;
  if (usuario && !usuario.isAnonymous && trocarSenha) return <DefinirSenhaPage />;
  // Entre a revogação da sessão e o novo login, evita cair na tela de login.
  if (trocandoSenha && !usuario) return <Carregando cheia />;

  return (
    <Routes>
      {/* Visitantes também podem acessar as telas de autenticação. */}
      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      </Route>

      {/* Sessão Firebase, incluindo visitante. */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />} />
        <Route element={<RotaNaoVisitante />}>
          <Route path="/colaboradores" element={<ColaboradoresPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>

        <Route element={<RotaMotorista />}>
          <Route path="/rota-do-dia" element={<RotaDoDiaPage />} />
          <Route path="/rota-do-dia/nova" element={<RotaFormPage />} />
          <Route path="/rota-do-dia/:id" element={<RotaDetalhePage />} />
          <Route path="/rota-do-dia/:id/editar" element={<RotaFormPage />} />
        </Route>

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
