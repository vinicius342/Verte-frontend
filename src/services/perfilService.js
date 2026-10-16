import { getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { docDaRevendedora } from "./caminhos";

const COLECAO = "perfis";
const texto = (v) => v?.toString().trim() ?? "";

export async function buscarPerfil(revendedoraId, uid) {
  if (!uid) return null;
  const snap = await getDoc(docDaRevendedora(revendedoraId, COLECAO, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function salvarPerfil(revendedoraId, uid, dados) {
  await setDoc(
    docDaRevendedora(revendedoraId, COLECAO, uid),
    {
      vendedor: texto(dados.vendedor),
      vendedorCodigo: texto(dados.vendedorCodigo),
      supervisor: texto(dados.supervisor),
      supervisorCodigo: texto(dados.supervisorCodigo),
      assinatura: dados.assinatura ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}