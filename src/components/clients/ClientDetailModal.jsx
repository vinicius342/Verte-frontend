import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ClientForm from "./ClientForm";
import ProtectedAction from "../common/ProtectedAction";
import { useAuth } from "../../hooks/useAuth";
import { useTutorial } from "../../contexts/TutorialContext";
import { atualizarCliente, excluirCliente, buscarPrivadoCliente } from "../../services/clientService";
import { buscarConfiguracao } from "../../services/configService";
import { abrirMapa, gerarLinkWhatsapp } from "../../utils/mapLinks";
import { compartilharOuBaixar, suportaCompartilhamentoArquivo } from "../../utils/compartilharArquivo";
import { formatarCep } from "../../utils/validators";
import { textoLocalizacaoAproximada } from "../../utils/distancia";

function CampoWhatsapp({ rotulo, numero, dataTour }) {
  if (!numero) return null;
  const link = gerarLinkWhatsapp(numero);
  return (
    <div className="detalhe-item" data-tour={dataTour}>
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

function textoCadastroContatos(cliente, rota) {
  const telefones = [cliente.whatsapp, cliente.whatsapp2, cliente.whatsapp3]
    .filter((t) => t?.trim())
    .map((t) => `*Tel:* ${t.trim()}`);

  return [
    `*CADASTRAR NUM DE TEL ROTA ${rota ?? ""}*`.trim(),
    "",
    `*Cod PDV:* ${cliente.codPdv ?? ""}`,
    `*Razão PDV:* ${cliente.nomeCliente ?? ""}`,
    `*Fantasia:* ${cliente.nomeComercio ?? ""}`,
    `*Seguimento:* ${cliente.seguimento ?? cliente.segmento ?? ""}`,
    ...telefones,
    `*Resp:* ${cliente.responsavel ?? ""}`,
  ].join("\n");
}

export default function ClientDetailModal({ cliente, onFechar, iniciarEdicao = false, recemCriado = false }) {
  const { uid, usuario, revendedoraId, ehMotorista } = useAuth();
  const { iniciarTutorialDetalhe } = useTutorial();
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [anexoEmAcao, setAnexoEmAcao] = useState(null);
  const [rota, setRota] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [privado, setPrivado] = useState(null);
  const [privadoCarregado, setPrivadoCarregado] = useState(false);
  const [rotaCarregada, setRotaCarregada] = useState(false);
  const podeCompartilharArquivo = suportaCompartilhamentoArquivo();
  const logado = Boolean(uid && usuario);
  const podeVerAnexos = logado && !ehMotorista;

  useEffect(() => {
    setEditando(false);
    setPrivado(null);
    setPrivadoCarregado(false);
    setRotaCarregada(false);
  }, [cliente?.id]);

  useEffect(() => {
    if (ehMotorista) setEditando(false);
  }, [ehMotorista]);

  useEffect(() => {
    if (cliente && iniciarEdicao && !ehMotorista) {
      setEditando(true);
    }
  }, [cliente, iniciarEdicao, ehMotorista]);

  useEffect(() => {
    if (!cliente || !revendedoraId) return;
    let ativo = true;
    buscarPrivadoCliente(revendedoraId, cliente.id)
      .then((dados) => { if (ativo) setPrivado(dados); })
      .catch((erro) => console.error("Falha ao buscar dados privados do cliente:", erro))
      .finally(() => { if (ativo) setPrivadoCarregado(true); });
    return () => { ativo = false; };
  }, [cliente?.id, revendedoraId]);

  useEffect(() => {
    if (!cliente || !logado || ehMotorista) return;
    let ativo = true;
    buscarConfiguracao(uid)
      .then((config) => {
        if (ativo) setRota(config?.codigoVendedor ?? "");
      })
      .catch(() => { })
      .finally(() => {
        if (ativo) setRotaCarregada(true);
      });
    return () => {
      ativo = false;
    };
  }, [cliente, uid, logado, ehMotorista]);

  const etapasDetalhe = useMemo(() => {
    if (!cliente || ehMotorista) return [];
    const dados = { ...cliente, ...(privado ?? {}) };
    const lista = [
      {
        id: "detalhe-cliente-cabecalho",
        alvo: '[data-tour="detalhe-cliente-cabecalho"]',
        titulo: "Cliente cadastrado!",
        texto: "Seu cliente foi salvo. Veja o que cada botão faz.",
      },
      {
        id: "detalhe-cliente-mapa",
        alvo: '[data-tour="detalhe-cliente-mapa"]',
        titulo: "Mapa",
        texto: "Abre a localização do cliente no mapa.",
      },
    ];

    if (dados.whatsapp) {
      lista.push({
        id: "detalhe-cliente-whatsapp",
        alvo: '[data-tour="detalhe-cliente-whatsapp"]',
        titulo: "WhatsApp",
        texto: "Toque no número para chamar o cliente no WhatsApp.",
      });
    }

    if (logado) {
      lista.push({
        id: "detalhe-cliente-copiar",
        alvo: '[data-tour="detalhe-cliente-copiar"]',
        titulo: "Copiar cadastro",
        texto: "Copia este texto pronto para você colar no WhatsApp.",
        preConteudo: textoCadastroContatos(dados, rota),
      });
    }

    if (podeVerAnexos && dados.anexos?.length > 0) {
      lista.push({
        id: "detalhe-cliente-anexos",
        alvo: '[data-tour="detalhe-cliente-anexos"]',
        titulo: "Anexos",
        texto: "Compartilhe ou baixe as fotos e documentos do cliente.",
      });
    }

    lista.push({
      id: "detalhe-cliente-alterar",
      alvo: '[data-tour="detalhe-cliente-alterar"]',
      titulo: "Alterar",
      texto: "Edite os dados do cliente quando precisar.",
    });
    lista.push({
      id: "detalhe-cliente-excluir",
      alvo: '[data-tour="detalhe-cliente-excluir"]',
      titulo: "Excluir",
      texto: "Remove o cliente. O app pede confirmação antes.",
    });

    return lista;
  }, [cliente, privado, rota, ehMotorista, logado, podeVerAnexos]);

  useEffect(() => {
    if (!cliente?.id || !recemCriado || editando || ehMotorista) return;
    if (!privadoCarregado || !rotaCarregada) return;
    iniciarTutorialDetalhe("detalheCliente", etapasDetalhe);
  }, [
    cliente?.id,
    recemCriado,
    editando,
    ehMotorista,
    privadoCarregado,
    rotaCarregada,
    etapasDetalhe,
    iniciarTutorialDetalhe,
  ]);

  if (!cliente) return null;
  const clientePrivado = { ...cliente, ...(privado ?? {}) };
  const localizacaoAproximada = textoLocalizacaoAproximada(cliente);

  async function salvar(dados) {
    await atualizarCliente(revendedoraId, cliente.id, dados, uid);
    setEditando(false);
  }

  async function excluir() {
    const confirmou = window.confirm("Deseja excluir esta localização?");
    if (!confirmou) return;

    try {
      setExcluindo(true);
      await excluirCliente(revendedoraId, cliente.id);
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

  async function copiarContatos() {
    try {
      await navigator.clipboard.writeText(textoCadastroContatos(clientePrivado, rota));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      console.error("Falha ao copiar:", erro);
      window.alert("Não foi possível copiar.");
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
    <Modal
      aberto={Boolean(cliente)}
      titulo={editando ? "Alterar dados" : cliente.nomeCliente}
      onFechar={onFechar}
      dataTourCabecalho="detalhe-cliente-cabecalho"
    >
      {editando ? (
        <ClientForm
          cliente={clientePrivado}
          onSalvar={salvar}
          onCancelar={() => setEditando(false)}
          textoSalvar="Salvar alterações"
        />
      ) : (
        <div className="detalhe">
          {cliente.nomeComercio ? <p className="detalhe-comercio">{cliente.nomeComercio}</p> : null}

          <Button
            variant="map"
            className="botao-mapa"
            data-tour="detalhe-cliente-mapa"
            onClick={() => abrirMapa(cliente)}
          >
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

            {cliente.bairro ? (
              <div className="detalhe-item">
                <dt>Bairro</dt>
                <dd>{cliente.bairro}</dd>
              </div>
            ) : null}

            {cliente.cidade ? (
              <div className="detalhe-item">
                <dt>Cidade</dt>
                <dd>{cliente.cidade}</dd>
              </div>
            ) : null}

            {cliente.cep ? (
              <div className="detalhe-item">
                <dt>CEP</dt>
                <dd className="mono">{formatarCep(cliente.cep)}</dd>
              </div>
            ) : null}

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

            <CampoWhatsapp
              rotulo="WhatsApp"
              numero={clientePrivado.whatsapp}
              dataTour="detalhe-cliente-whatsapp"
            />
            <CampoWhatsapp rotulo="WhatsApp 2" numero={clientePrivado.whatsapp2} />
            <CampoWhatsapp rotulo="WhatsApp 3" numero={clientePrivado.whatsapp3} />
          </dl>

          {localizacaoAproximada ? <p className="detalhe-aviso">{localizacaoAproximada}</p> : null}

          {cliente.observacao ? (
            <div className="detalhe-observacao">
              <span className="campo-rotulo">Observação</span>
              <p>{cliente.observacao}</p>
            </div>
          ) : null}

          {!ehMotorista && logado ? (
            <div className="detalhe-copia-contatos">
              <span className="campo-rotulo">Cadastro de contatos</span>
              <Button variant="ghost" data-tour="detalhe-cliente-copiar" onClick={copiarContatos}>
                {copiado ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          ) : null}

          {podeVerAnexos && clientePrivado.anexos?.length > 0 ? (
            <div className="detalhe-anexos" data-tour="detalhe-cliente-anexos">
              <span className="campo-rotulo">Anexos</span>
              <ul className="lista-anexos">
                {clientePrivado.anexos.map((anexo) => (
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

          {!ehMotorista && <ProtectedAction
            fallback={<p className="detalhe-aviso">Entre na sua conta para alterar os dados deste cliente.</p>}
          >
            <div className="detalhe-acoes">
              <Button
                variant="secondary"
                data-tour="detalhe-cliente-alterar"
                onClick={() => setEditando(true)}
              >
                Alterar
              </Button>
              <Button
                variant="danger"
                data-tour="detalhe-cliente-excluir"
                onClick={excluir}
                disabled={excluindo}
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </ProtectedAction>}
        </div>
      )}
    </Modal>
  );
}
