import { apiFetch } from "./apiFetch";

export async function buscarConfiguracaoRevendedora(revendedoraId) {
  return apiFetch("revendedora/buscar-configuracao", { params: { revendedoraId } });
}

// O backend registra o updatedBy a partir do token; o uid recebido é ignorado.
export async function salvarConfiguracaoRevendedora(revendedoraId, dados) {
  await apiFetch("revendedora/salvar-configuracao", {
    method: "PUT",
    body: { revendedoraId, dados: { codigoRevenda: dados.codigoRevenda } },
  });
}
