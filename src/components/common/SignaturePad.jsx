import { useEffect, useRef, useState } from "react";
import Button from "./Button";

const LARGURA_MAX = 500;
const ALTURA_MAX = 200;

function redimensionarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      img.onload = () => {
        const escala = Math.min(LARGURA_MAX / img.width, ALTURA_MAX / img.height, 1);
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, largura, altura);
        ctx.drawImage(img, 0, 0, largura, altura);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

export default function SignaturePad({ valor, onAlterar }) {
  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);
  const ultimoPontoRef = useRef(null);
  const inputArquivoRef = useRef(null);
  const [vazio, setVazio] = useState(!valor);
  const [modo, setModo] = useState("desenhar"); // "desenhar" | "imagem"
  const [erroImagem, setErroImagem] = useState(null);

  useEffect(() => {
    if (modo !== "desenhar") return;
    const canvas = canvasRef.current;
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
      img.onload = () => ctx.drawImage(img, 0, 0, largura, altura);
      img.src = valor;
      setVazio(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

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
    if (modo === "desenhar") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    setErroImagem(null);
    setVazio(true);
    onAlterar("");
  }

  async function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErroImagem("Selecione um arquivo de imagem.");
      return;
    }
    try {
      setErroImagem(null);
      const dataUrl = await redimensionarImagem(arquivo);
      onAlterar(dataUrl);
      setVazio(false);
    } catch (erro) {
      setErroImagem(erro.message ?? "Não foi possível processar a imagem.");
    }
  }

  function trocarModo(novoModo) {
    if (novoModo === modo) return;
    setModo(novoModo);
    setErroImagem(null);
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    setVazio(true);
    onAlterar("");
  }

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
      ) : (
        <div className="assinatura-upload">
          {valor && !vazio ? (
            <img src={valor} alt="Assinatura enviada" className="assinatura-preview" />
          ) : (
            <span className="assinatura-dica assinatura-dica-upload">Nenhuma imagem selecionada</span>
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
    </div>
  );
}