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

export async function criarLimite(revendedoraId, dados, uid) {
  const montados = montarDadosLimite(dados);
  const ref = await addDoc(colecaoDaRevendedora(revendedoraId, COLECAO), {
    ...montados,
    createdAt: serverTimestamp(),
    createdBy: uid,
  });
  return { id: ref.id, ...montados };
}

export async function atualizarLimite(revendedoraId, id, dados) {
  const montados = montarDadosLimite(dados);
  await updateDoc(docDaRevendedora(revendedoraId, COLECAO, id), montados);
  return montados;
}

export async function excluirLimite(revendedoraId, id) {
  await deleteDoc(docDaRevendedora(revendedoraId, COLECAO, id));
}

export function observarLimites(revendedoraId, callback, onError) {
  return onSnapshot(
    query(colecaoDaRevendedora(revendedoraId, COLECAO), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (erro) => onError?.(erro),
  );
}