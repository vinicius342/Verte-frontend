import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getDb } from "../firebase/config";

const COLECAO = "comodatos";

export async function criarComodato(dados, uid) {
  const ref = await addDoc(collection(getDb(), COLECAO), {
    numeroTermo: dados.numeroTermo?.trim() ?? "",
    revenda: dados.revenda?.trim() ?? "",
    vendedor: dados.vendedor?.trim() ?? "",
    supervisor: dados.supervisor?.trim() ?? "",
    codPdv: dados.codPdv?.trim() ?? "",
    razaoSocial: dados.razaoSocial?.trim() ?? "",
    materiais: dados.materiais.filter((m) => m.descricao?.trim()),
    createdAt: serverTimestamp(),
    createdBy: uid,
  });
  return ref.id;
}

export function observarComodatos(callback, onError) {
  return onSnapshot(
    query(collection(getDb(), COLECAO), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}