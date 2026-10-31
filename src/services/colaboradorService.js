import { apiFetch } from "./apiFetch";

export async function listarColaboradores(revendedoraId) {
  return apiFetch("colaboradores/listar", { params: { revendedoraId } });
}
