// Validações de formulário.
export function validarWhatsapp(valor) {
  if (!valor) return true; // opcional
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 13;
}

export function formatarWhatsapp(valor) {
  const d = (valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validarCliente(dados) {
  const erros = {};
  if (!dados.nomeCliente?.trim()) erros.nomeCliente = "Informe o nome do cliente.";
  if (!dados.rua?.trim()) erros.rua = "Informe a rua.";
  if (!validarWhatsapp(dados.whatsapp)) erros.whatsapp = "WhatsApp inválido.";
  if (!validarWhatsapp(dados.whatsapp2)) erros.whatsapp2 = "WhatsApp inválido.";
  if (!validarWhatsapp(dados.whatsapp3)) erros.whatsapp3 = "WhatsApp inválido.";
  const temLat = dados.lat !== "" && dados.lat != null;
  const temLng = dados.lng !== "" && dados.lng != null;
  if (temLat !== temLng) erros.coordenada = "Informe latitude e longitude juntas.";
  if (temLat && !Number.isFinite(Number(dados.lat))) erros.coordenada = "Latitude inválida.";
  if (temLng && !Number.isFinite(Number(dados.lng))) erros.coordenada = "Longitude inválida.";
  return { valido: Object.keys(erros).length === 0, erros };
}
export function validarLogin({ email, senha }) {
  const erros = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "")) erros.email = "E-mail inválido.";
  if (!senha || senha.length < 6) erros.senha = "A senha precisa ter 6 caracteres ou mais.";
  return { valido: Object.keys(erros).length === 0, erros };
}

export function formatarCpfCnpj(valor) {
  const d = (valor ?? "").replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function validarCpfCnpj(valor) {
  const digitos = (valor ?? "").replace(/\D/g, "");
  return digitos.length === 11 || digitos.length === 14;
}
