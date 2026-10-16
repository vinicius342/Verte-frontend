import {
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getStorageInstance } from "../firebase/config";
import { comprimirImagem } from "../utils/imageCompressor";
import { colecaoDaRevendedora, docDaRevendedora } from "./caminhos";

const COLECAO = "clientes";
const PASTA_ANEXOS = "clientes-anexos";

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
    codPdv: (dados.codPdv ?? "").trim(),
    cpf: (dados.cpf ?? "").trim(),
    seguimento: (dados.seguimento ?? dados.segmento ?? "").trim(),
    responsavel: dados.responsavel?.trim() || null,
    rua: (dados.rua ?? "").trim(),
    numero: dados.numero?.trim() ?? "",
    complemento: dados.complemento?.trim() || null,
    whatsapp: dados.whatsapp?.trim() ?? "",
    whatsapp2: dados.whatsapp2?.trim() || null,
    whatsapp3: dados.whatsapp3?.trim() || null,
    observacao: dados.observacao?.trim() || null,
    coordenada: dados.coordenada?.lat != null
      ? { lat: Number(dados.coordenada.lat), lng: Number(dados.coordenada.lng) }
      : temCoordenada
        ? { lat, lng }
        : null,
  };
}

// Os arquivos do Storage continuam em clientes-anexos/{clienteId}/..., o clienteId é único,
// então não é preciso mover nada no Storage.
async function enviarAnexo(clienteId, arquivo) {
  const arquivoFinal = await comprimirImagem(arquivo);
  const caminho = `${PASTA_ANEXOS}/${clienteId}/${Date.now()}-${arquivoFinal.name}`;
  const referencia = ref(getStorageInstance(), caminho);
  await uploadBytes(referencia, arquivoFinal);
  const url = await getDownloadURL(referencia);
  return {
    nome: arquivoFinal.name,
    tipo: arquivoFinal.type,
    tamanho: arquivoFinal.size,
    url,
    caminho,
  };
}

async function excluirAnexo(caminho) {
  try {
    await deleteObject(ref(getStorageInstance(), caminho));
  } catch (erro) {
    // Se o arquivo já não existir no Storage, seguimos sem travar a operação.
    console.error("Falha ao excluir anexo do storage:", erro);
  }
}

export async function criarCliente(revendedoraId, dados, uid) {
  const referenciaDoc = doc(colecaoDaRevendedora(revendedoraId, COLECAO));

  const anexos = await Promise.all(
    (dados.anexosNovos ?? []).map((arquivo) => enviarAnexo(referenciaDoc.id, arquivo)),
  );

  await setDoc(referenciaDoc, {
    ...normalizar(dados),
    anexos,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });

  return referenciaDoc.id;
}

export async function listarClientes(revendedoraId) {
  const snap = await getDocs(
    query(colecaoDaRevendedora(revendedoraId, COLECAO), orderBy("nomeCliente")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function buscarClientePorId(revendedoraId, id) {
  const snap = await getDoc(docDaRevendedora(revendedoraId, COLECAO, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function atualizarCliente(revendedoraId, id, dados, uid) {
  const removidos = dados.anexosRemovidos ?? [];

  await Promise.all(removidos.map((caminho) => excluirAnexo(caminho)));

  const anexosMantidos = (dados.anexosExistentes ?? []).filter(
    (anexo) => !removidos.includes(anexo.caminho),
  );

  const anexosNovos = await Promise.all(
    (dados.anexosNovos ?? []).map((arquivo) => enviarAnexo(id, arquivo)),
  );

  // createdBy/createdAt nunca são sobrescritos.
  await updateDoc(docDaRevendedora(revendedoraId, COLECAO, id), {
    ...normalizar(dados),
    anexos: [...anexosMantidos, ...anexosNovos],
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function excluirCliente(revendedoraId, id, anexos = []) {
  await Promise.all(anexos.map((anexo) => excluirAnexo(anexo.caminho)));
  await deleteDoc(docDaRevendedora(revendedoraId, COLECAO, id));
}

export function observarClientes(revendedoraId, callback, onError) {
  return onSnapshot(
    query(colecaoDaRevendedora(revendedoraId, COLECAO), orderBy("nomeCliente")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}