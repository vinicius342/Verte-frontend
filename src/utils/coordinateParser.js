// Interpreta o texto de coordenada colado do Google Maps ("-3.7327, -38.5267").
export function formatarCoordenada(coordenada) {
  if (!coordenada || coordenada.lat == null || coordenada.lng == null) return "";
  return `${coordenada.lat}, ${coordenada.lng}`;
}

export function parseCoordenada(texto) {
  const valor = (texto ?? "").trim();
  if (!valor) return { valido: true, coordenada: null };

  const partes = valor.split(",").map((p) => p.trim());
  if (partes.length !== 2) return { valido: false, coordenada: null };

  const lat = Number(partes[0]);
  const lng = Number(partes[1]);
  if (partes[0] === "" || partes[1] === "" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valido: false, coordenada: null };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valido: false, coordenada: null };
  }

  return { valido: true, coordenada: { lat, lng } };
}
