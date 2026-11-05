// Validações do cadastro de cliente, alinhadas às regras do backend.
function apenasDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function validarCpf(cpf) {
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  const primeiroDigito = resto === 10 ? 0 : resto;
  if (primeiroDigito !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  const segundoDigito = resto === 10 ? 0 : resto;
  return segundoDigito === Number(cpf[10]);
}

function validarCnpj(cnpj) {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  function calcularDigito(base) {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) soma += Number(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const primeiroDigito = calcularDigito(cnpj.slice(0, 12));
  if (primeiroDigito !== Number(cnpj[12])) return false;

  const segundoDigito = calcularDigito(cnpj.slice(0, 13));
  return segundoDigito === Number(cnpj[13]);
}

export function validarCpfCnpj(valor) {
  const digitos = apenasDigitos(valor);
  if (digitos.length === 11) return validarCpf(digitos);
  if (digitos.length === 14) return validarCnpj(digitos);
  return false;
}

export function validarCep(valor) {
  return apenasDigitos(valor).length === 8;
}

export function validarCelular(valor) {
  const digitos = apenasDigitos(valor);
  return digitos.length === 11 && digitos[2] === "9";
}

export function validarCliente(dados = {}) {
  const erros = {};
  const preenchido = (valor) => String(valor ?? "").trim().length > 0;
  const segmento = dados.segmento ?? dados.seguimento;

  if (!preenchido(dados.nomeCliente)) erros.nomeCliente = "Informe o nome do cliente.";
  if (!preenchido(dados.nomeComercio)) erros.nomeComercio = "Informe o nome do comércio.";
  if (!preenchido(dados.cpf)) erros.cpf = "Informe o CPF/CNPJ.";
  else if (!validarCpfCnpj(dados.cpf)) erros.cpf = "CPF/CNPJ inválido.";
  if (!preenchido(dados.codPdv)) erros.codPdv = "Informe o código PDV.";
  if (!preenchido(dados.responsavel)) erros.responsavel = "Informe o responsável.";
  if (!preenchido(segmento)) erros.segmento = "Informe o segmento.";
  if (!preenchido(dados.rua)) erros.rua = "Informe a rua.";
  if (!preenchido(dados.numero)) erros.numero = "Informe o número (use S/N se não houver).";
  if (!preenchido(dados.bairro)) erros.bairro = "Informe o bairro.";
  if (!preenchido(dados.cidade)) erros.cidade = "Informe a cidade.";
  if (preenchido(dados.cep) && !validarCep(dados.cep)) {
    erros.cep = "CEP inválido: informe 8 dígitos ou deixe em branco.";
  }

  const camposTelefone = ["whatsapp", "whatsapp2", "whatsapp3"];
  let temCelularValido = false;
  camposTelefone.forEach((campo) => {
    if (!preenchido(dados[campo])) return;
    if (!validarCelular(dados[campo])) {
      erros[campo] = "Celular/WhatsApp inválido. Use DDD + 9 dígitos.";
      return;
    }
    temCelularValido = true;
  });
  if (!temCelularValido && !erros.whatsapp && !erros.whatsapp2 && !erros.whatsapp3) {
    erros.whatsapp = "Informe pelo menos um celular/WhatsApp.";
  }

  return erros;
}
