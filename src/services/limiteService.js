import { apiFetch } from "./apiFetch";

// A normalização dos campos agora acontece no backend. O uid recebido é ignorado (vem do token).
export async function criarLimite(revendedoraId, dados) {
  return apiFetch("limites/criar", { method: "POST", body: { revendedoraId, dados } });
}

export async function atualizarLimite(revendedoraId, id, dados) {
  return apiFetch("limites/atualizar", { method: "PUT", body: { revendedoraId, id, dados } });
}

export async function excluirLimite(revendedoraId, id) {
  await apiFetch("limites/excluir", { method: "DELETE", params: { revendedoraId, id } });
}

export async function listarLimites(revendedoraId) {
  return apiFetch("limites/listar", { params: { revendedoraId } });
}
