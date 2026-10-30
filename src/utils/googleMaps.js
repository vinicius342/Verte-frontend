import { obterPonto } from "./distancia";

const URL_BASE = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
const LIMITE_URL = 2000;
const MAXIMO_PARADAS = 10;

function textoLimpo(valor) {
  return String(valor ?? "").trim();
}

export function textoEndereco(cliente) {
  if (!cliente) return "";

  const rua = textoLimpo(cliente.rua);
  const numero = textoLimpo(cliente.numero);
  const bairro = textoLimpo(cliente.bairro);
  const cidade = textoLimpo(cliente.cidade);
  const numeroEhSemNumero = numero.toLowerCase().replace(/\s+/g, "") === "s/n";

  return [rua, numeroEhSemNumero ? "" : numero, bairro, cidade].filter(Boolean).join(", ");
}

function formatarCoordenada(valor) {
  return String(Number(Number(valor).toFixed(6)));
}

export function localParada(cliente) {
  if (!cliente) return null;

  const ponto = obterPonto(cliente);
  if (ponto) {
    return `${formatarCoordenada(ponto.latitude)},${formatarCoordenada(ponto.longitude)}`;
  }

  return textoEndereco(cliente) || null;
}

function gerarTrechos(locais, tamanho) {
  const trechos = [];

  for (let inicio = 0; inicio < locais.length; inicio += tamanho) {
    const paradasTrecho = locais.slice(inicio, inicio + tamanho);
    const ultima = paradasTrecho[paradasTrecho.length - 1];
    const intermediarias = paradasTrecho.slice(0, -1);

    let url = `${URL_BASE}&destination=${encodeURIComponent(ultima.local)}`;
    if (intermediarias.length > 0) {
      url += `&waypoints=${intermediarias.map((item) => encodeURIComponent(item.local)).join("%7C")}`;
    }
    if (inicio > 0) {
      url += `&origin=${encodeURIComponent(locais[inicio - 1].local)}`;
    }

    trechos.push({
      inicio: paradasTrecho[0].posicao,
      fim: ultima.posicao,
      url,
      aproximadas: paradasTrecho.filter((item) => item.aproximada).length,
    });
  }

  return trechos;
}

export function montarTrechos(paradas = [], tamanho = MAXIMO_PARADAS) {
  const lista = Array.isArray(paradas) ? paradas : [];
  const locais = [];
  let semLocal = 0;

  lista.forEach((parada, indice) => {
    const cliente = parada?.cliente ?? parada;
    const local = localParada(cliente);
    if (!local) {
      semLocal += 1;
      return;
    }

    const ponto = obterPonto(cliente);
    locais.push({
      local,
      posicao: indice + 1,
      aproximada: !ponto || ponto.estimada === true,
    });
  });

  if (locais.length === 0) {
    return { trechos: [], semLocal };
  }

  const tamanhoInicial = Number(tamanho);
  let limite = Number.isFinite(tamanhoInicial)
    ? Math.min(MAXIMO_PARADAS, Math.max(1, Math.floor(tamanhoInicial)))
    : MAXIMO_PARADAS;
  let trechos = [];

  while (true) {
    trechos = gerarTrechos(locais, limite);
    if (limite === 1 || trechos.every((trecho) => trecho.url.length <= LIMITE_URL)) break;
    limite -= 1;
  }

  return { trechos, semLocal };
}
