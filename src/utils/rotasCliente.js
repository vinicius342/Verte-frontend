// Rotas de entrega/atendimento do cliente. O cadastro guarda apenas o código.
export const ROTAS_CLIENTE = [
  { codigo: "0001", nome: "SEGUNDA-FEIRA" },
  { codigo: "0002", nome: "TERCA-FEIRA" },
  { codigo: "0003", nome: "QUARTA-FEIRA" },
  { codigo: "0004", nome: "QUINTA-FEIRA" },
  { codigo: "0005", nome: "SEXTA-FEIRA" },
  { codigo: "0006", nome: "SABADO" },
  { codigo: "0011", nome: "SEGUNDA QUINZENAL 1" },
  { codigo: "0012", nome: "TERCA QUINZENAL 1" },
  { codigo: "0013", nome: "QUARTA QUINZENAL 1" },
  { codigo: "0014", nome: "QUINTA QUINZENAL 1" },
  { codigo: "0015", nome: "SEXTA QUINZENAL 1" },
  { codigo: "0016", nome: "QUINZENAL SABADO 1" },
  { codigo: "0021", nome: "SEGUNDA QUINZENAL 2" },
  { codigo: "0022", nome: "TERCA QUINZENAL 2" },
  { codigo: "0023", nome: "QUARTA QUINZENAL 2" },
  { codigo: "0024", nome: "QUINTA QUINZENAL 2" },
  { codigo: "0025", nome: "SEXTA QUINZENAL 2" },
  { codigo: "0026", nome: "SABADO QUINZENAL 2" },
  { codigo: "1511", nome: "QUINZENAL SEGUNDA 1" },
  { codigo: "1512", nome: "QUINZENAL TERCA 1" },
  { codigo: "1513", nome: "QUINZENAL QUARTA 1" },
  { codigo: "1514", nome: "QUINZENAL QUINTA 1" },
  { codigo: "1515", nome: "QUINZENAL SEXTA 1" },
  { codigo: "1521", nome: "QUINZENAL SEGUNDA 2" },
  { codigo: "1522", nome: "QUINZENAL TERCA 2" },
  { codigo: "1523", nome: "QUINZENAL QUARTA 2" },
  { codigo: "1524", nome: "QUINZENAL QUINTA 2" },
  { codigo: "1525", nome: "QUINZENAL SEXTA 2" },
  { codigo: "9989", nome: "MOGI" },
  { codigo: "9998", nome: "FORA DE PLANEJAMENTO" },
];

export function rotuloDaRota(codigo) {
  const valor = String(codigo ?? "").trim();
  if (!valor) return "";
  const rota = ROTAS_CLIENTE.find((item) => item.codigo === valor);
  return rota ? `${rota.codigo} - ${rota.nome}` : valor;
}
