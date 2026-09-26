// Reduz o tamanho de imagens antes do upload, redimensionando e
// reencodando como JPEG. PDFs e outros tipos não são tocados.
const LARGURA_MAXIMA = 1600;
const QUALIDADE_JPEG = 0.72;

export async function comprimirImagem(arquivo) {
  const ehImagem = arquivo.type.startsWith("image/");
  const ehSvg = arquivo.type === "image/svg+xml";
  if (!ehImagem || ehSvg) return arquivo;

  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LARGURA_MAXIMA / bitmap.width);
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, largura, altura);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALIDADE_JPEG),
    );

    // Se por algum motivo a versão comprimida ficou maior, mantém o original.
    if (!blob || blob.size >= arquivo.size) return arquivo;

    const nomeSemExtensao = arquivo.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${nomeSemExtensao}.jpg`, { type: "image/jpeg" });
  } catch (erro) {
    console.error("Falha ao comprimir imagem, enviando original:", erro);
    return arquivo;
  }
}