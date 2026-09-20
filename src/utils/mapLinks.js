// Gera a URL do Google Maps a partir de coordenada OU de rua + número.
export function gerarLinkMapa(cliente) {
  if (!cliente) return null;
  const { coordenada, rua, numero, complemento } = cliente;

  if (coordenada && Number.isFinite(Number(coordenada.lat)) && Number.isFinite(Number(coordenada.lng))) {
    return `https://www.google.com/maps/search/?api=1&query=${coordenada.lat},${coordenada.lng}`;
  }

  const partes = [rua, numero, complemento].filter(Boolean).join(", ");
  if (!partes) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes)}`;
}

export function abrirMapa(cliente) {
  const url = gerarLinkMapa(cliente);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
