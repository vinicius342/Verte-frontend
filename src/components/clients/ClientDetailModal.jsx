import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ClientForm from "./ClientForm";
import ProtectedAction from "../common/ProtectedAction";
import { useAuth } from "../../hooks/useAuth";
import { atualizarCliente, excluirCliente } from "../../services/clientService";
import { abrirMapa, gerarLinkWhatsapp } from "../../utils/mapLinks";
import { compartilharOuBaixar, suportaCompartilhamentoArquivo } from "../../utils/compartilharArquivo";

function CampoWhatsapp({ rotulo, numero }) {
  if (!numero) return null;
  const link = gerarLinkWhatsapp(numero);
  return (
    <div className="detalhe-item">
      <dt>{rotulo}</dt>
      <dd className="mono">
        {link ? (
          <a className="detalhe-link" href={link} target="_blank" rel="noopener noreferrer">
            {numero}
          </a>
        ) : (
          numero
        )}
      </dd>
    </div>
  );
}

function iconeAnexo(tipo) {
  return tipo?.startsWith("image/") ? "🖼️" : "📄";
}

export default function ClientDetailModal({ cliente, onFechar, iniciarEdicao = false }) {
  const { uid, usuario } = useAuth();
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [anexoEmAcao, setAnexoEmAcao] = useState(null);
  const podeCompartilharArquivo = suportaCompartilhamentoArquivo();
  const podeVerAnexos = Boolean(uid && usuario);

  useEffect(() => {
    setEditando(false);
  }, [cliente?.id]);

  useEffect(() => {
    if (cliente && iniciarEdicao) {
      setEditando(true);
    }
  }, [cliente, iniciarEdicao]);

  if (!cliente) return null;

  async function salvar(dados) {
    await atualizarCliente(cliente.id, dados, uid);
    setEditando(false);
  }

  async function excluir() {
    const confirmou = window.confirm("Deseja excluir esta localização?");
    if (!confirmou) return;

    try {
      setExcluindo(true);
      await excluirCliente(cliente.id, cliente.anexos ?? []);
      onFechar();
    } catch (erro) {
      console.error("Falha ao excluir cliente:", erro?.code, erro?.message);
      const mensagem =
        erro?.code === "permission-denied"
          ? "Você não tem permissão para excluir esta localização."
          : "Não foi possível excluir esta localização. Tente novamente.";
      window.alert(mensagem);
    } finally {
      setExcluindo(false);
    }
  }

  async function abrirAnexo(anexo) {
    try {
      setAnexoEmAcao(anexo.caminho);
      await compartilharOuBaixar({ blobOuUrl: anexo.url, nomeArquivo: anexo.nome ?? "anexo" });
    } catch (erro) {
      console.error("Falha ao abrir anexo:", erro);
      window.alert("Não foi possível abrir o anexo.");
    } finally {
      setAnexoEmAcao(null);
    }
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

            {(cliente.seguimento ?? cliente.segmento) ? (
              <div className="detalhe-item">
                <dt>Seguimento</dt>
                <dd>{cliente.seguimento ?? cliente.segmento}</dd>
              </div>
            ) : null}

            {cliente.responsavel ? (
              <div className="detalhe-item">
                <dt>Responsável</dt>
                <dd>{cliente.responsavel}</dd>
              </div>
            ) : null}

            <CampoWhatsapp rotulo="WhatsApp" numero={cliente.whatsapp} />
            <CampoWhatsapp rotulo="WhatsApp 2" numero={cliente.whatsapp2} />
            <CampoWhatsapp rotulo="WhatsApp 3" numero={cliente.whatsapp3} />
          </dl>

          {cliente.observacao ? (
            <div className="detalhe-observacao">
              <span className="campo-rotulo">Observação</span>
              <p>{cliente.observacao}</p>
            </div>
          ) : null}

          {podeVerAnexos && cliente.anexos?.length > 0 ? (
            <div className="detalhe-anexos">
              <span className="campo-rotulo">Anexos</span>
              <ul className="lista-anexos">
                {cliente.anexos.map((anexo) => (
                  <li key={anexo.caminho} className="lista-anexos-item">
                    {anexo.tipo?.startsWith("image/") ? (
                      <img src={anexo.url} alt="" className="lista-anexos-miniatura" />
                    ) : (
                      <span className="lista-anexos-icone" aria-hidden>📄</span>
                    )}
                    <span>{anexo.nome}</span>
                    <Button
                      variant="ghost"
                      onClick={() => abrirAnexo(anexo)}
                      disabled={anexoEmAcao === anexo.caminho}
                    >
                      {podeCompartilharArquivo ? "Compartilhar" : "Baixar"}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ProtectedAction
            fallback={<p className="detalhe-aviso">Entre na sua conta para alterar os dados deste cliente.</p>}
          >
            <div className="detalhe-acoes">
              <Button variant="secondary" onClick={() => setEditando(true)}>
                Alterar dados
              </Button>
              <Button variant="danger" onClick={excluir} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "Excluir localização"}
              </Button>
            </div>
          </ProtectedAction>
        </div>
      )}
    </Modal>
  );
}