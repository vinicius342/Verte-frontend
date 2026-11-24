import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
import RecortadorImagem from "./RecortadorImagem";
import {
  calcularEscuridao,
  carregarImagem,
  gerarAssinatura,
  recortarCanvas,
} from "../../utils/extrairAssinatura";
import "../../styles/assinatura.css";

const SENSIBILIDADE_PADRAO = 50;
// Debounce do slider para não recalcular a imagem a cada pixel arrastado.
const ESPERA_SLIDER = 100;
const ERRO_IMAGEM = "Não foi possível abrir essa imagem. Tente outra.";
const ERRO_SEM_TRACOS =
  "Não encontramos uma assinatura nessa imagem. Tente recortar mais de perto, ou use uma foto mais nítida, com a assinatura em papel branco e boa iluminação.";

function retanguloInicial(largura, altura) {
  return {
    x: Math.round(largura * 0.05),
    y: Math.round(altura * 0.05),
    largura: Math.max(1, Math.round(largura * 0.9)),
    altura: Math.max(1, Math.round(altura * 0.9)),
  };
}

export default function ImportarAssinaturaModal({ arquivo, onConfirmar, onCancelar }) {
  const [arquivoAtual, setArquivoAtual] = useState(arquivo);
  const [etapa, setEtapa] = useState("recortar"); // "recortar" | "confirmar"
  const [canvasBase, setCanvasBase] = useState(null);
  const [retangulo, setRetangulo] = useState(null);
  const [graus, setGraus] = useState(0);
  const [canvasRecortado, setCanvasRecortado] = useState(null);
  const [mapaInfo, setMapaInfo] = useState(null);
  const [sensibilidade, setSensibilidade] = useState(SENSIBILIDADE_PADRAO);
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(null);

  const painelRef = useRef(null);
  const botaoPrincipalRef = useRef(null);
  const inputArquivoRef = useRef(null);
  const focoEtapaRef = useRef(false);
  const onCancelarRef = useRef(onCancelar);
  onCancelarRef.current = onCancelar;

  useEffect(() => {
    setArquivoAtual(arquivo);
  }, [arquivo]);

  // Carrega/recarrega a imagem base. A moldura e a rotação voltam ao inicial aqui.
  useEffect(() => {
    let ativo = true;
    setEtapa("recortar");
    setCanvasBase(null);
    setRetangulo(null);
    setGraus(0);
    setCanvasRecortado(null);
    setMapaInfo(null);
    setResultado(null);
    setErro(null);
    setCarregando(true);
    focoEtapaRef.current = false;

    (async () => {
      try {
        const canvas = await carregarImagem(arquivoAtual);
        if (!ativo) return;
        setCanvasBase(canvas);
        setRetangulo(retanguloInicial(canvas.width, canvas.height));
      } catch (falha) {
        if (ativo) setErro(falha?.message ?? ERRO_IMAGEM);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [arquivoAtual]);

  // O mapa do recorte é calculado uma vez; o slider só reaproveita esse mapa.
  useEffect(() => {
    if (etapa !== "confirmar" || !mapaInfo) return undefined;
    let ativo = true;

    const temporizador = setTimeout(async () => {
      setGerando(true);
      try {
        const dataUrl = await gerarAssinatura(mapaInfo, { sensibilidade });
        if (!ativo) return;
        if (!dataUrl) {
          setResultado(null);
          setErro(ERRO_SEM_TRACOS);
        } else {
          setResultado(dataUrl);
          setErro(null);
        }
      } catch (falha) {
        if (ativo) {
          setResultado(null);
          setErro(falha?.message ?? "Não foi possível extrair a assinatura.");
        }
      } finally {
        if (ativo) setGerando(false);
      }
    }, ESPERA_SLIDER);

    return () => {
      ativo = false;
      clearTimeout(temporizador);
    };
  }, [etapa, mapaInfo, sensibilidade]);

  // Trava a rolagem, fecha com Esc e dá foco ao painel ao abrir.
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painelRef.current?.focus();

    const aoTeclar = (evento) => {
      if (evento.key === "Escape") {
        evento.stopPropagation();
        onCancelarRef.current();
      }
    };
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, []);

  // Foco no botão principal de cada etapa, sem roubar o foco do slider depois.
  useEffect(() => {
    focoEtapaRef.current = false;
    painelRef.current?.focus();
  }, [etapa]);

  useEffect(() => {
    const pronto = etapa === "recortar" ? Boolean(canvasBase) : Boolean(resultado);
    if (pronto && !focoEtapaRef.current) {
      focoEtapaRef.current = true;
      botaoPrincipalRef.current?.focus();
    }
  }, [etapa, canvasBase, resultado]);

  function escolherOutraImagem() {
    if (!inputArquivoRef.current) return;
    inputArquivoRef.current.value = "";
    inputArquivoRef.current.click();
  }

  function aoEscolherOutra(evento) {
    const proximo = evento.target.files?.[0];
    evento.target.value = "";
    if (!proximo) return;
    if (!proximo.type.startsWith("image/")) {
      setErro(ERRO_IMAGEM);
      return;
    }
    setArquivoAtual(proximo);
  }

  function girar() {
    if (!canvasBase) return;
    const proximosGraus = (graus + 90) % 360;
    const trocaLados = proximosGraus % 180 !== 0;
    setGraus(proximosGraus);
    setRetangulo(
      retanguloInicial(
        trocaLados ? canvasBase.height : canvasBase.width,
        trocaLados ? canvasBase.width : canvasBase.height,
      ),
    );
  }

  function continuar(canvasDoRecorte) {
    setCanvasRecortado(canvasDoRecorte);
    setResultado(null);
    setErro(null);
    setCarregando(true);

    (async () => {
      try {
        const info = await calcularEscuridao(canvasDoRecorte);
        setMapaInfo(info);
        setEtapa("confirmar");
      } catch {
        setErro("Não foi possível processar o recorte. Tente ajustar a moldura.");
      } finally {
        setCarregando(false);
      }
    })();
  }

  function voltar() {
    setResultado(null);
    setErro(null);
    setEtapa("recortar");
  }

  function alterarSensibilidade(evento) {
    setSensibilidade(Number(evento.target.value));
    setResultado(null);
    setErro(null);
  }

  function confirmar() {
    if (resultado) onConfirmar(resultado);
  }

  const ajustando =
    etapa === "confirmar" && Boolean(mapaInfo) && !resultado && !erro && !carregando;
  const processando = carregando || gerando || ajustando;

  return createPortal(
    <div className="modal-overlay assinatura-importar" role="presentation">
      <div
        ref={painelRef}
        tabIndex={-1}
        className="modal-painel assinatura-importar__painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assinatura-importar-titulo"
        aria-describedby="assinatura-importar-texto"
      >
        <div className="modal-cabecalho">
          <h2 className="modal-titulo" id="assinatura-importar-titulo">
            {etapa === "recortar" ? "Ajuste a imagem" : "Esta é a sua assinatura?"}
          </h2>
        </div>

        <div className="modal-corpo assinatura-importar__corpo">
          <p className="assinatura-importar__texto" id="assinatura-importar-texto">
            {etapa === "recortar"
              ? "Enquadre só a sua assinatura. Deixe de fora o resto da folha."
              : "Removemos o fundo da imagem. Confira se só a sua assinatura ficou visível."}
          </p>

          <input
            ref={inputArquivoRef}
            type="file"
            accept="image/*"
            onChange={aoEscolherOutra}
            className="assinatura-importar__input-arquivo"
            aria-hidden="true"
            tabIndex={-1}
          />

          {etapa === "recortar" ? (
            <>
              {carregando ? (
                <div className="assinatura-importar__carregando" role="status">
                  Carregando imagem…
                </div>
              ) : null}
              {!carregando && erro ? (
                <p className="assinatura-importar__erro" role="alert">
                  {erro}
                </p>
              ) : null}
              {!carregando && !erro && canvasBase && retangulo ? (
                <RecortadorImagem
                  canvas={canvasBase}
                  valor={retangulo}
                  graus={graus}
                  onAlterar={setRetangulo}
                  onGirar={girar}
                />
              ) : null}
              {!carregando && canvasBase && retangulo ? (
                <div className="assinatura-importar__acoes">
                  <Button
                    ref={botaoPrincipalRef}
                    variant="primary"
                    className="assinatura-importar__botao"
                    onClick={() => continuar(recortarCanvas(canvasBase, retangulo, graus))}
                    disabled={carregando}
                  >
                    Continuar
                  </Button>
                  <Button
                    variant="secondary"
                    className="assinatura-importar__botao"
                    onClick={escolherOutraImagem}
                  >
                    Escolher outra imagem
                  </Button>
                  <Button
                    variant="ghost"
                    className="assinatura-importar__botao"
                    onClick={onCancelar}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : null}
              {!carregando && !canvasBase ? (
                <div className="assinatura-importar__acoes">
                  <Button variant="primary" className="assinatura-importar__botao" disabled>
                    Continuar
                  </Button>
                  <Button
                    variant="secondary"
                    className="assinatura-importar__botao"
                    onClick={escolherOutraImagem}
                  >
                    Escolher outra imagem
                  </Button>
                  <Button
                    variant="ghost"
                    className="assinatura-importar__botao"
                    onClick={onCancelar}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="assinatura-importar__folha">
                {resultado ? (
                  <img
                    src={resultado}
                    alt="Prévia da assinatura extraída"
                    className="assinatura-importar__imagem"
                  />
                ) : null}
                {processando ? (
                  <span className="assinatura-importar__estado" role="status">
                    Processando imagem…
                  </span>
                ) : null}
                {!processando && erro ? (
                  <p className="assinatura-importar__erro" role="alert">
                    {erro}
                  </p>
                ) : null}
              </div>

              <div className="assinatura-importar__controle">
                <label
                  className="assinatura-importar__rotulo"
                  htmlFor="assinatura-importar-sensibilidade"
                >
                  Sensibilidade <strong>{sensibilidade}</strong>
                </label>
                <input
                  id="assinatura-importar-sensibilidade"
                  className="assinatura-importar__slider"
                  type="range"
                  min="0"
                  max="100"
                  value={sensibilidade}
                  onChange={alterarSensibilidade}
                />
                <span className="assinatura-importar__dica">
                  Aumente se a assinatura estiver falhada. Diminua se aparecer sujeira.
                </span>
              </div>

              <div className="assinatura-importar__acoes">
                <Button
                  ref={botaoPrincipalRef}
                  variant="primary"
                  className="assinatura-importar__botao"
                  onClick={confirmar}
                  disabled={!resultado}
                >
                  Sim, é a minha assinatura
                </Button>
                <Button variant="secondary" className="assinatura-importar__botao" onClick={voltar}>
                  Voltar e ajustar o recorte
                </Button>
                <Button variant="ghost" className="assinatura-importar__botao" onClick={onCancelar}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
