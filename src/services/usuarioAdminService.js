import { apiFetch } from "./apiFetch";

export async function listarUsuarios(revendedoraId) {
  return apiFetch("usuarios/listar", { params: { revendedoraId } });
}

// A conta e o documento agora nascem juntos, já com o papel final (sem 2º passo).
export async function criarUsuarioPelaRevendedora(revendedoraId, dados) {
  const resposta = await apiFetch("usuarios/criar-pela-revendedora", {
    method: "POST",
    body: { revendedoraId, dados },
  });
  return resposta.uid;
}

export async function atualizarUsuario(uid, dados) {
  await apiFetch("usuarios/atualizar", { method: "PUT", body: { uid, dados } });
}

export async function definirAtivo(uid, ativo) {
  await apiFetch("usuarios/definir-ativo", { method: "PUT", body: { uid, ativo } });
}

// TEMPORÁRIO (desenvolvimento): apaga só o documento; a conta no Auth continua.
export async function excluirUsuario(uid) {
  await apiFetch("usuarios/excluir", { method: "DELETE", params: { uid } });
}
