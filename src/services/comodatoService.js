import { apiFetch } from "./apiFetch";

// A normalização dos campos agora acontece no backend. O uid recebido é ignorado (vem do token).
export async function criarComodato(revendedoraId, dados) {
  return apiFetch("comodatos/criar", { method: "POST", body: { revendedoraId, dados } });
}

export async function atualizarComodato(revendedoraId, id, dados) {
  await apiFetch("comodatos/atualizar", { method: "PUT", body: { revendedoraId, id, dados } });
}

export async function excluirComodato(revendedoraId, id) {
  await apiFetch("comodatos/excluir", { method: "DELETE", params: { revendedoraId, id } });
}

export async function listarComodatos(revendedoraId) {
  return apiFetch("comodatos/listar", { params: { revendedoraId } });
}
