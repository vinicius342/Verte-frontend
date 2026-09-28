import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ComodatoPrintable from "./ComodatoPrintable";

function textoParaCopiar(comodato) {
  const blocosMateriais = (comodato.materiais ?? [])
    .map((m) => `CÓDIGO DO ATIVO: ${m.codMaterial}\nQuantidade: ${m.quantidade}`)
    .join("\n\n");

  return [
    "*SOLICITAÇÃO COMODATO*",
    "",
    `CDG PDV: ${comodato.codPdv}`,
    `NUMERO VENDEDOR: ${comodato.vendedorCodigo}`,
    "",
    `Cliente: ${comodato.razaoSocial}`,
    `CPF: ${comodato.cpf}`,
    `DEPOSITÁRIO: ${comodato.razaoSocial}`,
    "",
    blocosMateriais,
  ].join("\n");
}

export default function ComodatoDetailModal({ comodato, onFechar }) {
  const printRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (!comodato) return null;

  async function gerarCanvas() {
    return html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: printRef.current.offsetWidth,
      height: printRef.current.offsetHeight,
    });
  }

  async function baixarImagem() {
    setProcessando(true);
    try {
      const canvas = await gerarCanvas();
      const link = document.createElement("a");
      link.download = `comodato-${comodato.codPdv || "termo"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (erro) {
      console.error("Falha ao gerar imagem:", erro);
      window.alert("Não foi possível gerar a imagem.");
    } finally {
      setProcessando(false);
    }
  }

  async function baixarPdf() {
    setProcessando(true);
    try {
      const canvas = await gerarCanvas();
      const imagem = canvas.toDataURL("image/png");
      const orientacao = canvas.width > canvas.height ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation: orientacao, unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imagem, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`comodato-${comodato.codPdv || "termo"}.pdf`);
    } catch (erro) {
      console.error("Falha ao gerar PDF:", erro);
      window.alert("Não foi possível gerar o PDF.");
    } finally {
      setProcessando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoParaCopiar(comodato));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      console.error("Falha ao copiar:", erro);
      window.alert("Não foi possível copiar.");
    }
  }

  return (
    <Modal aberto={Boolean(comodato)} titulo="Comodato salvo" onFechar={onFechar}>
      <div className="detalhe">
        <dl className="detalhe-lista">
          <div className="detalhe-item">
            <dt>Revenda</dt>
            <dd>{comodato.revenda || "—"}</dd>
          </div>
          <div className="detalhe-item">
            <dt>Cód PDV</dt>
            <dd className="mono">{comodato.codPdv || "—"}</dd>
          </div>
          <div className="detalhe-item">
            <dt>Vendedor</dt>
            <dd>{comodato.vendedor || "—"}</dd>
          </div>
          <div className="detalhe-item">
            <dt>Supervisor</dt>
            <dd>{comodato.supervisor || "—"}</dd>
          </div>
          <div className="detalhe-item">
            <dt>Cliente</dt>
            <dd>{comodato.razaoSocial || "—"}</dd>
          </div>
          <div className="detalhe-item">
            <dt>CPF/CNPJ</dt>
            <dd className="mono">{comodato.cpf || "—"}</dd>
          </div>
        </dl>

        <div className="comodato-lista-materiais-detalhe">
          <span className="campo-rotulo">Materiais</span>
          <ul className="lista-anexos">
            {(comodato.materiais ?? []).map((m, i) => (
              <li key={i} className="lista-anexos-item">
                <span className="mono">{m.codMaterial}</span>
                <span>{m.descricao}</span>
                <span className="mono">{m.quantidade}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="formulario-acoes comodato-acoes-modal">
          <Button variant="ghost" onClick={copiar}>
            {copiado ? "Copiado!" : "Copiar"}
          </Button>
          <Button variant="secondary" onClick={baixarImagem} disabled={processando}>
            Baixar imagem
          </Button>
          <Button onClick={baixarPdf} disabled={processando}>
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Fora da área visível — usado só para gerar a imagem/PDF, não aparece na tela */}
      <div className="comodato-papel-oculto">
        <ComodatoPrintable comodato={comodato} printRef={printRef} />
      </div>
    </Modal>
  );
}