import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { getDb } from "../firebase/config";

const COLECAO = "ativos";
const db = getDb();

export async function criarAtivo(uid, { codigo, material, tipo }) {
  if (await codigoJaExiste(codigo)) throw erroDuplicado();
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

function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function codigoJaExiste(codigo, ignorarId) {
  const alvo = normalizar(codigo);
  const snap = await getDocs(collection(db, COLECAO));
  return snap.docs.some((d) => d.id !== ignorarId && normalizar(d.data().codigo) === alvo);
}

function erroDuplicado() {
  const erro = new Error("Já existe um ativo cadastrado com esse código.");
  erro.code = "ativo-duplicado";
  return erro;
}

export async function listarAtivos() {
  const snap = await getDocs(collection(db, COLECAO));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  if (await codigoJaExiste(codigo, id)) throw erroDuplicado();
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
