// Acesso à coleção "configuracoes" (via backend). O documento de cada usuário tem o
// próprio uid como ID. Nenhum componente fala com o Firestore direto.
import { apiFetch } from "./apiFetch";

export async function buscarConfiguracao(uid) {
  if (!uid) return null;
  return apiFetch("configuracoes/buscar", { params: { uid } });
}

export async function salvarConfiguracao(uid, dados) {
  await apiFetch("configuracoes/salvar", { method: "PUT", body: { uid, dados } });
}