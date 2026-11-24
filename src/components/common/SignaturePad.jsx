import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import AssinaturaTelaCheia from "./AssinaturaTelaCheia";
import ImportarAssinaturaModal from "./ImportarAssinaturaModal";
import "../../styles/assinatura.css";

// Celular (toque) ou tela estreita: desenhar abre uma tela cheia em vez do canvas pequeno.
const CONSULTA_MOBILE = "(pointer: coarse), (max-width: 640px)";

function useEhMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(CONSULTA_MOBILE).matches);

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA_MOBILE);
    const aoMudar = (e) => setMobile(e.matches);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return mobile;
}

export default function SignaturePad({ valor, onAlterar }) {
  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);
  const ultimoPontoRef = useRef(null);
  const inputArquivoRef = useRef(null);
  const mobile = useEhMobile();
  const [vazio, setVazio] = useState(!valor);
  const [modo, setModo] = useState("desenhar"); // "desenhar" | "imagem"
  const [erroImagem, setErroImagem] = useState(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [arquivoPendente, setArquivoPendente] = useState(null);

  useEffect(() => {
    if (modo !== "desenhar" || mobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const largura = canvas.offsetWidth;
    const altura = canvas.offsetHeight;
    canvas.width = largura * dpr;
    canvas.height = altura * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    if (valor) {
      const img = new Image();
      img.onload = () => {
        // Mantém a proporção (assinaturas feitas no celular têm tamanho próprio)
        const escala = Math.min(largura / img.width, altura / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (largura - w) / 2, (altura - h) / 2, w, h);
      };
      img.src = valor;
      setVazio(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, mobile]);

  function posicaoRelativa(evento) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: evento.clientX - rect.left, y: evento.clientY - rect.top };
  }

  function iniciar(evento) {
    evento.preventDefault();
    canvasRef.current.setPointerCapture(evento.pointerId);
    desenhandoRef.current = true;
    ultimoPontoRef.current = posicaoRelativa(evento);
  }

  function desenhar(evento) {
    if (!desenhandoRef.current) return;
    evento.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const ponto = posicaoRelativa(evento);
    ctx.beginPath();
    ctx.moveTo(ultimoPontoRef.current.x, ultimoPontoRef.current.y);
    ctx.lineTo(ponto.x, ponto.y);
    ctx.stroke();
    ultimoPontoRef.current = ponto;
    if (vazio) setVazio(false);
  }

  function finalizar() {
    if (!desenhandoRef.current) return;
    desenhandoRef.current = false;
    onAlterar(canvasRef.current.toDataURL("image/png"));
  }

  function limpar() {
    const canvas = canvasRef.current;
    if (modo === "desenhar" && canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    setArquivoPendente(null);
    setErroImagem(null);
    setVazio(true);
    onAlterar("");
  }

  function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErroImagem("Selecione um arquivo de imagem.");
      return;
    }
    setErroImagem(null);
    setArquivoPendente(arquivo);
  }

  function fecharImportacao() {
    setArquivoPendente(null);
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  }

  function confirmarImportacao(dataUrl) {
    onAlterar(dataUrl);
    setVazio(false);
    setErroImagem(null);
    fecharImportacao();
  }

  function trocarModo(novoModo) {
    if (novoModo === modo) return;
    setModo(novoModo);
    setErroImagem(null);
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    setArquivoPendente(null);
    setVazio(true);
    onAlterar("");
  }

  const temAssinatura = Boolean(valor) && !vazio;

  return (
    <div className="assinatura-campo">
      <div className="assinatura-alternador">
        <button
          type="button"
          className={modo === "desenhar" ? "assinatura-aba assinatura-aba-ativa" : "assinatura-aba"}
          onClick={() => trocarModo("desenhar")}
        >
          Desenhar
        </button>
        <button
          type="button"
          className={modo === "imagem" ? "assinatura-aba assinatura-aba-ativa" : "assinatura-aba"}
          onClick={() => trocarModo("imagem")}
        >
          Enviar imagem
        </button>
      </div>

      {modo === "desenhar" ? (
        mobile ? (
          <div className="assinatura-mobile">
            <div className="assinatura-mobile__previa">
              {temAssinatura ? (
                <img src={valor} alt="Sua assinatura" className="assinatura-mobile__imagem" />
              ) : (
                <span className="assinatura-mobile__vazio">Nenhuma assinatura</span>
              )}
            </div>
            <button
              type="button"
              className="assinatura-mobile__botao"
              onClick={() => setTelaCheia(true)}
            >
              {temAssinatura ? "Refazer assinatura" : "Assinar"}
            </button>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="assinatura-canvas"
              onPointerDown={iniciar}
              onPointerMove={desenhar}
              onPointerUp={finalizar}
              onPointerLeave={finalizar}
              onPointerCancel={finalizar}
            />
            {vazio ? <span className="assinatura-dica">Assine aqui</span> : null}
          </>
        )
      ) : (
        <div className="assinatura-upload">
          {valor && !vazio ? (
            <img src={valor} alt="Assinatura enviada" className="assinatura-preview" />
          ) : (
            <span className="assinatura-dica assinatura-dica-upload">
              Nenhuma imagem selecionada
            </span>
          )}
          <input
            ref={inputArquivoRef}
            type="file"
            accept="image/*"
            onChange={selecionarArquivo}
            className="assinatura-input-arquivo"
          />
          {erroImagem ? <span className="campo-erro">{erroImagem}</span> : null}
        </div>
      )}

      <div className="assinatura-acoes">
        <Button type="button" variant="ghost" onClick={limpar} disabled={vazio}>
          Limpar
        </Button>
      </div>

      {telaCheia ? (
        <AssinaturaTelaCheia
          onCancelar={() => setTelaCheia(false)}
          onConfirmar={(dataUrl) => {
            onAlterar(dataUrl);
            setVazio(false);
            setTelaCheia(false);
          }}
        />
      ) : null}

      {arquivoPendente ? (
        <ImportarAssinaturaModal
          arquivo={arquivoPendente}
          onConfirmar={confirmarImportacao}
          onCancelar={fecharImportacao}
        />
      ) : null}
    </div>
  );
}
