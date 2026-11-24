function obterArquivo(blobOuUrl, nomeArquivo) {
  if (blobOuUrl instanceof Blob) {
    const arquivo = new File([blobOuUrl], nomeArquivo, {
      type: blobOuUrl.type || "application/octet-stream",
    });
    return Promise.resolve(arquivo);
  }

  return fetch(blobOuUrl)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Não foi possível carregar o arquivo.");
      }
      return resposta.blob();
    })
    .then(
      (blob) => new File([blob], nomeArquivo, { type: blob.type || "application/octet-stream" }),
    );
}

function iniciarDownload(arquivo, nomeArquivo) {
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Download direto, sem passar pela folha de compartilhamento do aparelho.
export function baixarArquivo({ blobOuUrl, nomeArquivo }) {
  const ehUrl = typeof blobOuUrl === "string";
  const url = ehUrl ? blobOuUrl : URL.createObjectURL(blobOuUrl);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (!ehUrl) window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Sem argumento mantém a checagem genérica; com um File verifica aquele tipo.
export function suportaCompartilhamentoArquivo(arquivo) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function" ||
    typeof File === "undefined"
  ) {
    return false;
  }

  const alvo =
    arquivo instanceof File ? arquivo : new File([""], "teste.txt", { type: "text/plain" });
  try {
    return Boolean(navigator.canShare({ files: [alvo] }));
  } catch {
    return false;
  }
}

export async function compartilharArquivo({ arquivo, titulo }) {
  try {
    await navigator.share({ files: [arquivo], title: titulo });
  } catch (erro) {
    // O usuário fechou a folha nativa: não é um erro para a interface.
    if (erro?.name === "AbortError") return;
    throw erro;
  }
}

// Usado por outras telas (anexos de cliente): compartilha se puder, senão baixa.
export async function compartilharOuBaixar({ blobOuUrl, nomeArquivo }) {
  const arquivo = await obterArquivo(blobOuUrl, nomeArquivo);

  if (suportaCompartilhamentoArquivo(arquivo)) {
    await navigator.share({
      files: [arquivo],
      title: nomeArquivo,
      text: nomeArquivo,
    });
    return;
  }

  iniciarDownload(arquivo, nomeArquivo);
}
