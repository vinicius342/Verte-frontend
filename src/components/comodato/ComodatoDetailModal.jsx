import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Carregando from "../common/Carregando";
import ComodatoPrintable from "./ComodatoPrintable";
import StatusConfirmacao from "./StatusConfirmacao";
import { useAuth } from "../../hooks/useAuth";
import { useTutorial } from "../../contexts/TutorialContext";
import ComodatoForm from "./ComodatoForm";
import {
  atualizarComodato,
  buscarComodato,
  confirmarComodato,
  excluirComodato,
} from "../../services/comodatoService";
import {
  baixarArquivo,
  compartilharArquivo,
  suportaCompartilhamentoArquivo,
} from "../../utils/compartilharArquivo";

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

export default function ComodatoDetailModal({ comodato, onFechar, recemCriado = false }) {
  const { uid, papel, revendedoraId } = useAuth();
  const { iniciarTutorialDetalhe } = useTutorial();
  const podeCompartilharArquivo = useMemo(() => suportaCompartilhamentoArquivo(), []);
  const [assinaturas, setAssinaturas] = useState({ vendedor: "", supervisor: "", gerente: "" });
  const [carregandoAssinaturas, setCarregandoAssinaturas] = useState(false);
  const printRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [menuCompartilharAberto, setMenuCompartilharAberto] = useState(false);
  const [arquivosCompartilhamento, setArquivosCompartilhamento] = useState({
    imagem: null,
    pdf: null,
  });
  const botaoCompartilharRef = useRef(null);
  const menuCompartilharRef = useRef(null);
  const cacheArquivosRef = useRef(null);
  const geracaoArquivosRef = useRef(0);
  const [posicaoMenu, setPosicaoMenu] = useState({ top: 0, right: 0 });
  // Inclui o carregamento das assinaturas: ao terminar, um menu reaberto usa arquivos novos.
  const chaveArquivos = useMemo(
    () => JSON.stringify([comodato?.id, assinaturas, carregandoAssinaturas]),
    [comodato?.id, assinaturas, carregandoAssinaturas],
  );
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const [rejeitando, setRejeitando] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  useEffect(() => {
    setRejeitando(false);
    setMotivoRejeicao("");
    setEditando(false);

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

  useEffect(() => {
    geracaoArquivosRef.current += 1;
    cacheArquivosRef.current = null;
    setArquivosCompartilhamento({ imagem: "preparando", pdf: "preparando" });
    setMenuCompartilharAberto(false);
  }, [chaveArquivos]);

  const etapasDetalhe = useMemo(() => {
    if (!comodato || papel !== "vendedor") return [];
    const confirmado = comodato.statusComodato === "confirmado";
    const ehDono = comodato.createdBy === uid;
    const podeEditar = ehDono && !confirmado;
    const podeExcluir = ehDono && !confirmado;

    const lista = [
      {
        id: "detalhe-comodato-cabecalho",
        alvo: '[data-tour="detalhe-comodato-cabecalho"]',
        titulo: "Comodato enviado!",
        texto:
          "A solicitação do comodato já foi enviada para o seu supervisor e para o gerente. Eles vão confirmar ou rejeitar, e você acompanha o status na lista.",
      },
      {
        id: "detalhe-comodato-copiar",
        alvo: '[data-tour="detalhe-comodato-copiar"]',
        titulo: "Copiar mensagem",
        texto: "Copia este texto pronto para você colar no WhatsApp.",
        preConteudo: textoParaCopiar(comodato),
      },
      {
        id: "detalhe-comodato-imagem",
        alvo: '[data-tour="detalhe-comodato-imagem"]',
        titulo: "Baixar imagem",
        texto: "Baixa a imagem do termo no seu aparelho.",
      },
      {
        id: "detalhe-comodato-pdf",
        alvo: '[data-tour="detalhe-comodato-pdf"]',
        titulo: "Baixar PDF",
        texto: "Baixa o termo de solicitação de comodato em PDF.",
      },
    ];

    if (podeCompartilharArquivo) {
      lista.push({
        id: "detalhe-comodato-compartilhar",
        alvo: '[data-tour="detalhe-comodato-compartilhar"]',
        titulo: "Compartilhar",
        texto: "Envie a imagem ou o PDF do termo por WhatsApp ou outro app.",
      });
    }

    if (podeEditar) {
      lista.push({
        id: "detalhe-comodato-editar",
        alvo: '[data-tour="detalhe-comodato-editar"]',
        titulo: "Editar",
        texto: "Corrija os dados do comodato.",
      });
    }
    if (podeExcluir) {
      lista.push({
        id: "detalhe-comodato-excluir",
        alvo: '[data-tour="detalhe-comodato-excluir"]',
        titulo: "Excluir",
        texto: "Remove o comodato. O app pede confirmação antes.",
      });
    }

    return lista;
  }, [comodato, papel, uid, podeCompartilharArquivo]);

  useEffect(() => {
    if (!comodato?.id || !recemCriado || editando) return;
    iniciarTutorialDetalhe("detalheComodato", etapasDetalhe);
  }, [comodato?.id, recemCriado, editando, etapasDetalhe, iniciarTutorialDetalhe]);

  useEffect(() => {
    if (!menuCompartilharAberto) return;
    // Fase de captura: fecha só o menu, sem deixar o Esc fechar o modal também.
    const aoTeclar = (evento) => {
      if (evento.key !== "Escape") return;
      evento.preventDefault();
      evento.stopPropagation();
      setMenuCompartilharAberto(false);
      botaoCompartilharRef.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [menuCompartilharAberto]);

  useEffect(() => {
    if (!menuCompartilharAberto) return;
    const aoClicar = (evento) => {
      if (menuCompartilharRef.current?.contains(evento.target)) return;
      if (botaoCompartilharRef.current?.contains(evento.target)) return;
      setMenuCompartilharAberto(false);
      botaoCompartilharRef.current?.focus();
    };
    document.addEventListener("pointerdown", aoClicar, true);
    return () => document.removeEventListener("pointerdown", aoClicar, true);
  }, [menuCompartilharAberto]);

  useEffect(() => {
    if (menuCompartilharAberto) menuCompartilharRef.current?.focus();
  }, [menuCompartilharAberto]);

  if (!comodato) return null;

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

  function nomeArquivo(extensao) {
    return `comodato-${comodato.codPdv || "termo"}.${extensao}`;
  }

  async function gerarCanvas() {
    return html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: printRef.current.offsetWidth,
      height: printRef.current.offsetHeight,
    });
  }

  function gerarBlobImagem(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((resultado) => {
        if (!resultado) {
          reject(new Error("Não foi possível gerar a imagem."));
          return;
        }
        resolve(resultado);
      }, "image/png");
    });
  }

  async function gerarBlobPdf(canvas) {
    const imagem = canvas.toDataURL("image/png");
    const orientacao = canvas.width > canvas.height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation: orientacao,
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imagem, "PNG", 0, 0, canvas.width, canvas.height);
    return pdf.output("blob");
  }

  function criarArquivo(blob, nome) {
    return new File([blob], nome, { type: blob.type || "application/octet-stream" });
  }

  async function baixarImagem() {
    setProcessando(true);
    try {
      const canvas = await gerarCanvas();
      const blob = await gerarBlobImagem(canvas);
      baixarArquivo({ blobOuUrl: blob, nomeArquivo: nomeArquivo("png") });
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
      const blob = await gerarBlobPdf(canvas);
      baixarArquivo({ blobOuUrl: blob, nomeArquivo: nomeArquivo("pdf") });
    } catch (erro) {
      console.error("Falha ao gerar PDF:", erro);
      window.alert("Não foi possível gerar o PDF.");
    } finally {
      setProcessando(false);
    }
  }

  function fecharMenuCompartilhar() {
    setMenuCompartilharAberto(false);
    botaoCompartilharRef.current?.focus();
  }

  async function prepararArquivosCompartilhamento() {
    const cache = cacheArquivosRef.current;
    if (cache?.chave === chaveArquivos) return;

    const idGeracao = ++geracaoArquivosRef.current;
    setArquivosCompartilhamento({ imagem: "preparando", pdf: "preparando" });

    try {
      // Um único canvas para os dois formatos: html2canvas é a etapa mais lenta.
      const canvas = await gerarCanvas();
      const [blobImagem, blobPdf] = await Promise.all([
        gerarBlobImagem(canvas),
        gerarBlobPdf(canvas),
      ]);
      const arquivos = {
        imagem: criarArquivo(blobImagem, nomeArquivo("png")),
        pdf: criarArquivo(blobPdf, nomeArquivo("pdf")),
      };
      const estados = {
        imagem: suportaCompartilhamentoArquivo(arquivos.imagem) ? "pronto" : "indisponivel",
        pdf: suportaCompartilhamentoArquivo(arquivos.pdf) ? "pronto" : "indisponivel",
      };
      if (idGeracao !== geracaoArquivosRef.current) return;
      cacheArquivosRef.current = { chave: chaveArquivos, arquivos, estados };
      setArquivosCompartilhamento(estados);
    } catch (erro) {
      if (idGeracao !== geracaoArquivosRef.current) return;
      console.error("Falha ao preparar arquivos para compartilhamento:", erro);
      setArquivosCompartilhamento({ imagem: "indisponivel", pdf: "indisponivel" });
    }
  }

  function abrirMenuCompartilhar() {
    const retangulo = botaoCompartilharRef.current?.getBoundingClientRect();
    if (retangulo) {
      setPosicaoMenu({
        top: retangulo.bottom + 8,
        right: Math.max(8, window.innerWidth - retangulo.right),
      });
    }
    setMenuCompartilharAberto(true);
    prepararArquivosCompartilhamento();
  }

  function compartilhar(tipo) {
    const arquivo = cacheArquivosRef.current?.arquivos?.[tipo];
    if (!arquivo || arquivosCompartilhamento[tipo] !== "pronto") return;

    // Chamar share antes de qualquer await preserva o gesto do usuário no iOS.
    const promessa = compartilharArquivo({
      arquivo,
      titulo: `Comodato ${comodato.codPdv || "termo"}`,
    });
    fecharMenuCompartilhar();
    promessa.catch((erro) => {
      console.error("Falha ao compartilhar:", erro);
      window.alert("Não foi possível compartilhar.");
    });
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
    <Modal
      aberto={Boolean(comodato)}
      titulo="Comodato salvo"
      onFechar={onFechar}
      dataTourCabecalho="detalhe-comodato-cabecalho"
    >
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
                {confirmacoes.map(({ rotulo, nome, status }) => (
                  <div className="detalhe-item" key={rotulo}>
                    <dt>{rotulo}</dt>
                    <dd className="comodato-confirmacao-valor">
                      <span className="comodato-confirmacao-linha">
                        {nome ? <span>{nome}</span> : null}
                        <StatusConfirmacao status={status} />
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="detalhe-aviso">
                Sem confirmação (comodato anterior ao fluxo de confirmações)
              </p>
            )}
          </div>

          {comodato.motivoRejeicaoSupervisor || comodato.motivoRejeicaoGerente ? (
            <div className="comodato-motivos">
              {comodato.motivoRejeicaoSupervisor ? (
                <div className="comodato-motivo">
                  <span className="comodato-motivo-titulo">Motivo da rejeição do supervisor</span>
                  <p className="comodato-motivo-texto">{comodato.motivoRejeicaoSupervisor}</p>
                </div>
              ) : null}
              {comodato.motivoRejeicaoGerente ? (
                <div className="comodato-motivo">
                  <span className="comodato-motivo-titulo">Motivo da rejeição do gerente</span>
                  <p className="comodato-motivo-texto">{comodato.motivoRejeicaoGerente}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

          {carregandoAssinaturas ? <Carregando escala={0.6} /> : null}

          <div className="formulario-acoes comodato-acoes-modal">
            <Button variant="ghost" data-tour="detalhe-comodato-copiar" onClick={copiar}>
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
            <Button
              variant="secondary"
              data-tour="detalhe-comodato-imagem"
              onClick={baixarImagem}
              disabled={processando || carregandoAssinaturas}
            >
              Baixar imagem
            </Button>
            <Button
              variant="secondary"
              data-tour="detalhe-comodato-pdf"
              onClick={baixarPdf}
              disabled={processando || carregandoAssinaturas}
            >
              Baixar PDF
            </Button>
            {podeCompartilharArquivo ? (
              <Button
                ref={botaoCompartilharRef}
                variant="secondary"
                data-tour="detalhe-comodato-compartilhar"
                onClick={abrirMenuCompartilhar}
                disabled={processando || carregandoAssinaturas}
                aria-haspopup="menu"
                aria-expanded={menuCompartilharAberto}
              >
                Compartilhar
              </Button>
            ) : null}
            {podeEditar ? (
              <Button
                variant="secondary"
                data-tour="detalhe-comodato-editar"
                onClick={() => setEditando(true)}
                disabled={processando}
              >
                Editar
              </Button>
            ) : null}
            {podeExcluir ? (
              <Button
                variant="danger"
                data-tour="detalhe-comodato-excluir"
                onClick={excluir}
                disabled={processando}
              >
                Excluir
              </Button>
            ) : null}
          </div>

          {menuCompartilharAberto
            ? createPortal(
                <div className="comodato-compartilhar">
                  <div
                    className="comodato-compartilhar__fundo"
                    onClick={fecharMenuCompartilhar}
                    aria-hidden="true"
                  />
                  <div
                    className="comodato-compartilhar__menu"
                    style={{
                      "--comodato-menu-top": `${posicaoMenu.top}px`,
                      "--comodato-menu-right": `${posicaoMenu.right}px`,
                    }}
                  >
                    <p className="comodato-compartilhar__dica">
                      Escolha o WhatsApp na próxima tela.
                    </p>
                    <div
                      ref={menuCompartilharRef}
                      role="menu"
                      aria-label="Compartilhar termo de comodato"
                      tabIndex={-1}
                      className="comodato-compartilhar__opcoes"
                    >
                      {[
                        { tipo: "imagem", rotulo: "Imagem (PNG)" },
                        { tipo: "pdf", rotulo: "PDF" },
                      ].map((opcao) => {
                        const estado = arquivosCompartilhamento[opcao.tipo];
                        return (
                          <button
                            key={opcao.tipo}
                            type="button"
                            role="menuitem"
                            className="comodato-compartilhar__opcao"
                            onClick={() => compartilhar(opcao.tipo)}
                            disabled={estado !== "pronto"}
                            aria-label={`Compartilhar ${opcao.rotulo} do termo`}
                          >
                            <span className="comodato-compartilhar__opcao-rotulo">
                              {opcao.rotulo}
                            </span>
                            {estado !== "pronto" ? (
                              <span className="comodato-compartilhar__opcao-estado">
                                {estado === "preparando"
                                  ? "Preparando…"
                                  : "Não disponível neste aparelho"}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                      <Button
                        role="menuitem"
                        variant="ghost"
                        className="comodato-compartilhar__cancelar"
                        onClick={fecharMenuCompartilhar}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}

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
