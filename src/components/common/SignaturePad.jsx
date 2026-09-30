import { useEffect, useRef, useState } from "react";
import Button from "./Button";

export default function SignaturePad({ valor, onAlterar }) {
  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);
  const ultimoPontoRef = useRef(null);
  const [vazio, setVazio] = useState(!valor);

  useEffect(() => {
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
  }, []); // roda só na montagem

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
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVazio(true);
    onAlterar("");
  }

  return (
    <div className="assinatura-campo">
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
      <div className="assinatura-acoes">
        <Button type="button" variant="ghost" onClick={limpar} disabled={vazio}>
          Limpar
        </Button>
      </div>
    </div>
  );
}