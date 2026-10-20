import { getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { docDaRevendedora } from "./caminhos";

const COLECAO = "perfis";

export async function buscarPerfil(revendedoraId, uid) {
  if (!uid) return null;
  const snap = await getDoc(docDaRevendedora(revendedoraId, COLECAO, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Nome, código e supervisor vêm do cadastro em "usuarios".
// Aqui o próprio usuário só salva a assinatura.
export async function salvarPerfil(revendedoraId, uid, dados) {
  await setDoc(
    docDaRevendedora(revendedoraId, COLECAO, uid),
    {
      assinatura: dados.assinatura ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}