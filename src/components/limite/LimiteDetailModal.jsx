import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import LimiteForm from "./LimiteForm";
import { atualizarLimite, excluirLimite } from "../../services/limiteService";
import { textoLimite } from "../../utils/limiteTexto";
import { useAuth } from "../../hooks/useAuth";

export default function LimiteDetailModal({ limite, onFechar }) {
  const { revendedoraId } = useAuth();
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
          <pre className="limite-texto-copia">{texto}</pre>

          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

          <div className="formulario-acoes comodato-acoes-modal">
            <Button onClick={copiar}>{copiado ? "Copiado!" : "Copiar"}</Button>
            <Button variant="secondary" onClick={() => setEditando(true)} disabled={processando}>
              Editar
            </Button>
            <Button variant="danger" onClick={excluir} disabled={processando}>
              Excluir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
