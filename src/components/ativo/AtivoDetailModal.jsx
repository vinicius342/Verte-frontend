import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import AtivoForm from "./AtivoForm";
import { atualizarAtivo, excluirAtivo } from "../../services/ativoService";
import { useAuth } from "../../hooks/useAuth";

export default function AtivoDetailModal({ ativo, onFechar }) {
  const { revendedoraId } = useAuth();
  const [editando, setEditando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  if (!ativo) return null;

  function fechar() {
    setEditando(false);
    setErroGeral(null);
    onFechar();
  }

  async function salvar(dados) {
    await atualizarAtivo(revendedoraId, ativo.id, dados);
    fechar();
  }

  async function excluir() {
    if (!window.confirm("Deseja excluir este ativo?")) return;

    try {
      setProcessando(true);
      setErroGeral(null);
      await excluirAtivo(revendedoraId, ativo.id);
      fechar();
    } catch (erro) {
      console.error("Falha ao excluir ativo:", erro);
      setErroGeral(erro?.message ?? "Não foi possível excluir o ativo.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal aberto={Boolean(ativo)} titulo={editando ? "Editar ativo" : "Detalhes do ativo"} onFechar={fechar}>
      {editando ? (
        <AtivoForm ativoExistente={ativo} onSalvar={salvar} onCancelar={() => setEditando(false)} />
      ) : (
        <div className="detalhe">
          <dl className="detalhe-lista">
            <div className="detalhe-item">
              <dt>Código</dt>
              <dd className="mono">{ativo.codigo || "—"}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Material</dt>
              <dd>{ativo.material || "—"}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Tipo</dt>
              <dd>{ativo.tipo || "—"}</dd>
            </div>
          </dl>

          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

          <div className="formulario-acoes">
            <Button variant="secondary" onClick={() => setEditando(true)} disabled={processando}>
              Editar
            </Button>
            <Button variant="danger" onClick={excluir} disabled={processando}>
              {processando ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
