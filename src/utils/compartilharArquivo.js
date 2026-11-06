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

function baixarArquivo(arquivo, nomeArquivo) {
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

export function suportaCompartilhamentoArquivo() {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function" ||
    typeof File === "undefined"
  ) {
    return false;
  }

  try {
    const arquivoTeste = new File([""], "teste.txt", { type: "text/plain" });
    return navigator.canShare({ files: [arquivoTeste] });
  } catch {
    return false;
  }
}

export async function compartilharOuBaixar({ blobOuUrl, nomeArquivo }) {
  const arquivo = await obterArquivo(blobOuUrl, nomeArquivo);

  if (suportaCompartilhamentoArquivo() && navigator.canShare({ files: [arquivo] })) {
    await navigator.share({
      files: [arquivo],
      title: nomeArquivo,
      text: nomeArquivo,
    });
    return;
  }

  baixarArquivo(arquivo, nomeArquivo);
}
