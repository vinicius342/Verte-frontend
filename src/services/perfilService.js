import { apiFetch } from "./apiFetch";

export async function buscarPerfil(revendedoraId, uid) {
  if (!uid) return null;
  return apiFetch("perfis/buscar", { params: { revendedoraId, uid } });
}

// Nome, código e supervisor vêm do cadastro em "usuarios".
// Aqui o próprio usuário só salva a assinatura.
export async function salvarPerfil(revendedoraId, uid, dados) {
  await apiFetch("perfis/salvar", {
    method: "PUT",
    body: { revendedoraId, uid, dados: { assinatura: dados.assinatura ?? null } },
  });
}
