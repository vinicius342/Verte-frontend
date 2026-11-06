import { apiFetch } from "./apiFetch";

export async function listarRotas(revendedoraId) {
  return apiFetch("rotas/listar", { params: { revendedoraId } });
}

export async function buscarRota(revendedoraId, id) {
  return apiFetch("rotas/buscar", { params: { revendedoraId, id } });
}

export async function criarRota(revendedoraId, clienteIds) {
  return apiFetch("rotas/criar", { method: "POST", body: { revendedoraId, clienteIds } });
}

export async function atualizarRota(revendedoraId, id, clienteIds) {
  return apiFetch("rotas/atualizar", { method: "PUT", body: { revendedoraId, id, clienteIds } });
}

export async function atualizarStatusParada(revendedoraId, id, clienteId, status) {
  return apiFetch("rotas/status-parada", {
    method: "PUT",
    body: { revendedoraId, id, clienteId, status },
  });
}

export async function finalizarRota(revendedoraId, id) {
  return apiFetch("rotas/finalizar", { method: "PUT", body: { revendedoraId, id } });
}

export async function excluirRota(revendedoraId, id) {
  return apiFetch("rotas/excluir", { method: "DELETE", params: { revendedoraId, id } });
}

export async function listarClientesEmUso(revendedoraId) {
  return apiFetch("rotas/clientes-em-uso", { params: { revendedoraId } });
}
