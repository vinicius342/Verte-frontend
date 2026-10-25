import { apiFetch } from "./apiFetch";
import { comprimirImagem } from "../utils/imageCompressor";

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

// O backend usa o uid do token. Retorna { fotoUrl }.
export async function salvarFotoPerfil(arquivo) {
  const comprimida = await comprimirImagem(arquivo, { larguraMaxima: 512, qualidade: 0.8 });
  const formData = new FormData();
  formData.append("foto", comprimida, comprimida.name);
  return apiFetch("perfis/salvar-foto", { method: "PUT", body: formData });
}

export async function removerFotoPerfil() {
  await apiFetch("perfis/remover-foto", { method: "DELETE" });
}
