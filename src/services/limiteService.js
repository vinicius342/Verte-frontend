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

const COLECAO = "limites";

function texto(valor) {
  return valor?.toString().trim() ?? "";
}

function montarDadosLimite(dados) {
  return {
    clienteId: texto(dados.clienteId),
    rota: texto(dados.rota),
    codPdv: texto(dados.codPdv),
    razaoSocial: texto(dados.razaoSocial),
    fantasia: texto(dados.fantasia),
    seguimento: texto(dados.seguimento),
    telefones: (dados.telefones ?? []).map(texto).filter(Boolean),
    responsavel: texto(dados.responsavel),
    prazoAtual: texto(dados.prazoAtual),
    prazoSolicitado: texto(dados.prazoSolicitado),
    limiteAtual: texto(dados.limiteAtual),
    limiteSolicitado: texto(dados.limiteSolicitado),
    valorVenda: texto(dados.valorVenda),
    qtdItens: texto(dados.qtdItens),
    qtdItensMix: texto(dados.qtdItensMix),
    qtdItensFoco: texto(dados.qtdItensFoco),
    qtdItensValidade: texto(dados.qtdItensValidade),
    historicoAtraso: texto(dados.historicoAtraso) || "NÃO",
    motivo: texto(dados.motivo),
  };
}

export async function criarLimite(dados, uid) {
  const montados = montarDadosLimite(dados);
  const ref = await addDoc(collection(getDb(), COLECAO), {
    ...montados,
    createdAt: serverTimestamp(),
    createdBy: uid,
  });
  return { id: ref.id, ...montados };
}

export async function atualizarLimite(id, dados) {
  const montados = montarDadosLimite(dados);
  await updateDoc(doc(getDb(), COLECAO, id), montados);
  return montados;
}

export async function excluirLimite(id) {
  await deleteDoc(doc(getDb(), COLECAO, id));
}

export function observarLimites(callback, onError) {
  return onSnapshot(
    query(collection(getDb(), COLECAO), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}