import { getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { docDaRevendedora } from "./caminhos";

const COLECAO = "configuracoes";
const ID = "geral";

export async function buscarConfiguracaoRevendedora(revendedoraId) {
  const snap = await getDoc(docDaRevendedora(revendedoraId, COLECAO, ID));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function salvarConfiguracaoRevendedora(revendedoraId, dados, uid) {
  await setDoc(
    docDaRevendedora(revendedoraId, COLECAO, ID),
    {
      codigoRevenda: dados.codigoRevenda?.toString().trim() ?? "",
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true },
  );
}