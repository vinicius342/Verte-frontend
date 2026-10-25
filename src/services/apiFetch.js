// Corpo de toda consulta ao backend (Cloud Function verteApi).
// A URL vem de VITE_VERTE_API_URL (.env) e o token do usuário logado vai no header Authorization.
import { getFirebaseAuth } from "../firebase/config";

const BASE_URL = import.meta.env.VITE_API_URL;
const EVENTO_ALTERACAO = "verte:dados-alterados";

function criarErro(mensagem, status, code) {
  const erro = new Error(mensagem);
  erro.status = status;
  erro.code = code;
  return erro;
}

// Os hooks de lista escutam isto para recarregar sozinhos depois de qualquer
// criação/edição/exclusão (substitui o tempo real do onSnapshot para as próprias alterações).
export function escutarAlteracoes(recurso, callback) {
  const aoAlterar = (e) => {
    if (e.detail?.recurso === recurso) callback();
  };
  window.addEventListener(EVENTO_ALTERACAO, aoAlterar);
  return () => window.removeEventListener(EVENTO_ALTERACAO, aoAlterar);
}

async function obterToken() {
  const usuario = getFirebaseAuth().currentUser;
  if (!usuario) throw criarErro("Você precisa estar logado.", 401, "nao-autenticado");
  return usuario.getIdToken(); // o SDK renova sozinho quando expira
}

// - params: vai na query (GET/DELETE)
// - body: objeto (vira JSON) ou FormData (anexos)
export async function apiFetch(caminho, { method = "GET", params, body } = {}) {
  if (!BASE_URL) {
    throw new Error("VITE_VERTE_API_URL não definida no .env");
  }

  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";

  const headers = { Authorization: `Bearer ${await obterToken()}` };
  let corpo;
  if (body instanceof FormData) {
    corpo = body; // o navegador define o Content-Type com o boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    corpo = JSON.stringify(body);
  }

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL.replace(/\/+$/, "")}/${caminho}${query}`, {
      method,
      headers,
      body: corpo,
    });
  } catch {
    throw criarErro("Sem conexão. Verifique a internet.", 0, "sem-conexao");
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // 403 vira "permission-denied" para manter as mensagens que os hooks já tinham.
    const code = dados?.codigo ?? (resposta.status === 403 ? "permission-denied" : undefined);
    throw criarErro(dados?.error ?? `Erro ${resposta.status}`, resposta.status, code);
  }

  if (method !== "GET") {
    window.dispatchEvent(
      new CustomEvent(EVENTO_ALTERACAO, { detail: { recurso: caminho.split("/")[0] } }),
    );
  }

  return dados;
}
