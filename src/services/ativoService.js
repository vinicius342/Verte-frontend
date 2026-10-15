import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "../firebase/config";

const COLECAO = "ativos";
const db = getDb();

export async function criarAtivo(uid, { codigo, material, tipo }) {
  const dados = {
    createdBy: uid,
    codigo: codigo.trim(),
    material: material.trim(),
    tipo: tipo.trim(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLECAO), dados);
  return { id: ref.id, ...dados, createdAt: new Date() };
}

export function observarAtivos(uid, onDados, onErro) {
  const q = query(collection(db, COLECAO), where("createdBy", "==", uid));
  return onSnapshot(
    q,
    (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onDados(lista);
    },
    onErro,
  );
}

export async function atualizarAtivo(id, { codigo, material, tipo }) {
  await updateDoc(doc(db, COLECAO, id), {
    codigo: codigo.trim(),
    material: material.trim(),
    tipo: tipo.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function excluirAtivo(id) {
  await deleteDoc(doc(db, COLECAO, id));
}
