// Acesso à coleção "configuracoes". O documento de cada usuário tem o
// próprio uid como ID. Nenhum componente fala com o Firestore direto.
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "../firebase/config";

const COLECAO = "configuracoes";

export async function buscarConfiguracao(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(getDb(), COLECAO, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function salvarConfiguracao(uid, dados) {
  await setDoc(
    doc(getDb(), COLECAO, uid),
    {
      ...dados,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
