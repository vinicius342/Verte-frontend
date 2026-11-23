import { comprimirImagem } from "../utils/imageCompressor";
import { apiFetch, escutarAlteracoes } from "./apiFetch";
import { getFirebaseAuth } from "../firebase/config";

// Os anexos novos viajam como arquivos (multipart); o resto vai como JSON no campo "corpo".
// A compressão continua aqui para a foto subir já reduzida (o backend recomprime só se ainda ajudar).
async function montarFormData(corpo, arquivos) {
  const formData = new FormData();
  formData.append("corpo", JSON.stringify(corpo));
  const comprimidos = await Promise.all(arquivos.map((arquivo) => comprimirImagem(arquivo)));
  comprimidos.forEach((arquivo) => formData.append("anexosNovos", arquivo, arquivo.name));
  return formData;
}

// O uid recebido é ignorado: o backend usa o do token.
export async function criarCliente(revendedoraId, dados) {
  const arquivos = dados.anexosNovos ?? [];
  const resto = { ...dados, rota: dados.rota ?? "" };
  delete resto.anexosNovos;
  delete resto.anexosExistentes;

  const body = await montarFormData({ revendedoraId, dados: resto }, arquivos);
  const resposta = await apiFetch("clientes/criar", { method: "POST", body });
  return resposta.id;
}

const VALIDADE_CACHE_MS = 5 * 60 * 1000;
const cacheClientes = new Map(); // chave -> { lista, em } ou { promessa }
let versaoCache = 0;

// A chave inclui o uid: a lista depende do papel do usuário e não pode vazar entre contas.
function chaveCache(revendedoraId) {
  return `${getFirebaseAuth().currentUser?.uid ?? ""}:${revendedoraId}`;
}

// Qualquer criação, edição ou exclusão de cliente feita neste navegador invalida o cache.
escutarAlteracoes("clientes", () => {
  versaoCache += 1;
  cacheClientes.clear();
});

export async function listarClientes(revendedoraId, { forcar = false } = {}) {
  const chave = chaveCache(revendedoraId);
  const existente = cacheClientes.get(chave);

  if (!forcar && existente) {
    if (existente.promessa) return existente.promessa;
    if (Date.now() - existente.em < VALIDADE_CACHE_MS) return existente.lista;
  }

  const versaoInicial = versaoCache;
  const promessa = apiFetch("clientes/listar-paginado", { params: { revendedoraId } })
    .then((resposta) => {
      const lista = resposta?.itens ?? resposta;
      if (versaoInicial === versaoCache) {
        cacheClientes.set(chave, { lista, em: Date.now() });
      }
      return lista;
    })
    .catch((erro) => {
      cacheClientes.delete(chave);
      throw erro;
    });

  cacheClientes.set(chave, { promessa });
  return promessa;
}

export async function buscarClientePorId(revendedoraId, id) {
  return apiFetch("clientes/buscar-por-id", { params: { revendedoraId, id } });
}

// WhatsApp e anexos ficam no documento privado do cliente (clientes antigos: no principal).
export async function buscarPrivadoCliente(revendedoraId, id) {
  return apiFetch("clientes/buscar-privado", {
    params: { revendedoraId, id },
    cache: "no-store",
  });
}

// dados.anexosRemovidos = caminhos a remover. Os anexos mantidos o backend lê do documento salvo.
export async function atualizarCliente(revendedoraId, id, dados) {
  const arquivos = dados.anexosNovos ?? [];
  const resto = { ...dados, rota: dados.rota ?? "" };
  delete resto.anexosNovos;
  delete resto.anexosExistentes;

  const body = await montarFormData({ revendedoraId, id, dados: resto }, arquivos);
  await apiFetch("clientes/atualizar", { method: "PUT", body });
}

// Os anexos a apagar o backend lê do documento salvo (o 3º argumento antigo é ignorado).
export async function excluirCliente(revendedoraId, id) {
  await apiFetch("clientes/excluir", { method: "DELETE", params: { revendedoraId, id } });
}
