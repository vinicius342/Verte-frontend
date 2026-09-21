import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ClientForm from "./ClientForm";
import ProtectedAction from "../common/ProtectedAction";
import { useAuth } from "../../hooks/useAuth";
import { atualizarCliente } from "../../services/clientService";
import { abrirMapa, gerarLinkWhatsapp } from "../../utils/mapLinks";
import { formatDate, formatUid } from "../../utils/formatDate";

export default function ClientDetailModal({ cliente, onFechar }) {
  const { uid } = useAuth();
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    setEditando(false);
  }, [cliente?.id]);

  if (!cliente) return null;

  async function salvar(dados) {
    await atualizarCliente(cliente.id, dados, uid);
    setEditando(false);
  }

  return (
    <Modal aberto={Boolean(cliente)} titulo={editando ? "Alterar dados" : cliente.nomeCliente} onFechar={onFechar}>
      {editando ? (
        <ClientForm
          cliente={cliente}
          onSalvar={salvar}
          onCancelar={() => setEditando(false)}
          textoSalvar="Salvar alterações"
        />
      ) : (
        <div className="detalhe">
          {cliente.nomeComercio ? <p className="detalhe-comercio">{cliente.nomeComercio}</p> : null}

          <Button variant="map" className="botao-mapa" onClick={() => abrirMapa(cliente)}>
            <span className="botao-mapa-pino" aria-hidden>
              ⚲
            </span>
            Abrir mapa
          </Button>

          <dl className="detalhe-lista">
            <div className="detalhe-item">
              <dt>Endereço</dt>
              <dd>
                {cliente.rua}
                {cliente.numero ? `, ${cliente.numero}` : ""}
                {cliente.complemento ? ` — ${cliente.complemento}` : ""}
              </dd>
            </div>
            <div className="detalhe-item">
              <dt>WhatsApp</dt>
              <dd className="mono">
                {gerarLinkWhatsapp(cliente.whatsapp) ? (
                  <a
                    className="detalhe-link"
                    href={gerarLinkWhatsapp(cliente.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cliente.whatsapp}
                  </a>
                ) : (
                  cliente.whatsapp || "—"
                )}
              </dd>
            </div>
            <div className="detalhe-item">
              <dt>Coordenada</dt>
              <dd className="mono">
                {cliente.coordenada ? `${cliente.coordenada.lat}, ${cliente.coordenada.lng}` : "—"}
              </dd>
            </div>
            <div className="detalhe-item">
              <dt>Criado em</dt>
              <dd className="mono">{formatDate(cliente.createdAt)}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Criado por</dt>
              <dd className="mono">{formatUid(cliente.createdBy)}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Última alteração</dt>
              <dd className="mono">{formatDate(cliente.updatedAt)}</dd>
            </div>
            <div className="detalhe-item">
              <dt>Alterado por</dt>
              <dd className="mono">{formatUid(cliente.updatedBy)}</dd>
            </div>
          </dl>

          <ProtectedAction
            fallback={<p className="detalhe-aviso">Entre na sua conta para alterar os dados deste cliente.</p>}
          >
            <Button variant="secondary" onClick={() => setEditando(true)}>
              Alterar dados
            </Button>
          </ProtectedAction>
        </div>
      )}
    </Modal>
  );
}
