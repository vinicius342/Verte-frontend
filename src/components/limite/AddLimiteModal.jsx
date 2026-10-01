import Modal from "../common/Modal";
import LimiteForm from "./LimiteForm";
import { useAuth } from "../../hooks/useAuth";
import { criarLimite } from "../../services/limiteService";

export default function AddLimiteModal({ aberto, onFechar, onSalvo }) {
  const { uid } = useAuth();

  async function salvar(dados) {
    const salvo = await criarLimite(dados, uid);
    onSalvo(salvo);
  }

  return (
    <Modal aberto={aberto} titulo="Nova solicitação de limite" onFechar={onFechar}>
      {aberto ? <LimiteForm onSalvar={salvar} onCancelar={onFechar} /> : null}
    </Modal>
  );
}