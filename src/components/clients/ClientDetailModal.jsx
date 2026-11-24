import { useEffect, useMemo, useState } from "react";
import { Check, Share2 } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ClientForm from "./ClientForm";
import ProtectedAction from "../common/ProtectedAction";
import { useAuth } from "../../hooks/useAuth";
import { useTutorial } from "../../contexts/TutorialContext";
import {
  atualizarCliente,
  excluirCliente,
  buscarPrivadoCliente,
} from "../../services/clientService";
import {
  abrirMapa,
  gerarLinkGoogleMaps,
  gerarLinkWhatsapp,
  textoCompartilharLocalizacao,
} from "../../utils/mapLinks";
import {
  compartilharOuBaixar,
  suportaCompartilhamentoArquivo,
} from "../../utils/compartilharArquivo";
import { formatarCep } from "../../utils/validators";
import { rotuloDaRota } from "../../utils/rotasCliente";
import { textoLocalizacaoAproximada } from "../../utils/distancia";

function CampoWhatsapp({ rotulo, numero, dataTour }) {
  const numeroExibido = String(numero ?? "").trim();
  if (!numeroExibido) return null;
  const link = gerarLinkWhatsapp(numeroExibido);
  return (
    <div className="detalhe-item" data-tour={dataTour}>
      <dt>{rotulo}</dt>
      <dd className="mono">
        {link ? (
          <a className="detalhe-link" href={link} target="_blank" rel="noopener noreferrer">
            {numeroExibido}
          </a>
        ) : (
          numeroExibido
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

function revendaDoId(revendedoraId) {
  const partes = String(revendedoraId ?? "")
    .split("-")
    .filter(Boolean);
  if (partes.length < 2) return String(revendedoraId ?? "").toUpperCase();
  const codigoRevenda = partes[partes.length - 1];
  const nomeRevenda = partes.slice(0, -1).join(" ").toUpperCase();
  return `${codigoRevenda} / ${nomeRevenda}`;
}

function textoCadastroCliente(cliente, { codigo, nome, revendedoraId }) {
  const telefones = [cliente.whatsapp, cliente.whatsapp2, cliente.whatsapp3]
    .map((t) => String(t ?? "").replace(/\D/g, ""))
    .filter(Boolean)
    .map((t) => `*N° TEL:* ${t}`);

  const canal =
    [cliente.seguimento, cliente.segmento].find((v) => typeof v === "string" && v.trim()) ?? "";
  const ruaNumero = [cliente.rua, cliente.numero]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(",");
  const comBairro = [ruaNumero, String(cliente.bairro ?? "").trim()].filter(Boolean).join("-");
  const endereco = `${[comBairro, String(cliente.cidade ?? "").trim()].filter(Boolean).join(", ")} .`;
  const cep = cliente.cep ? formatarCep(cliente.cep) : "";
  const rota = cliente.rota ? rotuloDaRota(cliente.rota) : "";

  return [
    `*CADASTRO NOVO ${codigo ?? ""}*`.trim(),
    "",
    `*REVENDA:* ${revendaDoId(revendedoraId)}`,
    `*VENDEDOR:* ${`${codigo ?? ""} ${nome ?? ""}`.trim().toUpperCase()}`,
    `*RAZÃO SOCIAL:* ${cliente.nomeCliente ?? ""}`,
    `*FANTASIA:* ${cliente.nomeComercio ?? ""}`,
    `*CNPJ/CPF:* ${cliente.cpf ?? ""}`,
    `*CANAL:* ${canal.trim()}`,
    `*CONTATO:* ${cliente.responsavel ?? ""}`,
    ...telefones,
    `*ENDEREÇO:* ${endereco}`,
    ...(cep ? [`*CEP:* ${cep}`] : []),
    ...(rota ? [`*ROTA:* ${rota}`] : []),
  ].join("\n");
}

export default function ClientDetailModal({
  cliente,
  onFechar,
  iniciarEdicao = false,
  recemCriado = false,
}) {
  const { uid, usuario, revendedoraId, ehMotorista, codigo, nome } = useAuth();
  const { iniciarTutorialDetalhe } = useTutorial();
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [anexoEmAcao, setAnexoEmAcao] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [copiadoCadastro, setCopiadoCadastro] = useState(false);
  const [privado, setPrivado] = useState(null);
  const [privadoCarregado, setPrivadoCarregado] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const linkMapa = useMemo(() => gerarLinkGoogleMaps(cliente), [cliente]);
  const podeCompartilharArquivo = suportaCompartilhamentoArquivo();
  const logado = Boolean(uid && usuario);
  const podeVerAnexos = logado && !ehMotorista;

  useEffect(() => {
    setEditando(false);
    setPrivado(null);
    setPrivadoCarregado(false);
    setLinkCopiado(false);
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
      .then((dados) => {
        if (ativo) setPrivado(dados);
      })
      .catch((erro) => console.error("Falha ao buscar dados privados do cliente:", erro))
      .finally(() => {
        if (ativo) setPrivadoCarregado(true);
      });
    return () => {
      ativo = false;
    };
  }, [cliente?.id, revendedoraId]);

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
      ...(linkMapa
        ? [
            {
              id: "detalhe-cliente-compartilhar-local",
              alvo: '[data-tour="detalhe-cliente-compartilhar-local"]',
              titulo: "Compartilhar localização",
              texto:
                "Envie a localização do cliente com o link do Google Maps, por WhatsApp ou outro app.",
            },
          ]
        : []),
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
        preConteudo: textoCadastroContatos(dados, codigo),
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
  }, [cliente, privado, codigo, ehMotorista, logado, podeVerAnexos, linkMapa]);

  useEffect(() => {
    if (!cliente?.id || !recemCriado || editando || ehMotorista) return;
    if (!privadoCarregado) return;
    iniciarTutorialDetalhe("detalheCliente", etapasDetalhe);
  }, [
    cliente?.id,
    recemCriado,
    editando,
    ehMotorista,
    privadoCarregado,
    etapasDetalhe,
    iniciarTutorialDetalhe,
  ]);

  if (!cliente) return null;
  const clientePrivado = { ...cliente, ...(privado ?? {}) };
  const localizacaoAproximada = textoLocalizacaoAproximada(cliente);

  async function salvar(dados) {
    await atualizarCliente(revendedoraId, cliente.id, dados, uid);
    setPrivadoCarregado(false);
    const dadosPrivadosAtualizados = await buscarPrivadoCliente(revendedoraId, cliente.id);
    setPrivado(dadosPrivadosAtualizados);
    setPrivadoCarregado(true);
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
      await navigator.clipboard.writeText(textoCadastroContatos(clientePrivado, codigo));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      console.error("Falha ao copiar:", erro);
      window.alert("Não foi possível copiar.");
    }
  }

  async function copiarCadastroCliente() {
    try {
      await navigator.clipboard.writeText(
        textoCadastroCliente(clientePrivado, { codigo, nome, revendedoraId }),
      );
      setCopiadoCadastro(true);
      setTimeout(() => setCopiadoCadastro(false), 2000);
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

  async function compartilharLocalizacao() {
    const texto = textoCompartilharLocalizacao(cliente);
    if (!texto) return;
    const titulo = cliente.nomeCliente || cliente.nome || cliente.nomeComercio || "Cliente";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        // O link já está na última linha: passar `url` duplicaria o link em alguns apps.
        await navigator.share({ title: titulo, text: texto });
        return;
      } catch (erro) {
        if (erro?.name === "AbortError") return;
        if (erro?.name !== "NotAllowedError" && !(erro instanceof TypeError)) {
          console.error("Falha ao compartilhar localização:", erro);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(texto);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch (erro) {
      console.error("Falha ao copiar localização:", erro);
      window.alert("Não foi possível compartilhar a localização.");
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

          <div className="detalhe-mapa-linha">
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
            {linkMapa ? (
              <Button
                variant="secondary"
                className="detalhe-compartilhar-local"
                data-tour="detalhe-cliente-compartilhar-local"
                onClick={compartilharLocalizacao}
                aria-label={linkCopiado ? "Link copiado!" : "Compartilhar localização"}
                title={linkCopiado ? "Link copiado!" : "Compartilhar localização"}
              >
                {linkCopiado ? (
                  <Check size={20} aria-hidden="true" />
                ) : (
                  <Share2 size={20} aria-hidden="true" />
                )}
              </Button>
            ) : null}
          </div>

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

            {cliente.rota ? (
              <div className="detalhe-item">
                <dt>Rota</dt>
                <dd>{rotuloDaRota(cliente.rota)}</dd>
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

          {!ehMotorista && logado ? (
            <div className="detalhe-copia-contatos">
              <span className="campo-rotulo">Cadastro do cliente</span>
              <Button variant="ghost" onClick={copiarCadastroCliente}>
                {copiadoCadastro ? "Copiado!" : "Copiar"}
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
                      <span className="lista-anexos-icone" aria-hidden>
                        📄
                      </span>
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

          {!ehMotorista && (
            <ProtectedAction
              fallback={
                <p className="detalhe-aviso">
                  Entre na sua conta para alterar os dados deste cliente.
                </p>
              }
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
            </ProtectedAction>
          )}
        </div>
      )}
    </Modal>
  );
}
