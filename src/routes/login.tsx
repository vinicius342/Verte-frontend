import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "../pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Rota Certa" },
      { name: "description", content: "Acesse sua conta para cadastrar e alterar clientes no Rota Certa." },
      { property: "og:title", content: "Entrar — Rota Certa" },
      { property: "og:description", content: "Acesse sua conta da equipe de campo." },
    ],
  }),
  component: LoginPage,
});
