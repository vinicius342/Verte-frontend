import { apiFetch } from "./apiFetch";

export async function registrarDispositivo(revendedoraId, token) {
  return apiFetch("notificacoes/registrar-dispositivo", {
    method: "POST",
    body: { revendedoraId, token },
  });
}
