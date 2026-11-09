import { comprimirImagem } from "../utils/imageCompressor";
import { apiFetch } from "./apiFetch";

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
  const resto = { ...dados };
  delete resto.anexosNovos;
  delete resto.anexosExistentes;

  const body = await montarFormData({ revendedoraId, dados: resto }, arquivos);
  const resposta = await apiFetch("clientes/criar", { method: "POST", body });
  return resposta.id;
}

export async function listarClientes(revendedoraId) {
  const resposta = await apiFetch("clientes/listar-paginado", { params: { revendedoraId } });
  return resposta?.itens ?? resposta;
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
  const resto = { ...dados };
  delete resto.anexosNovos;
  delete resto.anexosExistentes;

  const body = await montarFormData({ revendedoraId, id, dados: resto }, arquivos);
  await apiFetch("clientes/atualizar", { method: "PUT", body });
}

// Os anexos a apagar o backend lê do documento salvo (o 3º argumento antigo é ignorado).
export async function excluirCliente(revendedoraId, id) {
  await apiFetch("clientes/excluir", { method: "DELETE", params: { revendedoraId, id } });
}
