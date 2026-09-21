// Gera a URL do Google Maps a partir de coordenada OU de rua + número.
export function gerarLinkMapa(cliente) {
  if (!cliente) return null;
  const { coordenada, rua, numero } = cliente;

  if (coordenada && Number.isFinite(Number(coordenada.lat)) && Number.isFinite(Number(coordenada.lng))) {
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

// Monta o link do WhatsApp (https://wa.me/55NUMERO) a partir do número exibido.
export function gerarLinkWhatsapp(numero) {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const comDdi = digitos.startsWith("55") && digitos.length > 11 ? digitos : `55${digitos}`;
  return `https://wa.me/${comDdi}`;
}
