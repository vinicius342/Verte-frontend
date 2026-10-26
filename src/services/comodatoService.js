import { apiFetch } from "./apiFetch";

// Vendedor e supervisor são definidos pelo backend a partir do token; o frontend não envia nome nem código.
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

export async function buscarComodato(revendedoraId, id) {
  return apiFetch("comodatos/buscar", { params: { revendedoraId, id } });
}
