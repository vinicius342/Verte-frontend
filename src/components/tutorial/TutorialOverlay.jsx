import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const FOLGA = 6;
const MARGEM = 12;
const ESPACO = 14;

function prefereReduzirMovimento() {
  return Boolean(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
}

function lerSafeArea() {
  if (typeof window === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  const estilo = getComputedStyle(document.documentElement);
  const valor = (nome) => parseFloat(estilo.getPropertyValue(nome)) || 0;
  return {
    top: valor("--tutorial-safe-top"),
    right: valor("--tutorial-safe-right"),
    bottom: valor("--tutorial-safe-bottom"),
    left: valor("--tutorial-safe-left"),
  };
}

function limitar(valor, minimo, maximo) {
  if (maximo < minimo) return minimo;
  return Math.min(Math.max(valor, minimo), maximo);
}

function estaVisivel(el) {
  if (!el || !el.isConnected) return false;
  const retangulo = el.getBoundingClientRect();
  if (retangulo.width <= 0 || retangulo.height <= 0) return false;
  const estilo = getComputedStyle(el);
  return estilo.display !== "none" && estilo.visibility !== "hidden";
}

export default function TutorialOverlay({
  etapa,
  indice,
  total,
  saindo,
  onVoltar,
  onAvancar,
}) {
  const balaoRef = useRef(null);
  const avancarRef = useRef(null);
  const alvoElRef = useRef(null);
  const ehAcao = etapa.tipo === "acao";
  const [alvo, setAlvo] = useState(null);
  const [semAlvo, setSemAlvo] = useState(false);
  const [tamanho, setTamanho] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  });
  const [posicao, setPosicao] = useState(null);

  useEffect(() => {
    const atualizar = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    atualizar();
    window.addEventListener("resize", atualizar);
    window.addEventListener("orientationchange", atualizar);
    return () => {
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("orientationchange", atualizar);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    let timerBusca = null;
    let raf = null;
    let observer = null;
    let limparEscutas = null;
    let tentativas = 0;

    alvoElRef.current = null;
    setAlvo(null);
    setSemAlvo(false);
    setPosicao(null);

    const medir = () => {
      const el = alvoElRef.current;
      if (!el || !el.isConnected) return;
      const retangulo = el.getBoundingClientRect();
      const estilo = getComputedStyle(el);
      const raio =
        estilo.borderTopLeftRadius && estilo.borderTopLeftRadius !== "0px"
          ? estilo.borderTopLeftRadius
          : "6px";
      const novo = {
        top: retangulo.top - FOLGA,
        left: retangulo.left - FOLGA,
        width: retangulo.width + FOLGA * 2,
        height: retangulo.height + FOLGA * 2,
        raio,
      };
      setAlvo((anterior) => {
        if (
          anterior &&
          Math.abs(anterior.top - novo.top) < 0.5 &&
          Math.abs(anterior.left - novo.left) < 0.5 &&
          Math.abs(anterior.width - novo.width) < 0.5 &&
          Math.abs(anterior.height - novo.height) < 0.5 &&
          anterior.raio === novo.raio
        ) {
          return anterior;
        }
        return novo;
      });
    };

    const anexar = (el) => {
      medir();
      const atualizar = () => medir();
      window.addEventListener("resize", atualizar);
      window.addEventListener("orientationchange", atualizar);
      document.addEventListener("scroll", atualizar, true);
      observer = new ResizeObserver(atualizar);
      observer.observe(el);
      limparEscutas = () => {
        window.removeEventListener("resize", atualizar);
        window.removeEventListener("orientationchange", atualizar);
        document.removeEventListener("scroll", atualizar, true);
        observer?.disconnect();
      };
    };

    const procurar = () => {
      if (cancelado) return;
      const el = document.querySelector(etapa.alvo);
      if (el && estaVisivel(el)) {
        alvoElRef.current = el;
        try {
          el.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: prefereReduzirMovimento() ? "auto" : "smooth",
          });
        } catch {
          el.scrollIntoView();
        }
        anexar(el);

        // Acompanha animações de entrada do alvo (ex.: sidebar) por alguns instantes.
        const fim = performance.now() + 450;
        const acompanhar = () => {
          if (cancelado) return;
          medir();
          if (performance.now() < fim) raf = requestAnimationFrame(acompanhar);
        };
        raf = requestAnimationFrame(acompanhar);
        return;
      }

      tentativas += 1;
      if (tentativas * 100 >= 800) {
        setSemAlvo(true);
        return;
      }
      timerBusca = setTimeout(procurar, 100);
    };

    procurar();

    return () => {
      cancelado = true;
      clearTimeout(timerBusca);
      cancelAnimationFrame(raf);
      limparEscutas?.();
      alvoElRef.current = null;
    };
  }, [etapa]);

  // Passo de ação: o clique no próprio alvo avança e segue para a navegação normal.
  useEffect(() => {
    if (!ehAcao) return;
    let avancou = false;
    const aoClicar = (evento) => {
      if (avancou) return;
      const el = document.querySelector(etapa.alvo);
      if (!el || (el !== evento.target && !el.contains(evento.target))) return;
      avancou = true;
      onAvancar();
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [ehAcao, etapa, onAvancar]);

  useLayoutEffect(() => {
    const el = balaoRef.current;
    if (!el) return;

    const medir = () => {
      const retangulo = el.getBoundingClientRect();
      setTamanho((anterior) =>
        Math.abs(anterior.width - retangulo.width) < 0.5 &&
        Math.abs(anterior.height - retangulo.height) < 0.5
          ? anterior
          : { width: retangulo.width, height: retangulo.height },
      );
    };

    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    return () => observer.disconnect();
  }, [etapa, semAlvo]);

  useEffect(() => {
    if (!tamanho.width || !tamanho.height) return;

    const larguraViewport = viewport.width;
    const alturaViewport = viewport.height;
    const larguraBalao = Math.min(tamanho.width, larguraViewport - MARGEM * 2);
    const alturaBalao = tamanho.height;
    const seguro = lerSafeArea();
    const margemEsquerda = MARGEM + seguro.left;
    const margemDireita = MARGEM + seguro.right;
    const margemTopo = MARGEM + seguro.top;
    const margemBase = MARGEM + seguro.bottom;

    const esquerdaMaxima = larguraViewport - larguraBalao - margemDireita;
    const topoMaximo = alturaViewport - alturaBalao - margemBase;

    if (semAlvo || !alvo) {
      setPosicao({
        left: limitar((larguraViewport - larguraBalao) / 2, margemEsquerda, esquerdaMaxima),
        top: limitar((alturaViewport - alturaBalao) / 2, margemTopo, topoMaximo),
        lado: null,
        offset: 0,
      });
      return;
    }

    const centroX = alvo.left + alvo.width / 2;
    const centroY = alvo.top + alvo.height / 2;
    const espacos = {
      baixo: alturaViewport - (alvo.top + alvo.height),
      cima: alvo.top,
      direita: larguraViewport - (alvo.left + alvo.width),
      esquerda: alvo.left,
    };
    const cabe = {
      baixo: espacos.baixo >= alturaBalao + ESPACO + margemBase,
      cima: espacos.cima >= alturaBalao + ESPACO + margemTopo,
      direita: espacos.direita >= larguraBalao + ESPACO + margemDireita,
      esquerda: espacos.esquerda >= larguraBalao + ESPACO + margemEsquerda,
    };
    const celular = larguraViewport <= 640;
    const ordem = etapa.forcarAcima
      ? ["cima", "baixo", "direita", "esquerda"]
      : ["baixo", "cima", "direita", "esquerda"];

    let lado;
    if (celular) {
      lado = espacos.cima > espacos.baixo ? "cima" : "baixo";
      const outro = lado === "cima" ? "baixo" : "cima";
      if (!cabe[lado] && cabe[outro]) lado = outro;
      if (etapa.forcarAcima) lado = "cima";
    } else {
      lado = ordem.find((opcao) => cabe[opcao]);
      if (!lado) {
        lado = ["baixo", "cima", "direita", "esquerda"].reduce(
          (melhor, atual) => (espacos[atual] > espacos[melhor] ? atual : melhor),
          "baixo",
        );
      }
    }

    let left;
    let top;
    let ladoSeta;
    let offsetSeta;

    if (lado === "baixo") {
      left = limitar(centroX - larguraBalao / 2, margemEsquerda, esquerdaMaxima);
      top = limitar(
        alvo.top + alvo.height + ESPACO,
        margemTopo,
        topoMaximo,
      );
      ladoSeta = "topo";
      offsetSeta = limitar(centroX - left, 16, larguraBalao - 16);
    } else if (lado === "cima") {
      left = limitar(centroX - larguraBalao / 2, margemEsquerda, esquerdaMaxima);
      top = limitar(
        alvo.top - ESPACO - alturaBalao,
        margemTopo,
        topoMaximo,
      );
      ladoSeta = "baixo";
      offsetSeta = limitar(centroX - left, 16, larguraBalao - 16);
    } else if (lado === "direita") {
      left = limitar(
        alvo.left + alvo.width + ESPACO,
        margemEsquerda,
        esquerdaMaxima,
      );
      top = limitar(centroY - alturaBalao / 2, margemTopo, topoMaximo);
      ladoSeta = "esquerda";
      offsetSeta = limitar(centroY - top, 16, alturaBalao - 16);
    } else {
      left = limitar(
        alvo.left - ESPACO - larguraBalao,
        margemEsquerda,
        esquerdaMaxima,
      );
      top = limitar(centroY - alturaBalao / 2, margemTopo, topoMaximo);
      ladoSeta = "direita";
      offsetSeta = limitar(centroY - top, 16, alturaBalao - 16);
    }

    setPosicao({ left, top, lado: ladoSeta, offset: offsetSeta });
  }, [alvo, tamanho, viewport, semAlvo, etapa]);

  const posicaoVisivel = Boolean(posicao);
  useEffect(() => {
    if (saindo || !posicaoVisivel) return;
    if (!ehAcao || semAlvo) avancarRef.current?.focus();
  }, [etapa, saindo, posicaoVisivel, ehAcao, semAlvo]);

  // Captura o Esc antes do modal (que escuta no bubble) para não fechar o modal por baixo.
  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key !== "Escape") return;
      evento.preventDefault();
      evento.stopPropagation();
    };
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, []);

  const ultima = indice >= total - 1;
  const progresso = total ? ((indice + 1) / total) * 100 : 0;
  const estiloSeta =
    posicao?.lado === "topo" || posicao?.lado === "baixo"
      ? { left: posicao.offset }
      : { top: posicao?.offset ?? 0 };

  // No passo de ação, bloqueia tudo ao redor do alvo e deixa só ele clicável.
  const areasBloqueio =
    ehAcao && alvo
      ? [
          { top: 0, left: 0, width: viewport.width, height: Math.max(0, alvo.top) },
          {
            top: alvo.top + alvo.height,
            left: 0,
            width: viewport.width,
            height: Math.max(0, viewport.height - (alvo.top + alvo.height)),
          },
          { top: alvo.top, left: 0, width: Math.max(0, alvo.left), height: alvo.height },
          {
            top: alvo.top,
            left: alvo.left + alvo.width,
            width: Math.max(0, viewport.width - (alvo.left + alvo.width)),
            height: alvo.height,
          },
        ]
      : null;

  return createPortal(
    <>
      {areasBloqueio ? (
        areasBloqueio.map((area, posicaoArea) => (
          <div
            key={posicaoArea}
            className="tutorial-bloqueio-area"
            style={area}
            aria-hidden="true"
          />
        ))
      ) : (
        <div className="tutorial-bloqueio" aria-hidden="true" />
      )}
      {semAlvo ? (
        <div className="tutorial-fundo" aria-hidden="true" />
      ) : alvo ? (
        <div
          className="tutorial-furo"
          style={{
            top: alvo.top,
            left: alvo.left,
            width: alvo.width,
            height: alvo.height,
            borderRadius: alvo.raio,
          }}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={balaoRef}
        className={`tutorial-balao${saindo ? " tutorial-balao-saindo" : ""}`}
        style={{
          left: posicao?.left ?? 0,
          top: posicao?.top ?? 0,
          visibility: posicao ? "visible" : "hidden",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial: ${etapa.titulo}`}
      >
        {posicao?.lado ? (
          <span
            className={`tutorial-seta tutorial-seta-${posicao.lado}`}
            style={estiloSeta}
            aria-hidden="true"
          />
        ) : null}

        <div className="tutorial-cabecalho">
          <span className="tutorial-indicador">
            {indice + 1} de {total}
          </span>
        </div>
        <div className="tutorial-progresso" aria-hidden="true">
          <span style={{ width: `${progresso}%` }} />
        </div>

        <h2 className="tutorial-titulo" aria-live="polite">
          {etapa.titulo}
        </h2>
        <p className="tutorial-texto">{etapa.texto}</p>
        {etapa.preConteudo ? <pre className="tutorial-pre">{etapa.preConteudo}</pre> : null}

        {ehAcao ? (
          semAlvo ? (
            <div className="tutorial-acoes">
              <button
                ref={avancarRef}
                type="button"
                className="btn btn-primary"
                onClick={onAvancar}
              >
                Continuar
              </button>
            </div>
          ) : null
        ) : (
          <div className="tutorial-acoes">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onVoltar}
              disabled={indice === 0}
            >
              Voltar
            </button>
            <button
              ref={avancarRef}
              type="button"
              className="btn btn-primary"
              onClick={onAvancar}
            >
              {ultima ? "Concluir" : "Avançar"}
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
