const PAGE_W = 1188; // 297mm

const ROW_H = 22;
const HEADER_H = 24;
const LINHAS_PADRAO = 10;

const TABELA_TOP = 261;
const TABELA_LEFT = 155;
const COD_MATERIAL_W = 131;
const DESCRICAO_W = 670;
const QTD_LEFT = 1022;
const QTD_W = 128;

// Distâncias medidas a partir da base da tabela no PDF original.
const GAP_LINHA_GERENTE = 42;
const GAP_LABEL_GERENTE = 61;
const GAP_LINHA_INFERIOR = 99;
const GAP_LABEL_INFERIOR = 118;

const ASSINATURA_H = 55;

function Caixa({ left, top, width, height, valor }) {
  return (
    <div
      className="pdf-caixa"
      style={{ left, top, width, height, lineHeight: `${height - 11}px` }}
    >
      {valor || "\u00A0"}
    </div>
  );
}

function Rotulo({ left, top, width, children }) {
  return (
    <div className="pdf-rotulo" style={{ left, top, width }}>
      {children}
    </div>
  );
}

export default function ComodatoPrintable({ comodato, assinaturaVendedor, printRef }) {
  const materiais = comodato.materiais ?? [];
  const totalLinhas = Math.max(LINHAS_PADRAO, materiais.length);

  const alturaTabela = HEADER_H + totalLinhas * ROW_H;
  const baseTabela = TABELA_TOP + alturaTabela;

  const topLinhaGerente = baseTabela + GAP_LINHA_GERENTE;
  const topLabelGerente = baseTabela + GAP_LABEL_GERENTE;
  const topLinhaInferior = baseTabela + GAP_LINHA_INFERIOR;
  const topLabelInferior = baseTabela + GAP_LABEL_INFERIOR;
  const alturaPagina = topLabelInferior + 40;

  return (
    <div ref={printRef} className="comodato-papel-pdf" style={{ width: PAGE_W, height: alturaPagina }}>
      <div className="pdf-titulo">TERMO DE SOLICITAÇÃO DE COMODATOS</div>

      <Rotulo left={157} top={127} width={124}>NUMERO DO TERMO</Rotulo>
      <Caixa left={287} top={122} width={78} height={22} valor={comodato.numeroTermo} />

      <Rotulo left={813} top={147} width={75}>SUPERVISOR</Rotulo>
      <Caixa left={894} top={142} width={192} height={22} valor={comodato.supervisor} />

      <Rotulo left={157} top={167} width={124}>REVENDA</Rotulo>
      <Caixa left={287} top={162} width={268} height={22} valor={comodato.revenda} />

      <Rotulo left={462} top={187} width={87}>VENDEDOR</Rotulo>
      <Caixa left={555} top={181} width={467} height={23} valor={comodato.vendedor} />

      <Rotulo left={157} top={226} width={124}>CÓD PDV</Rotulo>
      <Caixa left={287} top={221} width={173} height={22} valor={comodato.codPdv} />

      <Rotulo left={462} top={226} width={87}>RAZÃO SOCIAL</Rotulo>
      <Caixa left={555} top={221} width={467} height={22} valor={comodato.razaoSocial} />

      {/* Tabela principal (Cód material + Descrição) */}
      <div
        className="pdf-tabela"
        style={{ left: TABELA_LEFT, top: TABELA_TOP, width: COD_MATERIAL_W + DESCRICAO_W, height: alturaTabela }}
      >
        <div className="pdf-tabela-cabecalho" style={{ height: HEADER_H }}>
          <span className="pdf-th" style={{ width: COD_MATERIAL_W, lineHeight: `${HEADER_H - 11}px` }}>
            CÓD MATERIAL
          </span>
          <span className="pdf-th" style={{ width: DESCRICAO_W, lineHeight: `${HEADER_H - 11}px` }}>
            DESCRIÇÃO DO MATERIAL
          </span>
        </div>
        {Array.from({ length: totalLinhas }).map((_, i) => (
          <div className="pdf-tabela-linha" key={i} style={{ height: ROW_H }}>
            <span className="pdf-td mono" style={{ width: COD_MATERIAL_W, lineHeight: `${ROW_H - 11}px` }}>
              {materiais[i]?.codMaterial || "\u00A0"}
            </span>
            <span className="pdf-td" style={{ width: DESCRICAO_W, lineHeight: `${ROW_H - 11}px` }}>
              {materiais[i]?.descricao || "\u00A0"}
            </span>
          </div>
        ))}
      </div>

      {/* Tabela de quantidade (separada, como no original) */}
      <div
        className="pdf-tabela"
        style={{ left: QTD_LEFT, top: TABELA_TOP, width: QTD_W, height: alturaTabela }}
      >
        <div className="pdf-tabela-cabecalho" style={{ height: HEADER_H }}>
          <span className="pdf-th pdf-th-centro" style={{ width: QTD_W, lineHeight: `${HEADER_H - 11}px` }}>
            QUANTIDADE
          </span>
        </div>
        {Array.from({ length: totalLinhas }).map((_, i) => (
          <div className="pdf-tabela-linha" key={i} style={{ height: ROW_H }}>
            <span className="pdf-td pdf-td-centro mono" style={{ width: QTD_W, lineHeight: `${ROW_H - 11}px` }}>
              {materiais[i]?.quantidade || "\u00A0"}
            </span>
          </div>
        ))}
      </div>

      {/* Assinaturas — sempre logo abaixo da tabela, não importa a altura dela */}
      <div className="pdf-linha-assinatura" style={{ left: 462, top: topLinhaGerente, width: 351 }} />
      <div className="pdf-rotulo-assinatura" style={{ left: 462, top: topLabelGerente, width: 351 }}>
        GERENTE DA REVENDA
      </div>

      {assinaturaVendedor ? (
        <img
          src={assinaturaVendedor}
          alt="Assinatura do vendedor"
          className="pdf-assinatura-imagem"
          style={{ left: 157, top: topLinhaInferior - ASSINATURA_H, width: 282, height: ASSINATURA_H }}
        />
      ) : null}
      <div className="pdf-linha-assinatura" style={{ left: 157, top: topLinhaInferior, width: 282 }} />
      <div className="pdf-rotulo-assinatura" style={{ left: 157, top: topLabelInferior, width: 282 }}>
        VENDEDOR
      </div>

      <div className="pdf-linha-assinatura" style={{ left: 813, top: topLinhaInferior, width: 293 }} />
      <div className="pdf-rotulo-assinatura" style={{ left: 813, top: topLabelInferior, width: 293 }}>
        SUPERVISOR DE VENDAS
      </div>
    </div>
  );
}