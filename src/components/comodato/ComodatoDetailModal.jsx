import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Carregando from "../common/Carregando";
import ComodatoPrintable from "./ComodatoPrintable";
import StatusConfirmacao from "./StatusConfirmacao";
import { useAuth } from "../../hooks/useAuth";
import ComodatoForm from "./ComodatoForm";
import {
  atualizarComodato,
  buscarComodato,
  confirmarComodato,
  excluirComodato,
} from "../../services/comodatoService";
import { compartilharOuBaixar, suportaCompartilhamentoArquivo } from "../../utils/compartilharArquivo";

function formatarCriadoEm(valor) {
  if (!valor) return null;
  const data =
    typeof valor?.toDate === "function"
      ? valor.toDate()
      : valor instanceof Date
        ? valor
        : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const { uid, papel, revendedoraId } = useAuth();
  const [assinaturas, setAssinaturas] = useState({ vendedor: "", supervisor: "", gerente: "" });
  const [carregandoAssinaturas, setCarregandoAssinaturas] = useState(false);
  const printRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [rejeitando, setRejeitando] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  useEffect(() => {
    setRejeitando(false);
    setMotivoRejeicao("");

    if (!comodato?.id || !revendedoraId) {
      setAssinaturas({ vendedor: "", supervisor: "", gerente: "" });
      setCarregandoAssinaturas(false);
      return;
    }

    let ativo = true;
    setAssinaturas({ vendedor: "", supervisor: "", gerente: "" });
    setCarregandoAssinaturas(true);

    buscarComodato(revendedoraId, comodato.id)
      .then((comodatoAtualizado) => {
        if (!ativo) return;
        setAssinaturas({
          vendedor: comodatoAtualizado?.assinaturaVendedor || "",
          supervisor: comodatoAtualizado?.assinaturaSupervisor || "",
          gerente: comodatoAtualizado?.assinaturaGerente || "",
        });
      })
      .catch((erro) => {
        console.error("Falha ao carregar assinaturas:", erro);
      })
      .finally(() => {
        if (ativo) setCarregandoAssinaturas(false);
      });

    return () => {
      ativo = false;
    };
  }, [comodato?.id, revendedoraId]);

  if (!comodato) return null;

  const podeCompartilharArquivo = suportaCompartilhamentoArquivo();
  const criadoEm = formatarCriadoEm(comodato.createdAt);
  const confirmacoes = [
    { rotulo: "Vendedor", nome: comodato.vendedor, status: comodato.confirmacaoVendedor },
    {
      rotulo: "Supervisor",
      nome: comodato.supervisor,
      status: comodato.confirmacaoSupervisor,
      motivo: comodato.motivoRejeicaoSupervisor,
    },
    {
      rotulo: "Gerente",
      nome: comodato.gerente,
      status: comodato.confirmacaoGerente,
      motivo: comodato.motivoRejeicaoGerente,
    },
  ];
  const temAlgumaConfirmacao = confirmacoes.some(({ status }) => status != null);

  const ehSupervisorDoComodato = papel === "supervisor" && comodato.supervisorId === uid;
  const ehGerenteDoComodato = papel === "gerente" && comodato.gerenteId === uid;
  const minhaConfirmacao = ehSupervisorDoComodato
    ? comodato.confirmacaoSupervisor
    : ehGerenteDoComodato
      ? comodato.confirmacaoGerente
      : null;
  const podeResponder =
    (ehSupervisorDoComodato || ehGerenteDoComodato) && minhaConfirmacao === "pendente";
  const ehDonoVendedor = papel === "vendedor" && comodato.createdBy === uid;
  const confirmado = comodato.statusComodato === "confirmado";
  const podeEditar = ehDonoVendedor && !confirmado;
  const podeExcluir = ehDonoVendedor && !confirmado;
  const jaRespondeu =
    (ehSupervisorDoComodato || ehGerenteDoComodato) &&
    (minhaConfirmacao === "confirmado" || minhaConfirmacao === "rejeitado");

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

  async function responder(decisao, motivo) {
    setProcessando(true);
    setErroGeral(null);
    try {
      await confirmarComodato(revendedoraId, comodato.id, decisao, motivo);
      onFechar();
    } catch (erro) {
      console.error("Falha ao responder ao comodato:", erro);
      setErroGeral(erro?.message ?? "Não foi possível responder ao comodato.");
    } finally {
      setProcessando(false);
    }
  }

  function confirmar() {
    const confirmou = window.confirm(
      "Confirmar este comodato? A sua assinatura será incluída no termo.",
    );
    if (!confirmou) return;
    responder("confirmado");
  }

  function enviarRejeicao() {
    const motivo = motivoRejeicao.trim();
    if (!motivo) {
      setErroGeral("Informe o motivo da rejeição.");
      return;
    }
    responder("rejeitado", motivo);
  }

  return (
    <Modal aberto={Boolean(comodato)} titulo="Comodato salvo" onFechar={onFechar}>
      {editando ? (
        <ComodatoForm comodatoExistente={comodato} onSalvar={salvar} onCancelar={cancelarEdicao} />
      ) : (
        <div className="detalhe">
          {comodato.statusComodato ? (
            <div className="comodato-detalhe-status">
              <StatusConfirmacao status={comodato.statusComodato} />
            </div>
          ) : null}

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
              <dt>Gerente</dt>
              <dd>{comodato.gerente || "—"}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Cliente</dt>
              <dd>{comodato.razaoSocial || "—"}</dd>
            </div>
            <div className="detalhe-item">
              <dt>CPF/CNPJ</dt>
              <dd className="mono">{comodato.cpf || "—"}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Criado por</dt>
              <dd>{comodato.criadoPor || "—"}</dd>
            </div>
            {criadoEm ? (
              <div className="detalhe-item">
                <dt>Criado em</dt>
                <dd>{criadoEm}</dd>
              </div>
            ) : null}
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

          <div className="comodato-confirmacoes">
            <span className="campo-rotulo">Confirmações</span>
            {temAlgumaConfirmacao ? (
              <dl className="detalhe-lista comodato-confirmacoes-lista">
                {confirmacoes.map(({ rotulo, nome, status, motivo }) => (
                  <div className="detalhe-item" key={rotulo}>
                    <dt>{rotulo}</dt>
                    <dd className="comodato-confirmacao-valor">
                      <span className="comodato-confirmacao-linha">
                        {nome ? <span>{nome}</span> : null}
                        <StatusConfirmacao status={status} />
                      </span>
                      {motivo ? (
                        <span className="comodato-confirmacao-motivo">Motivo: {motivo}</span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="detalhe-aviso">Sem confirmação (comodato anterior ao fluxo de confirmações)</p>
            )}
          </div>

          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

          {carregandoAssinaturas ? <Carregando escala={0.6} /> : null}

          <div className="formulario-acoes comodato-acoes-modal">
            <Button variant="ghost" onClick={copiar}>
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
            <Button variant="secondary" onClick={baixarImagem} disabled={processando || carregandoAssinaturas}>
              {podeCompartilharArquivo ? "Compartilhar" : "Baixar imagem"}
            </Button>
            <Button onClick={baixarPdf} disabled={processando || carregandoAssinaturas}>
              Baixar PDF
            </Button>
            {podeEditar ? (
              <Button variant="secondary" onClick={() => setEditando(true)} disabled={processando}>
                Editar
              </Button>
            ) : null}
            {podeExcluir ? (
              <Button variant="danger" onClick={excluir} disabled={processando}>
                Excluir
              </Button>
            ) : null}
          </div>

          {jaRespondeu ? (
            <p className="comodato-resposta-status">
              {minhaConfirmacao === "confirmado"
                ? "Você confirmou este comodato."
                : "Você rejeitou este comodato."}
            </p>
          ) : null}

          {podeResponder ? (
            <div className="comodato-barra-decisao">
              {rejeitando ? (
                <>
                  <label className="comodato-barra-decisao-motivo">
                    <span className="campo-rotulo">Motivo da rejeição</span>
                    <textarea
                      className="campo-input campo-textarea"
                      value={motivoRejeicao}
                      onChange={(e) => setMotivoRejeicao(e.target.value)}
                      maxLength={300}
                      placeholder="Descreva o motivo da rejeição"
                      disabled={processando}
                    />
                  </label>
                  <div className="comodato-barra-decisao-acoes">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRejeitando(false);
                        setMotivoRejeicao("");
                        setErroGeral(null);
                      }}
                      disabled={processando}
                    >
                      Voltar
                    </Button>
                    <Button variant="danger" onClick={enviarRejeicao} disabled={processando}>
                      Enviar rejeição
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setRejeitando(true);
                      setErroGeral(null);
                    }}
                    disabled={processando}
                  >
                    Rejeitar
                  </Button>
                  <Button onClick={confirmar} disabled={processando}>
                    Confirmar
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Fora da área visível — usado só para gerar a imagem/PDF, não aparece na tela */}
      <div className="comodato-papel-oculto">
        <ComodatoPrintable comodato={comodato} assinaturas={assinaturas} printRef={printRef} />
      </div>
    </Modal>
  );
}
