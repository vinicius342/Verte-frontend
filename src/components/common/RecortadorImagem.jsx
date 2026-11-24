import { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";
import { rotacionarCanvas } from "../../utils/extrairAssinatura";
import "../../styles/assinatura.css";

const TAMANHO_MINIMO = 40; // px da imagem
const PASSO_TECLADO = 4;

// "o" = esquerda (oeste), "l" = direita (leste).
const ALCAS = [
  { id: "no", rotulo: "canto superior esquerdo", cursor: "nwse-resize" },
  { id: "n", rotulo: "topo", cursor: "ns-resize" },
  { id: "ne", rotulo: "canto superior direito", cursor: "nesw-resize" },
  { id: "o", rotulo: "lado esquerdo", cursor: "ew-resize" },
  { id: "l", rotulo: "lado direito", cursor: "ew-resize" },
  { id: "so", rotulo: "canto inferior esquerdo", cursor: "nesw-resize" },
  { id: "s", rotulo: "base", cursor: "ns-resize" },
  { id: "se", rotulo: "canto inferior direito", cursor: "nwse-resize" },
];

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

export default function RecortadorImagem({ canvas, valor, graus, onAlterar, onGirar }) {
  const areaRef = useRef(null);
  const imagemRef = useRef(null);
  const molduraRef = useRef(null);
  const arrastoRef = useRef(null);
  const [area, setArea] = useState({ largura: 0, altura: 0 });

  const dimensoesImagem = useMemo(
    () => ({
      largura: graus % 180 === 0 ? canvas.width : canvas.height,
      altura: graus % 180 === 0 ? canvas.height : canvas.width,
    }),
    [canvas, graus],
  );

  // A foto original já vem orientada; exibimos a rotação escolhida pelo usuário.
  const canvasExibicao = useMemo(() => rotacionarCanvas(canvas, graus), [canvas, graus]);

  useEffect(() => {
    const alvo = imagemRef.current;
    if (!alvo) return;
    alvo.width = canvasExibicao.width;
    alvo.height = canvasExibicao.height;
    const ctx = alvo.getContext("2d");
    ctx.clearRect(0, 0, alvo.width, alvo.height);
    ctx.drawImage(canvasExibicao, 0, 0);
  }, [canvasExibicao]);

  useEffect(() => {
    const elemento = areaRef.current;
    if (!elemento) return undefined;
    const observador = new ResizeObserver(([entrada]) => {
      setArea({ largura: entrada.contentRect.width, altura: entrada.contentRect.height });
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const escala =
    area.largura && area.altura
      ? Math.min(area.largura / dimensoesImagem.largura, area.altura / dimensoesImagem.altura)
      : 0;
  const larguraTela = dimensoesImagem.largura * escala;
  const alturaTela = dimensoesImagem.altura * escala;
  const offsetX = (area.largura - larguraTela) / 2;
  const offsetY = (area.altura - alturaTela) / 2;
  const molduraX = valor.x * escala;
  const molduraY = valor.y * escala;
  const molduraLargura = valor.largura * escala;
  const molduraAltura = valor.altura * escala;
  const minLargura = Math.min(TAMANHO_MINIMO, dimensoesImagem.largura);
  const minAltura = Math.min(TAMANHO_MINIMO, dimensoesImagem.altura);

  function pontoImagem(evento) {
    const rect = areaRef.current.getBoundingClientRect();
    return {
      x: limitar((evento.clientX - rect.left - offsetX) / escala, 0, dimensoesImagem.largura),
      y: limitar((evento.clientY - rect.top - offsetY) / escala, 0, dimensoesImagem.altura),
    };
  }

  function iniciarArrasto(evento, modo, alvo) {
    if (!evento.isPrimary || !escala) return;
    evento.preventDefault();
    evento.stopPropagation();
    areaRef.current?.setPointerCapture(evento.pointerId);
    molduraRef.current?.focus();
    arrastoRef.current = {
      modo,
      alvo,
      inicio: pontoImagem(evento),
      valorInicial: { ...valor },
    };
  }

  function moverArrasto(evento) {
    const arrasto = arrastoRef.current;
    if (!arrasto || !escala) return;
    evento.preventDefault();

    const ponto = pontoImagem(evento);
    const dx = ponto.x - arrasto.inicio.x;
    const dy = ponto.y - arrasto.inicio.y;
    const inicial = arrasto.valorInicial;

    if (arrasto.modo === "mover") {
      onAlterar({
        ...inicial,
        x: Math.round(limitar(inicial.x + dx, 0, dimensoesImagem.largura - inicial.largura)),
        y: Math.round(limitar(inicial.y + dy, 0, dimensoesImagem.altura - inicial.altura)),
      });
      return;
    }

    let esquerda = inicial.x;
    let direita = inicial.x + inicial.largura;
    let topo = inicial.y;
    let base = inicial.y + inicial.altura;
    const id = arrasto.alvo;

    if (id.includes("o")) esquerda = Math.min(esquerda + dx, direita - minLargura);
    if (id.includes("l")) direita = Math.max(direita + dx, esquerda + minLargura);
    if (id.startsWith("n")) topo = Math.min(topo + dy, base - minAltura);
    if (id.startsWith("s")) base = Math.max(base + dy, topo + minAltura);

    esquerda = limitar(esquerda, 0, dimensoesImagem.largura - minLargura);
    topo = limitar(topo, 0, dimensoesImagem.altura - minAltura);
    direita = limitar(direita, esquerda + minLargura, dimensoesImagem.largura);
    base = limitar(base, topo + minAltura, dimensoesImagem.altura);

    onAlterar({
      x: Math.round(esquerda),
      y: Math.round(topo),
      largura: Math.round(direita - esquerda),
      altura: Math.round(base - topo),
    });
  }

  function finalizarArrasto(evento) {
    if (evento.currentTarget.hasPointerCapture?.(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    }
    arrastoRef.current = null;
  }

  function aoTeclarMoldura(evento) {
    const passo = PASSO_TECLADO;
    const proximo = { ...valor };

    if (evento.shiftKey) {
      switch (evento.key) {
        case "ArrowLeft":
          proximo.largura = Math.max(minLargura, proximo.largura - passo);
          break;
        case "ArrowRight":
          proximo.largura = Math.min(dimensoesImagem.largura - proximo.x, proximo.largura + passo);
          break;
        case "ArrowUp":
          proximo.altura = Math.max(minAltura, proximo.altura - passo);
          break;
        case "ArrowDown":
          proximo.altura = Math.min(dimensoesImagem.altura - proximo.y, proximo.altura + passo);
          break;
        default:
          return;
      }
    } else {
      switch (evento.key) {
        case "ArrowLeft":
          proximo.x = Math.max(0, proximo.x - passo);
          break;
        case "ArrowRight":
          proximo.x = Math.min(dimensoesImagem.largura - proximo.largura, proximo.x + passo);
          break;
        case "ArrowUp":
          proximo.y = Math.max(0, proximo.y - passo);
          break;
        case "ArrowDown":
          proximo.y = Math.min(dimensoesImagem.altura - proximo.altura, proximo.y + passo);
          break;
        default:
          return;
      }
    }

    evento.preventDefault();
    onAlterar(proximo);
  }

  return (
    <div className="assinatura-recorte">
      <div
        ref={areaRef}
        className="assinatura-recorte__area"
        onPointerMove={moverArrasto}
        onPointerUp={finalizarArrasto}
        onPointerCancel={finalizarArrasto}
      >
        <canvas
          ref={imagemRef}
          className="assinatura-recorte__imagem"
          style={{ left: offsetX, top: offsetY, width: larguraTela, height: alturaTela }}
          aria-hidden="true"
        />

        {escala > 0 ? (
          <>
            <div
              className="assinatura-recorte__escuro"
              style={{ left: offsetX, top: offsetY, width: larguraTela, height: alturaTela }}
              aria-hidden="true"
            >
              <div className="assinatura-recorte__faixa" style={{ height: molduraY }} />
              <div
                className="assinatura-recorte__faixa"
                style={{ top: molduraY + molduraAltura, bottom: 0 }}
              />
              <div
                className="assinatura-recorte__faixa"
                style={{ top: molduraY, width: molduraX, height: molduraAltura }}
              />
              <div
                className="assinatura-recorte__faixa"
                style={{
                  top: molduraY,
                  left: molduraX + molduraLargura,
                  right: 0,
                  height: molduraAltura,
                }}
              />
            </div>

            <div
              ref={molduraRef}
              className="assinatura-recorte__moldura"
              style={{
                left: offsetX + molduraX,
                top: offsetY + molduraY,
                width: molduraLargura,
                height: molduraAltura,
              }}
              tabIndex={0}
              role="group"
              aria-label="Moldura de recorte. Use as setas para mover e Shift com as setas para redimensionar."
              onPointerDown={(evento) => iniciarArrasto(evento, "mover")}
              onKeyDown={aoTeclarMoldura}
            >
              <div className="assinatura-recorte__linha assinatura-recorte__linha--v1" />
              <div className="assinatura-recorte__linha assinatura-recorte__linha--v2" />
              <div className="assinatura-recorte__linha assinatura-recorte__linha--h1" />
              <div className="assinatura-recorte__linha assinatura-recorte__linha--h2" />

              {ALCAS.map((alca) => (
                <button
                  key={alca.id}
                  type="button"
                  className={`assinatura-recorte__alca assinatura-recorte__alca--${alca.id}`}
                  style={{ cursor: alca.cursor }}
                  aria-label={`Redimensionar ${alca.rotulo}`}
                  onPointerDown={(evento) => iniciarArrasto(evento, "redimensionar", alca.id)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="assinatura-recorte__barra">
        <Button variant="secondary" onClick={onGirar}>
          Girar
        </Button>
        <span className="assinatura-recorte__dica">
          Arraste para mover. Puxe as alças para ajustar.
        </span>
      </div>
    </div>
  );
}
