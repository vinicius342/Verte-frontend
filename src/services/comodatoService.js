import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "../firebase/config";

const COLECAO = "comodatos";

function montarDadosComodato(dados) {
  return {
    revenda: dados.revenda?.trim() ?? "",
    vendedor: dados.vendedor?.trim() ?? "",
    vendedorCodigo: dados.vendedorCodigo?.trim() ?? "",
    supervisor: dados.supervisor?.trim() ?? "",
    supervisorCodigo: dados.supervisorCodigo?.trim() ?? "",
    codPdv: dados.codPdv?.trim() ?? "",
    razaoSocial: dados.razaoSocial?.trim() ?? "",
    cpf: dados.cpf?.trim() ?? "",
    materiais: (dados.materiais ?? []).filter((m) => m.descricao?.trim() || m.codMaterial?.trim()),
  };
}

export async function criarComodato(dados, uid) {
  const ref = await addDoc(collection(getDb(), COLECAO), {
    ...montarDadosComodato(dados),
    createdAt: serverTimestamp(),
    createdBy: uid,
  });
  return ref.id;
}

export async function atualizarComodato(id, dados) {
  await updateDoc(doc(getDb(), COLECAO, id), {
    ...montarDadosComodato(dados),
  });
}

export async function excluirComodato(id) {
  await deleteDoc(doc(getDb(), COLECAO, id));
}

export function observarComodatos(callback, onError) {
  return onSnapshot(
    query(collection(getDb(), COLECAO), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}