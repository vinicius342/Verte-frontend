import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import LimiteForm from "./LimiteForm";
import { atualizarLimite, excluirLimite } from "../../services/limiteService";
import { textoLimite } from "../../utils/limiteTexto";
import { useAuth } from "../../hooks/useAuth";
import { useTutorial } from "../../contexts/TutorialContext";

export default function LimiteDetailModal({ limite, onFechar, recemCriado = false }) {
  const { revendedoraId, papel, ehMotorista, usuario } = useAuth();
  const { iniciarTutorialDetalhe } = useTutorial();
  const [atual, setAtual] = useState(limite);
  const [editando, setEditando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  useEffect(() => {
    setAtual(limite);
    setEditando(false);
    setErroGeral(null);
  }, [limite]);

  const etapasDetalhe = useMemo(() => {
    if (!limite || !usuario || ehMotorista || !papel || papel === "admin") return [];
    return [
      {
        id: "detalhe-limite-texto",
        alvo: '[data-tour="detalhe-limite-texto"]',
        titulo: "Solicitação criada!",
        texto: "Esta é a mensagem pronta da sua solicitação de limite.",
      },
      {
        id: "detalhe-limite-copiar",
        alvo: '[data-tour="detalhe-limite-copiar"]',
        titulo: "Copiar mensagem",
        texto: "Copia a mensagem para você colar no WhatsApp e enviar.",
      },
      {
        id: "detalhe-limite-editar",
        alvo: '[data-tour="detalhe-limite-editar"]',
        titulo: "Editar",
        texto: "Corrija algum dado e a mensagem é atualizada.",
      },
      {
        id: "detalhe-limite-excluir",
        alvo: '[data-tour="detalhe-limite-excluir"]',
        titulo: "Excluir",
        texto: "Apaga a solicitação. O app pede confirmação antes.",
      },
    ];
  }, [limite, usuario, ehMotorista, papel]);

  useEffect(() => {
    if (!limite?.id || !recemCriado || editando) return;
    iniciarTutorialDetalhe("detalheLimite", etapasDetalhe);
  }, [limite?.id, recemCriado, editando, etapasDetalhe, iniciarTutorialDetalhe]);

  if (!limite || !atual) return null;

  const texto = textoLimite(atual);

  async function salvar(dados) {
    setErroGeral(null);
    const normalizado = await atualizarLimite(revendedoraId, atual.id, dados);
    setAtual((anterior) => ({ ...anterior, ...normalizado }));
    setEditando(false);
  }

  async function excluir() {
    const confirmou = window.confirm("Deseja excluir esta solicitação?");
    if (!confirmou) return;

    try {
      setProcessando(true);
      setErroGeral(null);
      await excluirLimite(revendedoraId, atual.id);
      onFechar();
    } catch (erro) {
      console.error("Falha ao excluir limite:", erro);
      setErroGeral(erro?.message ?? "Não foi possível excluir a solicitação.");
    } finally {
      setProcessando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      console.error("Falha ao copiar:", erro);
      window.alert("Não foi possível copiar.");
    }
  }

  return (
    <Modal
      aberto={Boolean(limite)}
      titulo={editando ? "Editar solicitação" : "Solicitação de limite"}
      onFechar={onFechar}
      dataTourCabecalho="detalhe-limite-cabecalho"
    >
      {editando ? (
        <LimiteForm
          limiteExistente={atual}
          onSalvar={salvar}
          onCancelar={() => setEditando(false)}
          onFecharFormulario={onFechar}
        />
      ) : (
        <div className="detalhe">
          <pre className="limite-texto-copia" data-tour="detalhe-limite-texto">
            {texto}
          </pre>

          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

          <div className="formulario-acoes comodato-acoes-modal">
            <Button data-tour="detalhe-limite-copiar" onClick={copiar}>
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
            <Button
              variant="secondary"
              data-tour="detalhe-limite-editar"
              onClick={() => setEditando(true)}
              disabled={processando}
            >
              Editar
            </Button>
            <Button
              variant="danger"
              data-tour="detalhe-limite-excluir"
              onClick={excluir}
              disabled={processando}
            >
              Excluir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
