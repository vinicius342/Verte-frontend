// Extrai os traços de uma foto de assinatura usando apenas Canvas no navegador.
// A imagem de origem nunca sai do aparelho do usuário.

const LADO_MAXIMO = 2000;
// O scan roda sempre em alta resolução: recortes pequenos são ampliados antes
// de medir a escuridão, para que o traço tenha pixels suficientes para o alpha.
const LADO_MINIMO_PROCESSAMENTO = 1200;
const LADO_MAXIMO_PROCESSAMENTO = 2000;
const SAIDA_LARGURA_MAX = 1000; // 2x da largura de exibição (500 px)
const SAIDA_ALTURA_MAX = 400; // 2x da altura de exibição (200 px)
const ESCALA_MAXIMA = 2;
const MARGEM_RECORTE = 12; // px CSS; no PNG 2x vira 24 px
const FATOR_MARGEM_SAIDA = 2;
const PISO_ESCURIDAO = 0.05;
const FATOR_LIMIAR = 1.1;
const TRANSICAO_ALPHA = 0.1;
const SIGMA_DESFOQUE = 0.8;
const COR_TRACO = [0x11, 0x11, 0x11];

// Cedendo um frame entre as etapas pesadas a interface continua responsiva.
function pausar() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function dimensoes(fonte) {
  return {
    largura: fonte.width ?? fonte.naturalWidth ?? 0,
    altura: fonte.height ?? fonte.naturalHeight ?? 0,
  };
}

function criarCanvas(largura, altura) {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  return canvas;
}

// Todo redimensionamento usa interpolação de alta qualidade.
function desenharEm(origem, largura, altura, recorte) {
  const canvas = criarCanvas(largura, altura);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (recorte) {
    ctx.drawImage(
      origem,
      recorte.x,
      recorte.y,
      recorte.largura,
      recorte.altura,
      0,
      0,
      largura,
      altura,
    );
  } else {
    ctx.drawImage(origem, 0, 0, largura, altura);
  }
  return canvas;
}

// Nunca reduz/amplia mais que 2x de uma vez (evita perda de detalhe no traço).
function redimensionarEmEtapas(origem, largura, altura) {
  let atual = origem;
  while (atual.width > largura * 2 || atual.height > altura * 2) {
    atual = desenharEm(
      atual,
      Math.max(largura, Math.ceil(atual.width / 2)),
      Math.max(altura, Math.ceil(atual.height / 2)),
    );
  }
  while (largura > atual.width * 2 || altura > atual.height * 2) {
    atual = desenharEm(
      atual,
      Math.min(largura, atual.width * 2),
      Math.min(altura, atual.height * 2),
    );
  }
  return atual.width === largura && atual.height === altura
    ? atual
    : desenharEm(atual, largura, altura);
}

async function carregarFonte(arquivo) {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation "from-image" corrige fotos tiradas com o celular girado.
      return await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(arquivo);
      } catch {
        // Alguns navegadores não decodificam o formato (HEIC, por exemplo).
      }
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir essa imagem. Tente outra."));
    };
    imagem.src = url;
  });
}

// Valida, corrige a orientação EXIF e devolve um canvas já orientado.
export async function carregarImagem(arquivo) {
  if (!arquivo || typeof arquivo.type !== "string" || !arquivo.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  // SVG pode carregar referências externas e não é uma foto de assinatura.
  if (arquivo.type === "image/svg+xml") {
    throw new Error("Use uma foto da sua assinatura em JPG, PNG ou WEBP.");
  }

  const fonte = await carregarFonte(arquivo);
  const original = dimensoes(fonte);
  if (!original.largura || !original.altura) {
    if (typeof fonte.close === "function") fonte.close();
    throw new Error("Não foi possível abrir essa imagem. Tente outra.");
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(original.largura, original.altura));
  const largura = Math.max(1, Math.round(original.largura * escala));
  const altura = Math.max(1, Math.round(original.altura * escala));
  const canvas = criarCanvas(largura, altura);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fonte, 0, 0, largura, altura);
  if (typeof fonte.close === "function") fonte.close();

  return canvas;
}

// Gira mantendo as dimensões trocadas a cada 90°. Usado na prévia e no recorte.
export function rotacionarCanvas(canvas, graus = 0) {
  const angulo = ((Math.round(graus) % 360) + 360) % 360;
  if (angulo === 0) return canvas;

  const trocaLados = angulo === 90 || angulo === 270;
  const girado = criarCanvas(
    trocaLados ? canvas.height : canvas.width,
    trocaLados ? canvas.width : canvas.height,
  );
  const ctx = girado.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(girado.width / 2, girado.height / 2);
  ctx.rotate((angulo * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return girado;
}

// O retângulo usa coordenadas da imagem JÁ ROTACIONADA (o que o usuário vê).
export function recortarCanvas(canvas, { x, y, largura, altura }, graus = 0) {
  const fonte = rotacionarCanvas(canvas, graus);
  const x0 = limitar(Math.round(x), 0, Math.max(0, fonte.width - 1));
  const y0 = limitar(Math.round(y), 0, Math.max(0, fonte.height - 1));
  const x1 = limitar(Math.round(x + largura), x0 + 1, fonte.width);
  const y1 = limitar(Math.round(y + altura), y0 + 1, fonte.height);
  return desenharEm(fonte, x1 - x0, y1 - y0, {
    x: x0,
    y: y0,
    largura: x1 - x0,
    altura: y1 - y0,
  });
}

// Soma integral = box blur separável em O(n), mesmo com raio grande.
function desfoqueCaixa(entrada, largura, altura, raio) {
  const saida = new Float32Array(entrada.length);
  const passo = largura + 1;
  const soma = new Float64Array(passo * (altura + 1));

  for (let y = 0; y < altura; y++) {
    let somaLinha = 0;
    for (let x = 0; x < largura; x++) {
      somaLinha += entrada[y * largura + x];
      soma[(y + 1) * passo + x + 1] = soma[y * passo + x + 1] + somaLinha;
    }
  }

  for (let y = 0; y < altura; y++) {
    const y0 = Math.max(0, y - raio);
    const y1 = Math.min(altura - 1, y + raio);
    for (let x = 0; x < largura; x++) {
      const x0 = Math.max(0, x - raio);
      const x1 = Math.min(largura - 1, x + raio);
      const total =
        soma[(y1 + 1) * passo + x1 + 1] -
        soma[y0 * passo + x1 + 1] -
        soma[(y1 + 1) * passo + x0] +
        soma[y0 * passo + x0];
      saida[y * largura + x] = total / ((x1 - x0 + 1) * (y1 - y0 + 1));
    }
  }

  return saida;
}

// Gaussiano separável leve: suaviza o mapa ANTES do limiar para que o alpha
// tenha pixels de transição em vez de uma escadinha binária.
function desfoqueGaussiano(entrada, largura, altura, sigma) {
  const raio = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float64Array(raio * 2 + 1);
  let somaPesos = 0;
  for (let i = -raio; i <= raio; i++) {
    const peso = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + raio] = peso;
    somaPesos += peso;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= somaPesos;

  const intermediario = new Float32Array(entrada.length);
  const saida = new Float32Array(entrada.length);

  for (let y = 0; y < altura; y++) {
    const linha = y * largura;
    for (let x = 0; x < largura; x++) {
      let valor = 0;
      for (let k = -raio; k <= raio; k++) {
        valor += entrada[linha + limitar(x + k, 0, largura - 1)] * kernel[k + raio];
      }
      intermediario[linha + x] = valor;
    }
  }

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      let valor = 0;
      for (let k = -raio; k <= raio; k++) {
        valor += intermediario[limitar(y + k, 0, altura - 1) * largura + x] * kernel[k + raio];
      }
      saida[y * largura + x] = valor;
    }
  }

  return saida;
}

function prepararParaProcessamento(canvas) {
  const maior = Math.max(canvas.width, canvas.height);
  if (!maior) return canvas;
  const alvo = limitar(maior, LADO_MINIMO_PROCESSAMENTO, LADO_MAXIMO_PROCESSAMENTO);
  if (maior === alvo) return canvas;
  const escala = alvo / maior;
  return desenharEm(
    canvas,
    Math.max(1, Math.round(canvas.width * escala)),
    Math.max(1, Math.round(canvas.height * escala)),
  );
}

// Otsu considera só os pixels escuros: o papel recortado ainda é quase todo
// branco, então um Otsu sobre tudo ficaria enviesado para o fundo.
function estatisticasOtsu(mapa) {
  const histograma = new Float64Array(256);
  let maiorBin = 0;
  let candidatos = 0;

  for (let i = 0; i < mapa.length; i++) {
    const valor = mapa[i];
    if (valor <= PISO_ESCURIDAO) continue;
    const bin = Math.min(255, Math.max(1, Math.round(valor * 255)));
    histograma[bin]++;
    candidatos++;
    if (bin > maiorBin) maiorBin = bin;
  }
  if (!candidatos || !maiorBin) return null;

  const pisoBin = Math.max(13, Math.round(maiorBin * 0.12));
  const ajustado = new Float64Array(256);
  let pixelsDeTinta = 0;
  for (let bin = 0; bin < 256; bin++) {
    if (bin >= pisoBin) {
      ajustado[bin] = histograma[bin];
      pixelsDeTinta += histograma[bin];
    } else {
      ajustado[0] += histograma[bin];
    }
  }
  if (!pixelsDeTinta) return null;

  const total = mapa.length;
  let somaTotal = 0;
  for (let bin = 0; bin < 256; bin++) somaTotal += bin * ajustado[bin];

  let pesoFundo = 0;
  let somaFundo = 0;
  let melhorVariancia = -1;
  let melhorLimiar = pisoBin;

  for (let bin = 0; bin < 256; bin++) {
    pesoFundo += ajustado[bin];
    if (!pesoFundo) continue;
    const pesoFrente = total - pesoFundo;
    if (!pesoFrente) break;

    somaFundo += bin * ajustado[bin];
    const mediaFundo = somaFundo / pesoFundo;
    const mediaFrente = (somaTotal - somaFundo) / pesoFrente;
    const diferenca = mediaFundo - mediaFrente;
    const variancia = pesoFundo * pesoFrente * diferenca * diferenca;

    if (variancia > melhorVariancia) {
      melhorVariancia = variancia;
      melhorLimiar = bin;
    }
  }

  return {
    limiar: (pisoBin + Math.max(pisoBin, melhorLimiar)) / (2 * 255),
    contraste: (maiorBin - pisoBin) / 255,
    piso: pisoBin / 255,
  };
}

function suavizar(limiar, valor) {
  const t = limitar((valor - (limiar - TRANSICAO_ALPHA)) / (2 * TRANSICAO_ALPHA), 0, 1);
  return t * t * (3 - 2 * t);
}

// Mapa de "escuridão": 0 = fundo, 1 = traço. Normaliza pela iluminação local
// para que sombras leves do papel não virem traço. Roda em alta resolução.
export async function calcularEscuridao(canvas) {
  const trabalho = prepararParaProcessamento(canvas);
  const { width, height } = trabalho;
  const ctx = trabalho.getContext("2d", { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, width, height);
  const total = width * height;
  const cinza = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const p = i * 4;
    cinza[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  await pausar();

  // Raio grande o bastante para envolver o traço mais grosso: se o fundo
  // "acompanhar" a tinta, a normalização apaga o traço e engorda as bordas.
  const raio = limitar(Math.round(Math.max(width, height) / 12), 12, 160);
  const fundo = desfoqueCaixa(cinza, width, height, raio);
  await pausar();

  const mapa = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    mapa[i] = limitar(1 - cinza[i] / Math.max(20, fundo[i]), 0, 1);
  }
  return { mapa, largura: width, altura: height };
}

// Limpa ruído, recorta e devolve o PNG transparente final em até 1000x400
// (o dobro do tamanho de exibição, para o preview sair nítido).
export async function gerarAssinatura(mapaInfo, { sensibilidade = 50 } = {}) {
  const { mapa, largura, altura } = mapaInfo ?? {};
  const total = largura * altura;
  if (!total || !mapa || mapa.length !== total) {
    throw new Error("O recorte ainda não foi processado.");
  }

  const suave = desfoqueGaussiano(mapa, largura, altura, SIGMA_DESFOQUE);
  await pausar();

  const estatisticas = estatisticasOtsu(suave);
  if (!estatisticas || estatisticas.contraste < 0.03) return null;

  // Limiar um pouco acima do Otsu evita que a sombra do traço engorde os laços.
  const amplitude = limitar(estatisticas.contraste * 0.2, 0.05, 0.16);
  const sens = limitar(Number(sensibilidade) || 0, 0, 100);
  const limiar = limitar(
    estatisticas.limiar * FATOR_LIMIAR - ((sens - 50) / 50) * amplitude,
    Math.max(PISO_ESCURIDAO, 0.12),
    0.95,
  );

  // A máscara binária serve SÓ para decidir quais componentes ficam.
  const mascara = new Uint8Array(total);
  const limiarMascara = limiar - TRANSICAO_ALPHA;
  for (let i = 0; i < total; i++) mascara[i] = suave[i] >= limiarMascara ? 1 : 0;
  await pausar();

  // Flood fill iterativo (fila em vez de recursão) com vizinhança de 8 pixels.
  const rotulos = new Int32Array(total);
  const fila = new Int32Array(total);
  const componentes = [];
  let proximoId = 0;

  for (let i = 0; i < total; i++) {
    if (!mascara[i] || rotulos[i]) continue;
    const id = ++proximoId;
    let inicio = 0;
    let fim = 0;
    fila[fim++] = i;
    rotulos[i] = id;

    let area = 0;
    let minX = largura;
    let maxX = -1;
    let minY = altura;
    let maxY = -1;
    let encostaBorda = false;

    while (inicio < fim) {
      const pixel = fila[inicio++];
      const x = pixel % largura;
      const y = Math.floor(pixel / largura);
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === largura - 1 || y === altura - 1) encostaBorda = true;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= altura) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= largura) continue;
          const vizinho = ny * largura + nx;
          if (mascara[vizinho] && !rotulos[vizinho]) {
            rotulos[vizinho] = id;
            fila[fim++] = vizinho;
          }
        }
      }
    }

    componentes.push({ id, area, encostaBorda, minX, maxX, minY, maxY });
  }
  await pausar();

  const areaMinima = Math.max(15, Math.round(total * 0.0001));
  const candidatos = componentes.filter((c) => c.area >= areaMinima);
  if (!candidatos.length) return null;

  const maior = candidatos.reduce((melhor, c) => (c.area > melhor.area ? c : melhor));
  // Faixa de borda: ocupa quase toda a largura/altura com pouca espessura.
  const areaGrandeFaixa = Math.max(80, total * 0.002);
  const descartar = (c) => {
    if (!c.encostaBorda || c.id === maior.id || c.area < areaGrandeFaixa) return false;
    const larguraComp = c.maxX - c.minX + 1;
    const alturaComp = c.maxY - c.minY + 1;
    const faixaHorizontal =
      larguraComp >= largura * 0.85 && alturaComp <= Math.max(12, altura * 0.12);
    const faixaVertical =
      alturaComp >= altura * 0.85 && larguraComp <= Math.max(12, largura * 0.12);
    return faixaHorizontal || faixaVertical;
  };

  // O recorte justo faz a assinatura encostar na borda: só removemos faixas
  // grandes (sombra/dobra), nunca o maior componente.
  const aceitos = candidatos.filter((c) => !descartar(c));
  if (!aceitos.length) return null;
  const permitidos = new Uint8Array(proximoId + 1);
  for (const c of aceitos) permitidos[c.id] = 1;

  let x0 = largura;
  let y0 = altura;
  let x1 = -1;
  let y1 = -1;
  for (const c of aceitos) {
    x0 = Math.min(x0, c.minX);
    y0 = Math.min(y0, c.minY);
    x1 = Math.max(x1, c.maxX);
    y1 = Math.max(y1, c.maxY);
  }
  const larguraTracos = x1 - x0 + 1;
  const alturaTracos = y1 - y0 + 1;
  if (larguraTracos <= 0 || alturaTracos <= 0) return null;

  // Alpha contínuo: a máscara só zera o que foi descartado; a borda do traço
  // mantém todos os valores entre 0 e 1 vindos do smoothstep.
  const canvasTracos = criarCanvas(largura, altura);
  const ctxTracos = canvasTracos.getContext("2d");
  const imagem = ctxTracos.createImageData(largura, altura);
  const destino = imagem.data;

  for (let i = 0; i < total; i++) {
    const id = rotulos[i];
    if (!id || !permitidos[id]) continue;
    const opacidade = suavizar(limiar, suave[i]);
    if (opacidade <= 0) continue;
    const p = i * 4;
    destino[p] = COR_TRACO[0];
    destino[p + 1] = COR_TRACO[1];
    destino[p + 2] = COR_TRACO[2];
    destino[p + 3] = Math.round(opacidade * 255);
  }
  ctxTracos.putImageData(imagem, 0, 0);

  const margem = MARGEM_RECORTE * FATOR_MARGEM_SAIDA;
  const escala = Math.min(
    (SAIDA_LARGURA_MAX - 2 * margem) / larguraTracos,
    (SAIDA_ALTURA_MAX - 2 * margem) / alturaTracos,
    ESCALA_MAXIMA,
  );
  const larguraConteudo = Math.max(1, Math.round(larguraTracos * escala));
  const alturaConteudo = Math.max(1, Math.round(alturaTracos * escala));
  const canvasConteudo = redimensionarEmEtapas(
    desenharEm(canvasTracos, larguraTracos, alturaTracos, {
      x: x0,
      y: y0,
      largura: larguraTracos,
      altura: alturaTracos,
    }),
    larguraConteudo,
    alturaConteudo,
  );

  const canvasFinal = criarCanvas(larguraConteudo + 2 * margem, alturaConteudo + 2 * margem);
  const ctxFinal = canvasFinal.getContext("2d");
  ctxFinal.imageSmoothingEnabled = true;
  ctxFinal.imageSmoothingQuality = "high";
  ctxFinal.drawImage(canvasConteudo, margem, margem);

  return canvasFinal.toDataURL("image/png");
}
