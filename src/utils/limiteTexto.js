export function textoLimite(l) {
  const telefones = (l.telefones ?? []).filter((t) => t?.trim()).map((t) => `*Tel:* ${t.trim()}`);

  return [
    `*SOLICITAÇÃO DE LIMITE ROTA ${l.rota}*`,
    "",
    `*Cod PDV:* ${l.codPdv}`,
    `*Razão Social* ${l.razaoSocial}`,
    `*Fantasia:* ${l.fantasia}`,
    `*Seguimento:* ${l.seguimento}`,
    ...telefones,
    `*Resp* ${l.responsavel}`,
    "",
    `*Prazo Atual:* ${l.prazoAtual}`,
    `*Prazo Solicitado:* ${l.prazoSolicitado}`,
    `*Limite Atual:* ${l.limiteAtual}`,
    `*Limite Solicitado:* ${l.limiteSolicitado}`,
    `*Valor da Venda:* ${l.valorVenda}`,
    "",
    `*Qtd Itens:* ${l.qtdItens}`,
    `*Qtd Itens MIX:* ${l.qtdItensMix}`,
    `*Qtd Itens Foco:* ${l.qtdItensFoco}`,
    `*Qtd Itens Validade:* ${l.qtdItensValidade}`,
    "",
    `*Possui Histórico de Atraso:* ${l.historicoAtraso}`,
    "",
    `MOTIVO: ${(l.motivo ?? "").toUpperCase()}`,
  ].join("\n");
}
