import { createFileRoute } from "@tanstack/react-router";
import Home from "../pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rota Certa — Clientes e endereços da equipe de campo" },
      {
        name: "description",
        content:
          "Consulte e cadastre clientes, endereços e coordenadas da equipe de campo, com abertura direta no mapa.",
      },
      { property: "og:title", content: "Rota Certa — Clientes e endereços da equipe de campo" },
      {
        property: "og:description",
        content: "Lista de clientes com busca rápida, endereço completo e atalho para o mapa.",
      },
    ],
  }),
  component: Home,
});
