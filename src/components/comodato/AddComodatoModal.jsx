import Modal from "../common/Modal";
import ComodatoForm from "./ComodatoForm";
import { useAuth } from "../../hooks/useAuth";
import { criarComodato } from "../../services/comodatoService";

export default function AddComodatoModal({ aberto, onFechar, onSalvo }) {
  const { uid } = useAuth();

  async function salvar(dados) {
    await criarComodato(dados, uid);
    onSalvo(dados);
  }

  return (
    <Modal aberto={aberto} titulo="Novo comodato" onFechar={onFechar}>
      <ComodatoForm onSalvar={salvar} onCancelar={onFechar} />
    </Modal>
  );
}