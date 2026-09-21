import { createFileRoute } from "@tanstack/react-router";
import Signup from "../pages/Signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta — Rota Certa" },
      { name: "description", content: "Crie sua conta da equipe de campo para cadastrar novos clientes." },
      { property: "og:title", content: "Criar conta — Rota Certa" },
      { property: "og:description", content: "Cadastro de novos integrantes da equipe de campo." },
    ],
  }),
  component: SignupPage,
});
