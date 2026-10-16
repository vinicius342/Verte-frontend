// Acesso à coleção "usuarios". Cada usuário guarda a revendedora a que pertence
// no campo revendedoraId (ex.: "fortaleza-6391").
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "../firebase/config";

// Hoje só existe uma revendedora; novos cadastros caem nela por padrão.
export const REVENDEDORA_PADRAO = "fortaleza-6391";

export async function buscarVinculo(uid) {
  const u = await buscarUsuario(uid);
  return { revendedoraId: u?.revendedoraId ?? null, papel: u?.papel ?? null };
}

export async function criarPerfilUsuario(uid, dados) {
  await setDoc(
    doc(getDb(), "usuarios", uid),
    {
      nome: dados.nome ?? null,
      email: dados.email ?? null,
      revendedoraId: dados.revendedoraId ?? REVENDEDORA_PADRAO,
      papel: "vendedor",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function buscarUsuario(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(getDb(), "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Atalho para descobrir a revendedora do usuário logado (null se não houver vínculo).
export async function buscarRevendedoraId(uid) {
  const usuario = await buscarUsuario(uid);
  return usuario?.revendedoraId ?? null;
}
