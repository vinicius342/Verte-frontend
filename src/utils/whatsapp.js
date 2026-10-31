export function apenasDigitos(texto) {
  return String(texto ?? "").replace(/\D/g, "");
}

export function formatarCelular(digitos) {
  const d = apenasDigitos(digitos).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function celularValido(digitos) {
  const d = apenasDigitos(digitos);
  if (d.length !== 11 || d[2] !== "9") return false;
  const ddd = Number(d.slice(0, 2));
  return ddd >= 11 && ddd <= 99;
}

export function linkWhatsapp(digitos) {
  return `https://wa.me/55${apenasDigitos(digitos)}`;
}
