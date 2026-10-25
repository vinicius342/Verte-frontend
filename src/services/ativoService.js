import { apiFetch } from "./apiFetch";

// Lança erro com code "ativo-duplicado" (HTTP 409) se o código já existir na revendedora.
export async function criarAtivo(revendedoraId, uid, { codigo, material, tipo }) {
  return apiFetch("ativos/criar", {
    method: "POST",
    body: { revendedoraId, dados: { codigo, material, tipo } },
  });
}

export async function listarAtivos(revendedoraId) {
  return apiFetch("ativos/listar", { params: { revendedoraId } });
}

export async function atualizarAtivo(revendedoraId, id, { codigo, material, tipo }) {
  await apiFetch("ativos/atualizar", {
    method: "PUT",
    body: { revendedoraId, id, dados: { codigo, material, tipo } },
  });
}

export async function excluirAtivo(revendedoraId, id) {
  await apiFetch("ativos/excluir", { method: "DELETE", params: { revendedoraId, id } });
}
