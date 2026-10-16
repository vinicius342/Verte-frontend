import {
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { colecaoDaRevendedora, docDaRevendedora } from "./caminhos";

const COLECAO = "ativos";

export async function criarAtivo(revendedoraId, uid, { codigo, material, tipo }) {
  if (await codigoJaExiste(revendedoraId, codigo)) throw erroDuplicado();
  const dados = {
    createdBy: uid,
    codigo: codigo.trim(),
    material: material.trim(),
    tipo: tipo.trim(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(colecaoDaRevendedora(revendedoraId, COLECAO), dados);
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

// Duplicidade checada dentro da revendedora (todos os usuários dela compartilham os ativos).
async function codigoJaExiste(revendedoraId, codigo, ignorarId) {
  const alvo = normalizar(codigo);
  const snap = await getDocs(colecaoDaRevendedora(revendedoraId, COLECAO));
  return snap.docs.some((d) => d.id !== ignorarId && normalizar(d.data().codigo) === alvo);
}

function erroDuplicado() {
  const erro = new Error("Já existe um ativo cadastrado com esse código.");
  erro.code = "ativo-duplicado";
  return erro;
}

export async function listarAtivos(revendedoraId) {
  const snap = await getDocs(colecaoDaRevendedora(revendedoraId, COLECAO));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function observarAtivos(revendedoraId, onDados, onErro) {
  return onSnapshot(
    query(colecaoDaRevendedora(revendedoraId, COLECAO)),
    (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onDados(lista);
    },
    onErro,
  );
}

export async function atualizarAtivo(revendedoraId, id, { codigo, material, tipo }) {
  if (await codigoJaExiste(revendedoraId, codigo, id)) throw erroDuplicado();
  await updateDoc(docDaRevendedora(revendedoraId, COLECAO, id), {
    codigo: codigo.trim(),
    material: material.trim(),
    tipo: tipo.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function excluirAtivo(revendedoraId, id) {
  await deleteDoc(docDaRevendedora(revendedoraId, COLECAO, id));
}