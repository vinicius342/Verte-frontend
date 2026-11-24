import { apenasDigitos } from "./whatsapp";

// Gera a URL do Google Maps a partir de coordenada OU de rua + número.
export function gerarLinkMapa(cliente) {
  if (!cliente) return null;
  const { coordenada, rua, numero } = cliente;

  if (
    coordenada &&
    Number.isFinite(Number(coordenada.lat)) &&
    Number.isFinite(Number(coordenada.lng))
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${coordenada.lat},${coordenada.lng}`;
  }

  // Fallback textual: apenas rua + número (complemento quebra a busca).
  const busca = `${rua ?? ""} ${numero ?? ""}`.trim();
  if (!busca) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busca)}`;
}

export function abrirMapa(cliente) {
  const url = gerarLinkMapa(cliente);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

function temCoordenada(coordenada) {
  if (!coordenada) return false;
  return [coordenada.lat, coordenada.lng].every(
    (valor) => valor !== "" && valor != null && Number.isFinite(Number(valor)),
  );
}

function partesEndereco(cliente) {
  return [cliente?.rua, cliente?.numero, cliente?.bairro, cliente?.cidade, cliente?.cep]
    .map((valor) => String(valor ?? "").trim())
    .filter(Boolean);
}

// Link usado no compartilhamento: coordenada quando existe, senão o endereço completo.
export function gerarLinkGoogleMaps(cliente) {
  if (!cliente) return null;

  if (temCoordenada(cliente.coordenada)) {
    const lat = String(cliente.coordenada.lat).trim();
    const lng = String(cliente.coordenada.lng).trim();
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const endereco = partesEndereco(cliente).join(", ");
  if (!endereco) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

// O link vai sozinho na última linha para o WhatsApp mostrar a prévia do mapa.
export function textoCompartilharLocalizacao(cliente) {
  const link = gerarLinkGoogleMaps(cliente);
  if (!link) return null;

  const comercio = String(cliente?.nomeComercio ?? "").trim();
  const nome = String(cliente?.nomeCliente ?? cliente?.nome ?? "").trim();
  const titulo = [comercio, nome !== comercio ? nome : ""].filter(Boolean).join(" - ");

  const rua = String(cliente?.rua ?? "").trim();
  const numero = String(cliente?.numero ?? "").trim();
  const bairro = String(cliente?.bairro ?? "").trim();
  const cidade = String(cliente?.cidade ?? "").trim();
  const ruaNumero = [rua, numero].filter(Boolean).join(", ");
  const bairroCidade = [bairro, cidade].filter(Boolean).join(", ");
  const endereco =
    ruaNumero && bairroCidade ? `${ruaNumero} - ${bairroCidade}` : ruaNumero || bairroCidade;

  return [
    titulo,
    endereco,
    temCoordenada(cliente.coordenada) ? "" : "📍 Localização aproximada pelo endereço",
    link,
  ]
    .filter(Boolean)
    .join("\n");
}

// Monta o link do WhatsApp (https://wa.me/55NUMERO) a partir do número exibido.
export function gerarLinkWhatsapp(numero) {
  const digitos = apenasDigitos(numero);
  if (digitos.length < 10) return null;
  const comDdi = digitos.startsWith("55") && digitos.length > 11 ? digitos : `55${digitos}`;
  return `https://wa.me/${comDdi}`;
}
