// CRUD da coleção "clientes". Nenhum componente fala com o Firestore direto.
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "../firebase/config";

const COLECAO = "clientes";

function normalizar(dados) {
  const lat = Number(dados.lat);
  const lng = Number(dados.lng);
  const temCoordenada =
    dados.coordenada?.lat != null
      ? true
      : Number.isFinite(lat) && Number.isFinite(lng) && dados.lat !== "" && dados.lng !== "";

  return {
    nomeCliente: (dados.nomeCliente ?? "").trim(),
    nomeComercio: dados.nomeComercio?.trim() || null,
    rua: (dados.rua ?? "").trim(),
    numero: dados.numero?.trim() ?? "",
    complemento: dados.complemento?.trim() || null,
    whatsapp: dados.whatsapp?.trim() ?? "",
    coordenada: dados.coordenada?.lat != null
      ? { lat: Number(dados.coordenada.lat), lng: Number(dados.coordenada.lng) }
      : temCoordenada
        ? { lat, lng }
        : null,
  };
}

export async function criarCliente(dados, uid) {
  const ref = await addDoc(collection(getDb(), COLECAO), {
    ...normalizar(dados),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });
  return ref.id;
}

export async function listarClientes() {
  const snap = await getDocs(query(collection(getDb(), COLECAO), orderBy("nomeCliente")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function buscarClientePorId(id) {
  const snap = await getDoc(doc(getDb(), COLECAO, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function atualizarCliente(id, dados, uid) {
  // createdBy/createdAt nunca são sobrescritos.
  await updateDoc(doc(getDb(), COLECAO, id), {
    ...normalizar(dados),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function excluirCliente(id) {
  await deleteDoc(doc(getDb(), COLECAO, id));
}

export function observarClientes(callback, onError) {
  return onSnapshot(
    query(collection(getDb(), COLECAO), orderBy("nomeCliente")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}
