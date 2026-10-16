import Modal from "../common/Modal";
import ClientForm from "./ClientForm";
import { useAuth } from "../../hooks/useAuth";
import { criarCliente } from "../../services/clientService";

export default function AddClientModal({ aberto, onFechar, cliente }) {
  const { uid, revendedoraId } = useAuth();

  async function salvar(dados) {
    await criarCliente(revendedoraId, dados, uid);
    onFechar();
  }

  return (
    <Modal aberto={aberto} titulo="Adicionar novo cliente" onFechar={onFechar}>
      <ClientForm cliente={cliente} onSalvar={salvar} onCancelar={onFechar} textoSalvar="Salvar" />
    </Modal>
  );
}
