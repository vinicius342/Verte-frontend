import Modal from "../common/Modal"; // ajuste para o seu componente de modal
import AtivoForm from "./AtivoForm";
import { criarAtivo } from "../../services/ativoService";
import { useAuth } from "../../hooks/useAuth";

export default function AddAtivoModal({ aberto, onFechar, onSalvo, valoresIniciais }) {
  const { uid } = useAuth();

  async function salvar(dados) {
    const ativo = await criarAtivo(uid, dados);
    onSalvo?.(ativo);
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo ativo">
      {aberto ? <AtivoForm ativoExistente={valoresIniciais} onSalvar={salvar} onCancelar={onFechar} /> : null}
    </Modal>
  );
}