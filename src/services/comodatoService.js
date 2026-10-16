import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { colecaoDaRevendedora, docDaRevendedora } from "./caminhos";

const COLECAO = "comodatos";

function montarDadosComodato(dados) {
  return {
    clienteId: dados.clienteId?.trim() ?? "",
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

export async function criarComodato(revendedoraId, dados, uid) {
  const montados = montarDadosComodato(dados);
  const ref = await addDoc(colecaoDaRevendedora(revendedoraId, COLECAO), {
    ...montados,
    createdAt: serverTimestamp(),
    createdBy: uid,
  });
  return { id: ref.id, ...montados };
}

export async function atualizarComodato(revendedoraId, id, dados) {
  await updateDoc(docDaRevendedora(revendedoraId, COLECAO, id), {
    ...montarDadosComodato(dados),
  });
}

export async function excluirComodato(revendedoraId, id) {
  await deleteDoc(docDaRevendedora(revendedoraId, COLECAO, id));
}

export function observarComodatos(revendedoraId, callback, onError) {
  return onSnapshot(
    query(colecaoDaRevendedora(revendedoraId, COLECAO), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}