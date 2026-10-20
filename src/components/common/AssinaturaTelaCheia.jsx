import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/assinatura.css";

const LARGURA_TRACO = 2.5;
const COR_TRACO = "#111";
const MARGEM_EXPORTACAO = 12;
// Mesmo limite do upload de imagem no SignaturePad
const LARGURA_MAX = 500;
const ALTURA_MAX = 200;

function desenharTracos(ctx, tracos) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = COR_TRACO;
  ctx.fillStyle = COR_TRACO;
  ctx.lineWidth = LARGURA_TRACO;

  for (const t of tracos) {
    if (t.length === 1) {
      ctx.beginPath();
      ctx.arc(t[0].x, t[0].y, LARGURA_TRACO / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(t[0].x, t[0].y);
    for (let i = 1; i < t.length; i++) {
      const meioX = (t[i - 1].x + t[i].x) / 2;
      const meioY = (t[i - 1].y + t[i].y) / 2;
      ctx.quadraticCurveTo(t[i - 1].x, t[i - 1].y, meioX, meioY);
    }
    const ultimo = t[t.length - 1];
    ctx.lineTo(ultimo.x, ultimo.y);
    ctx.stroke();
  }
}

// Exporta só a área assinada (com margem), em PNG de fundo transparente,
// ajustado para caber em 500x200 mantendo a proporção.
function exportarPng(tracos) {
  const pontos = tracos.flat();
  if (pontos.length === 0) return null;

  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const minX = Math.min(...xs) - MARGEM_EXPORTACAO;
  const minY = Math.min(...ys) - MARGEM_EXPORTACAO;
  const largura = Math.max(...xs) + MARGEM_EXPORTACAO - minX;
  const altura = Math.max(...ys) + MARGEM_EXPORTACAO - minY;

  const escala = Math.min(LARGURA_MAX / largura, ALTURA_MAX / altura, 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(largura * escala));
  canvas.height = Math.max(1, Math.round(altura * escala));

  const ctx = canvas.getContext("2d");
  ctx.scale(escala, escala);
  ctx.translate(-minX, -minY);
  desenharTracos(ctx, tracos);
  return canvas.toDataURL("image/png");
}

export default function AssinaturaTelaCheia({ onConfirmar, onCancelar }) {
  const areaRef = useRef(null);
  const canvasRef = useRef(null);
  const tracos = useRef([]); // cada traço é uma lista de pontos {x, y} em px CSS
  const tracoAtual = useRef(null);
  const tamanho = useRef({ w: 0, h: 0 });
  const [temTraco, setTemTraco] = useState(false);
  const [emRetrato, setEmRetrato] = useState(
    () => window.matchMedia("(orientation: portrait)").matches,
  );

  const redesenhar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, tamanho.current.w, tamanho.current.h);
    desenharTracos(ctx, tracos.current);
  }, []);

  const ajustarTamanho = useCallback(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;
    const { width, height } = area.getBoundingClientRect();
    if (!width || !height) return;

    // Ao girar o aparelho, mantém o desenho proporcional
    const anterior = tamanho.current;
    if (anterior.w && anterior.w !== width) {
      const f = width / anterior.w;
      tracos.current = tracos.current.map((t) => t.map((p) => ({ x: p.x * f, y: p.y * f })));
    }

    const dpr = window.devicePixelRatio || 1;
    tamanho.current = { w: width, h: height };
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    redesenhar();
  }, [redesenhar]);

  useEffect(() => {
    ajustarTamanho();
    const observador = new ResizeObserver(ajustarTamanho);
    observador.observe(areaRef.current);
    return () => observador.disconnect();
  }, [ajustarTamanho]);

  // Acompanha a orientação para mostrar o aviso "gire o celular"
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const aoMudar = (e) => setEmRetrato(e.matches);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  // Trava a rolagem da página e tenta forçar a horizontal (Android/Chrome).
  // No iOS o bloqueio não é suportado: o aviso de girar o celular cobre esse caso.
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    (async () => {
      try {
        if (document.fullscreenEnabled && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
        await window.screen.orientation.lock("landscape");
      } catch {
        // sem suporte ou sem permissão: segue normalmente
      }
    })();

    return () => {
      document.body.style.overflow = overflowAnterior;
      try {
        window.screen.orientation.unlock();
      } catch {
        /* ignora */
      }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  function posicao(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function iniciar(e) {
    if (!e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = posicao(e);
    tracoAtual.current = [p];
    tracos.current.push(tracoAtual.current);
    setTemTraco(true);
    redesenhar();
  }

  function mover(e) {
    const traco = tracoAtual.current;
    if (!traco) return;
    const p = posicao(e);
    const anterior = traco[traco.length - 1];
    traco.push(p);

    const ctx = canvasRef.current.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = COR_TRACO;
    ctx.lineWidth = LARGURA_TRACO;
    ctx.beginPath();
    ctx.moveTo(anterior.x, anterior.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function finalizar() {
    if (!tracoAtual.current) return;
    tracoAtual.current = null;
    redesenhar(); // redesenha suavizado
  }

  function limpar() {
    tracos.current = [];
    tracoAtual.current = null;
    setTemTraco(false);
    redesenhar();
  }

  function concluir() {
    const dataUrl = exportarPng(tracos.current);
    if (dataUrl) onConfirmar(dataUrl);
  }

  return createPortal(
    <div className="assinatura-tela" role="dialog" aria-modal="true" aria-label="Assinar">
      <div className="assinatura-tela__barra">
        <button type="button" className="assinatura-tela__botao" onClick={onCancelar}>
          Cancelar
        </button>
        <span className="assinatura-tela__titulo">Assine abaixo</span>
        <div className="assinatura-tela__acoes">
          <button type="button" className="assinatura-tela__botao" onClick={limpar} disabled={!temTraco}>
            Limpar
          </button>
          <button
            type="button"
            className="assinatura-tela__botao assinatura-tela__botao--primario"
            onClick={concluir}
            disabled={!temTraco}
          >
            Concluir
          </button>
        </div>
      </div>

      {emRetrato ? (
        <p className="assinatura-tela__aviso">Gire o celular na horizontal para assinar com mais espaço.</p>
      ) : null}

      <div className="assinatura-tela__area" ref={areaRef}>
        <canvas
          ref={canvasRef}
          className="assinatura-tela__canvas"
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={finalizar}
          onPointerCancel={finalizar}
        />
        {!temTraco ? <span className="assinatura-tela__dica">Assine aqui</span> : null}
        <div className="assinatura-tela__linha" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}