export const DIAS_COMO_NOVO = 30;

// Considera "novo" o cliente criado nos últimos DIAS_COMO_NOVO dias.
// Sem createdAt (clientes antigos) ou com data inválida, não é novo.
export function ehClienteNovo(cliente, agora = Date.now()) {
  const criadoEm = cliente?.createdAt;
  if (!criadoEm) return false;
  const timestamp = Date.parse(criadoEm);
  if (Number.isNaN(timestamp)) return false;
  return agora - timestamp < DIAS_COMO_NOVO * 24 * 60 * 60 * 1000;
}
