// Acesso à coleção "usuarios" (via backend). Cada usuário guarda a revendedora a que pertence
// no campo revendedoraId (ex.: "fortaleza-6391").
import { apiFetch } from "./apiFetch";

// Hoje só existe uma revendedora; novos cadastros caem nela por padrão (definido no backend).
export const REVENDEDORA_PADRAO = "fortaleza-6391";

// O backend descobre o usuário pelo token; o uid recebido é ignorado.
export async function buscarVinculo() {
  return apiFetch("usuarios/buscar-vinculo");
}

// Cria o documento do usuário recém-cadastrado (sempre vendedor da revendedora padrão).
export async function criarPerfilUsuario(uid, dados) {
  await apiFetch("usuarios/criar-perfil", { method: "POST", body: { nome: dados?.nome } });
}

export async function definirSenha(novaSenha) {
  return apiFetch("usuarios/definir-senha", { method: "PUT", body: { novaSenha } });
}

export async function buscarUsuario(uid) {
  if (!uid) return null;
  return apiFetch("usuarios/buscar", { params: { uid } });
}

// Atalho para descobrir a revendedora do usuário logado (null se não houver vínculo).
export async function buscarRevendedoraId() {
  const resposta = await apiFetch("usuarios/buscar-revendedora-id");
  return resposta?.revendedoraId ?? null;
}
