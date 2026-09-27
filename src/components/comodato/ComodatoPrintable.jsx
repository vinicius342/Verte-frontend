export default function ComodatoPrintable({ comodato, printRef }) {
  return (
    <div ref={printRef} className="comodato-papel">
      <h2 className="comodato-titulo">TERMO DE SOLICITAÇÃO DE COMODATOS</h2>

      <div className="comodato-cabecalho">
        <div className="comodato-campo-cabecalho">
          <span>NÚMERO DO TERMO</span>
          <div className="comodato-caixa">{comodato.numeroTermo || "—"}</div>
        </div>
        <div className="comodato-campo-cabecalho comodato-campo-direita">
          <span>SUPERVISOR</span>
          <div className="comodato-caixa">{comodato.supervisor || "—"}</div>
        </div>
      </div>

      <div className="comodato-campo-cabecalho">
        <span>REVENDA</span>
        <div className="comodato-caixa">{comodato.revenda || "—"}</div>
      </div>

      <div className="comodato-campo-cabecalho">
        <span>VENDEDOR</span>
        <div className="comodato-caixa">{comodato.vendedor || "—"}</div>
      </div>

      <div className="comodato-linha-dupla">
        <div className="comodato-campo-cabecalho">
          <span>CÓD PDV</span>
          <div className="comodato-caixa">{comodato.codPdv || "—"}</div>
        </div>
        <div className="comodato-campo-cabecalho" style={{ flex: 1 }}>
          <span>RAZÃO SOCIAL</span>
          <div className="comodato-caixa">{comodato.razaoSocial || "—"}</div>
        </div>
      </div>

      <table className="comodato-tabela">
        <thead>
          <tr>
            <th>CÓD MATERIAL</th>
            <th>DESCRIÇÃO DO MATERIAL</th>
            <th>QUANTIDADE</th>
          </tr>
        </thead>
        <tbody>
          {comodato.materiais.map((m, i) => (
            <tr key={i}>
              <td className="mono">{m.codMaterial}</td>
              <td>{m.descricao}</td>
              <td className="mono">{m.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="comodato-assinaturas">
        <div className="comodato-assinatura">
          <div className="comodato-linha-assinatura" />
          <span>VENDEDOR</span>
        </div>
        <div className="comodato-assinatura">
          <div className="comodato-linha-assinatura" />
          <span>GERENTE DA REVENDA</span>
        </div>
        <div className="comodato-assinatura">
          <div className="comodato-linha-assinatura" />
          <span>SUPERVISOR DE VENDAS</span>
        </div>
      </div>
    </div>
  );
}