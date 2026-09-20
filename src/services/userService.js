// Acesso à coleção "usuarios".
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "../firebase/config";

export async function criarPerfilUsuario(uid, dados) {
  await setDoc(
    doc(getDb(), "usuarios", uid),
    {
      nome: dados.nome ?? null,
      email: dados.email ?? null,
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
