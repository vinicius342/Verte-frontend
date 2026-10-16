// Único lugar que conhece a estrutura: revendedoras/{revendedoraId}/{colecao}/{id}
import { collection, doc } from "firebase/firestore";
import { getDb } from "../firebase/config";

const RAIZ = "revendedoras";

export function exigirRevendedora(revendedoraId) {
  if (typeof revendedoraId !== "string" || !revendedoraId.trim()) {
    throw new Error(
      `revendedoraId inválido: esperava string, recebi ${typeof revendedoraId} (${JSON.stringify(revendedoraId)})`
    );
  }
  return revendedoraId;
}

export const docRevendedora = (revendedoraId) =>
  doc(getDb(), RAIZ, exigirRevendedora(revendedoraId));

export const colecaoDaRevendedora = (revendedoraId, nome) =>
  collection(getDb(), RAIZ, exigirRevendedora(revendedoraId), nome);

export const docDaRevendedora = (revendedoraId, nome, id) =>
  doc(getDb(), RAIZ, exigirRevendedora(revendedoraId), nome, id);