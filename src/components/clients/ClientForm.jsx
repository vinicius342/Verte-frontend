import { useState } from "react";
import Button from "../common/Button";
import { validarCliente, formatarWhatsapp } from "../../utils/validators";
import { parseCoordenada, formatarCoordenada } from "../../utils/coordinateParser";

const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024; // 10MB
const TIPOS_ACEITOS = ["image/", "application/pdf"];
const MAX_ANEXOS = 5;

function estadoInicial(cliente) {
  return {
    nomeCliente: cliente?.nomeCliente ?? "",
    nomeComercio: cliente?.nomeComercio ?? "",
    rua: cliente?.rua ?? "",
    numero: cliente?.numero ?? "",
    complemento: cliente?.complemento ?? "",
    whatsapp: cliente?.whatsapp ?? "",
    whatsapp2: cliente?.whatsapp2 ?? "",
    whatsapp3: cliente?.whatsapp3 ?? "",
    observacao: cliente?.observacao ?? "",
    coordenadaTexto: formatarCoordenada(cliente?.coordenada),
  };
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tipoValido(arquivo) {
  return TIPOS_ACEITOS.some((prefixo) => arquivo.type.startsWith(prefixo));
}

// Formulário reaproveitado na criação e na edição de clientes.
export default function ClientForm({ cliente, onSalvar, onCancelar, textoSalvar = "Salvar" }) {
  const [dados, setDados] = useState(() => estadoInicial(cliente));
  const [anexosExistentes, setAnexosExistentes] = useState(cliente?.anexos ?? []);
  const [anexosNovos, setAnexosNovos] = useState([]);
  const [anexosRemovidos, setAnexosRemovidos] = useState([]);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  const alterar = (campo) => (e) => {
    const ehWhatsapp = campo === "whatsapp" || campo === "whatsapp2" || campo === "whatsapp3";
    const valor = ehWhatsapp ? formatarWhatsapp(e.target.value) : e.target.value;
    setDados((atual) => ({ ...atual, [campo]: valor }));
  };

  function selecionarArquivos(e) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite selecionar o mesmo arquivo de novo depois de remover

    const totalAtual = anexosExistentes.length + anexosNovos.length;
    const espacoDisponivel = MAX_ANEXOS - totalAtual;

    if (espacoDisponivel <= 0) {
      setErros((atual) => ({ ...atual, anexos: `Limite de ${MAX_ANEXOS} anexos atingido.` }));
      return;
    }

    const invalidos = arquivos.filter((a) => !tipoValido(a) || a.size > TAMANHO_MAX_ANEXO);
    const validos = arquivos.filter((a) => tipoValido(a) && a.size <= TAMANHO_MAX_ANEXO);
    const aceitos = validos.slice(0, espacoDisponivel);
    const excedentes = validos.length > espacoDisponivel;

    if (invalidos.length > 0) {
      setErros((atual) => ({ ...atual, anexos: "Envie apenas imagens ou PDF, até 10MB por arquivo." }));
    } else if (excedentes) {
      setErros((atual) => ({ ...atual, anexos: `Só é possível anexar até ${MAX_ANEXOS} arquivos no total.` }));
    } else {
      setErros((atual) => ({ ...atual, anexos: undefined }));
    }

    setAnexosNovos((atual) => [...atual, ...aceitos]);
  }

  function removerAnexoExistente(anexo) {
    setAnexosExistentes((atual) => atual.filter((a) => a.caminho !== anexo.caminho));
    setAnexosRemovidos((atual) => [...atual, anexo.caminho]);
  }

  function removerAnexoNovo(indice) {
    setAnexosNovos((atual) => atual.filter((_, i) => i !== indice));
  }

  async function enviar(e) {
    e.preventDefault();
    const { valido, erros: novos } = validarCliente(dados);
    const parsed = parseCoordenada(dados.coordenadaTexto);
    if (!parsed.valido) novos.coordenada = "Use o formato -3.7327, -38.5267.";
    setErros(novos);
    if (!valido || !parsed.valido) return;

    setEnviando(true);
    setErroGeral(null);
    try {
      await onSalvar({
        ...dados,
        coordenada: parsed.coordenada,
        anexosExistentes,
        anexosNovos,
        anexosRemovidos,
      });
    } catch (erro) {
      setErroGeral(erro?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <label className="campo">
        <span className="campo-rotulo">Nome do cliente *</span>
        <input className="campo-input" value={dados.nomeCliente} onChange={alterar("nomeCliente")} required />
        {erros.nomeCliente ? <span className="campo-erro">{erros.nomeCliente}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Nome do comércio</span>
        <input className="campo-input" value={dados.nomeComercio} onChange={alterar("nomeComercio")} />
      </label>

      <label className="campo">
        <span className="campo-rotulo">Rua *</span>
        <input className="campo-input" value={dados.rua} onChange={alterar("rua")} required />
        {erros.rua ? <span className="campo-erro">{erros.rua}</span> : null}
      </label>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Número</span>
          <input className="campo-input mono" value={dados.numero} onChange={alterar("numero")} />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Complemento</span>
          <input className="campo-input" value={dados.complemento} onChange={alterar("complemento")} />
        </label>
      </div>

      <label className="campo">
        <span className="campo-rotulo">WhatsApp</span>
        <input
          className="campo-input mono"
          value={dados.whatsapp}
          onChange={alterar("whatsapp")}
          inputMode="tel"
          placeholder="(85) 99999-9999"
        />
        {erros.whatsapp ? <span className="campo-erro">{erros.whatsapp}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">WhatsApp 2</span>
        <input
          className="campo-input mono"
          value={dados.whatsapp2}
          onChange={alterar("whatsapp2")}
          inputMode="tel"
          placeholder="(85) 99999-9999"
        />
        {erros.whatsapp2 ? <span className="campo-erro">{erros.whatsapp2}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">WhatsApp 3</span>
        <input
          className="campo-input mono"
          value={dados.whatsapp3}
          onChange={alterar("whatsapp3")}
          inputMode="tel"
          placeholder="(85) 99999-9999"
        />
        {erros.whatsapp3 ? <span className="campo-erro">{erros.whatsapp3}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Observação</span>
        <textarea
          className="campo-input campo-textarea"
          value={dados.observacao}
          onChange={alterar("observacao")}
          rows={3}
        />
      </label>

      <label className="campo">
        <span className="campo-rotulo">Coordenada</span>
        <input
          className="campo-input mono"
          value={dados.coordenadaTexto}
          onChange={alterar("coordenadaTexto")}
          placeholder="-3.7327, -38.5267"
        />
        {erros.coordenada ? <span className="campo-erro">{erros.coordenada}</span> : null}
      </label>
      <p className="campo-dica">Preencha a coordenada apenas quando o endereço não for conhecido.</p>

      <div className="campo">
        <span className="campo-rotulo">Anexos (imagens ou PDF)</span>
        <input
          type="file"
          className="campo-input"
          accept="image/*,application/pdf"
          multiple
          onChange={selecionarArquivos}
        />
        {erros.anexos ? <span className="campo-erro">{erros.anexos}</span> : null}

        {(anexosExistentes.length > 0 || anexosNovos.length > 0) && (
          <ul className="lista-anexos">
            {anexosExistentes.map((anexo) => (
              <li key={anexo.caminho} className="lista-anexos-item">
                <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                  {anexo.nome}
                </a>
                <span className="mono">{formatarTamanho(anexo.tamanho)}</span>
                <button
                  type="button"
                  className="lista-anexos-remover"
                  onClick={() => removerAnexoExistente(anexo)}
                  aria-label={`Remover ${anexo.nome}`}
                >
                  ×
                </button>
              </li>
            ))}
            {anexosNovos.map((arquivo, indice) => (
              <li key={`${arquivo.name}-${indice}`} className="lista-anexos-item">
                <span>{arquivo.name}</span>
                <span className="mono">{formatarTamanho(arquivo.size)}</span>
                <button
                  type="button"
                  className="lista-anexos-remover"
                  onClick={() => removerAnexoNovo(indice)}
                  aria-label={`Remover ${arquivo.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <span className="campo-rotulo">
          Anexos (imagens ou PDF) — {anexosExistentes.length + anexosNovos.length}/{MAX_ANEXOS}
        </span>
      </div>

      {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

      <div className="formulario-acoes">
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : textoSalvar}
        </Button>
      </div>
    </form>
  );
}