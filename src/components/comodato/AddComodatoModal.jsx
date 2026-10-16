import Modal from "../common/Modal";
import ComodatoForm from "./ComodatoForm";
import { useAuth } from "../../hooks/useAuth";
import { criarComodato } from "../../services/comodatoService";

export default function AddComodatoModal({ aberto, onFechar, onSalvo }) {
  const { uid, revendedoraId } = useAuth();

  async function salvar(dados) {
    const salvo = await criarComodato(revendedoraId, dados, uid);
    onSalvo(salvo);
  }

  return (
    <Modal aberto={aberto} titulo="Novo comodato" onFechar={onFechar}>
      <ComodatoForm onSalvar={salvar} onCancelar={onFechar} />
    </Modal>
  );
}
