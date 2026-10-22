import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ComodatoPrintable from "./ComodatoPrintable";
import { buscarConfiguracao } from "../../services/configService";
import { useAuth } from "../../hooks/useAuth";
import ComodatoForm from "./ComodatoForm";
import { atualizarComodato, excluirComodato } from "../../services/comodatoService";
import { compartilharOuBaixar, suportaCompartilhamentoArquivo } from "../../utils/compartilharArquivo";
import { buscarPerfil } from "../../services/perfilService";

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
  const { uid, revendedoraId, papel } = useAuth();
  const [assinatura, setAssinatura] = useState("");
  const printRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  useEffect(() => {
    if (!comodato || !uid || !revendedoraId) return;
    let ativo = true;
    buscarPerfil(revendedoraId, uid)
      .then((p) => {
        if (ativo) setAssinatura(p?.assinatura ?? "");
      })
      .catch((erro) => console.error("Falha ao carregar assinatura:", erro));
    return () => {
      ativo = false;
    };
  }, [comodato, uid, revendedoraId]);

  if (!comodato) return null;

  const podeCompartilharArquivo = suportaCompartilhamentoArquivo();

  function cancelarEdicao() {
    setEditando(false);
  }

  async function salvar(dados) {
    setErroGeral(null);
    await atualizarComodato(revendedoraId, comodato.id, dados);
    onFechar();
  }

  async function excluir() {
    const confirmou = window.confirm("Deseja excluir este comodato?");
    if (!confirmou) return;

    try {
      setProcessando(true);
      setErroGeral(null);
      await excluirComodato(revendedoraId, comodato.id);
      onFechar();
    } catch (erro) {
      console.error("Falha ao excluir comodato:", erro);
      setErroGeral(erro?.message ?? "Não foi possível excluir o comodato.");
    } finally {
      setProcessando(false);
    }
  }

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
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((resultado) => {
          if (!resultado) {
            reject(new Error("Não foi possível gerar a imagem."));
            return;
          }
          resolve(resultado);
        }, "image/png");
      });
      await compartilharOuBaixar({ blobOuUrl: blob, nomeArquivo: `comodato-${comodato.codPdv || "termo"}.png` });
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
      {editando ? (
        <ComodatoForm comodatoExistente={comodato} onSalvar={salvar} onCancelar={cancelarEdicao} />
      ) : (
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

          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

          <div className="formulario-acoes comodato-acoes-modal">
            <Button variant="ghost" onClick={copiar}>
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
            <Button variant="secondary" onClick={baixarImagem} disabled={processando}>
              {podeCompartilharArquivo ? "Compartilhar" : "Baixar imagem"}
            </Button>
            <Button onClick={baixarPdf} disabled={processando}>
              Baixar PDF
            </Button>
            <Button variant="secondary" onClick={() => setEditando(true)} disabled={processando}>
              Editar
            </Button>
            <Button variant="danger" onClick={excluir} disabled={processando}>
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Fora da área visível — usado só para gerar a imagem/PDF, não aparece na tela */}
      <div className="comodato-papel-oculto">
        <ComodatoPrintable comodato={comodato} assinatura={assinatura} papelAssinante={papel} printRef={printRef} />
      </div>
    </Modal>
  );
}
