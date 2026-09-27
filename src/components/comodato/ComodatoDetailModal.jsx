import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ComodatoPrintable from "./ComodatoPrintable";

function textoParaCopiar(comodato) {
  // Formato provisório — ajustar quando a estrutura definitiva chegar.
  const linhasMateriais = comodato.materiais
    .map((m) => `${m.codMaterial} - ${m.descricao} - ${m.quantidade}`)
    .join("\n");

  return [
    `Termo: ${comodato.numeroTermo}`,
    `Revenda: ${comodato.revenda}`,
    `Vendedor: ${comodato.vendedor}`,
    `Supervisor: ${comodato.supervisor}`,
    `Cód PDV: ${comodato.codPdv}`,
    `Razão social: ${comodato.razaoSocial}`,
    "",
    linhasMateriais,
  ].join("\n");
}

export default function ComodatoDetailModal({ comodato, onFechar }) {
  const printRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (!comodato) return null;

  async function gerarCanvas() {
    return html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
  }

  async function baixarImagem() {
    setProcessando(true);
    try {
      const canvas = await gerarCanvas();
      const link = document.createElement("a");
      link.download = `comodato-${comodato.numeroTermo || "termo"}.png`;
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
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const largura = pdf.internal.pageSize.getWidth();
      const altura = (canvas.height * largura) / canvas.width;
      pdf.addImage(imagem, "PNG", 0, 0, largura, altura);
      pdf.save(`comodato-${comodato.numeroTermo || "termo"}.pdf`);
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
      <div className="comodato-preview-container">
        <ComodatoPrintable comodato={comodato} printRef={printRef} />
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
    </Modal>
  );
}