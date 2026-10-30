import { useState, useEffect, useRef } from "react";
import Button from "../common/Button";
import { formatarWhatsapp, formatarCpfCnpj, formatarCep } from "../../utils/validators";
import { validarCliente } from "../../utils/validacoesCliente";
import { parseCoordenada, formatarCoordenada } from "../../utils/coordinateParser";
import { textoLocalizacaoAproximada } from "../../utils/distancia";

const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024; // 10MB
const TIPOS_ACEITOS = ["image/", "application/pdf"];
const MAX_ANEXOS = 5;

const ORDEM_CAMPOS = [
  "nomeCliente",
  "nomeComercio",
  "cpf",
  "codPdv",
  "responsavel",
  "segmento",
  "rua",
  "numero",
  "bairro",
  "cidade",
  "cep",
  "whatsapp",
  "whatsapp2",
  "whatsapp3",
  "coordenada",
];

function estadoInicial(cliente) {
  return {
    nomeCliente: cliente?.nomeCliente ?? "",
    nomeComercio: cliente?.nomeComercio ?? "",
    codPdv: cliente?.codPdv ?? "",
    cpf: cliente?.cpf ?? "",
    segmento: cliente?.segmento ?? cliente?.seguimento ?? "",
    responsavel: cliente?.responsavel ?? "",
    rua: cliente?.rua ?? "",
    numero: cliente?.numero ?? "",
    complemento: cliente?.complemento ?? "",
    bairro: cliente?.bairro ?? "",
    cidade: cliente?.cidade ?? "",
    cep: formatarCep(cliente?.cep),
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

// Gera e limpa a URL temporária de preview para arquivos ainda não enviados.
function MiniaturaArquivo({ arquivo }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!arquivo.type?.startsWith("image/")) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(arquivo);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [arquivo]);

  if (!url) return <span className="lista-anexos-icone" aria-hidden>📄</span>;
  return <img src={url} alt="" className="lista-anexos-miniatura" />;
}

// Formulário reaproveitado na criação e na edição de clientes.
export default function ClientForm({ cliente, onSalvar, onCancelar, textoSalvar = "Salvar" }) {
  const [dados, setDados] = useState(() => estadoInicial(cliente));
  const [anexosExistentes, setAnexosExistentes] = useState(cliente?.anexos ?? []);
  const [anexosNovos, setAnexosNovos] = useState([]);
  const [anexosRemovidos, setAnexosRemovidos] = useState([]);
  const [erros, setErros] = useState(() => (cliente?.id ? validarCliente(estadoInicial(cliente)) : {}));
  const [enviando, setEnviando] = useState(false);
  const [obtendoCoordenada, setObtendoCoordenada] = useState(false);
  const [avisoCoordenada, setAvisoCoordenada] = useState(null);
  const [erroGeral, setErroGeral] = useState(null);
  const consultaCepRef = useRef(0);
  const camposRef = useRef({});

  function registrarRef(campo) {
    return (elemento) => {
      camposRef.current[campo] = elemento;
    };
  }

  function rolarParaPrimeiroErro(novosErros) {
    const campo = ORDEM_CAMPOS.find((nome) => novosErros[nome]) ?? Object.keys(novosErros)[0];
    const elemento = campo ? camposRef.current[campo] : null;
    if (!elemento) return;

    window.requestAnimationFrame(() => {
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });
      elemento.focus?.();
    });
  }

  function consultarCep(digitos, consulta) {
    fetch(`https://viacep.com.br/ws/${digitos}/json/`)
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((endereco) => {
        if (consulta !== consultaCepRef.current || !endereco || endereco.erro) return;
        setDados((atual) => ({
          ...atual,
          bairro: atual.bairro?.trim() ? atual.bairro : endereco.bairro ?? "",
          cidade: atual.cidade?.trim() ? atual.cidade : endereco.localidade ?? "",
        }));
      })
      .catch(() => {});
  }

  const alterar = (campo) => (e) => {
    const ehWhatsapp = campo === "whatsapp" || campo === "whatsapp2" || campo === "whatsapp3";
    let valor = campo === "cpf" ? formatarCpfCnpj(e.target.value) : ehWhatsapp ? formatarWhatsapp(e.target.value) : e.target.value;
    if (campo === "cep") {
      valor = formatarCep(e.target.value);
      const digitos = valor.replace(/\D/g, "");
      consultaCepRef.current += 1;
      if (digitos.length === 8) consultarCep(digitos, consultaCepRef.current);
    }
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

  function adquirirCoordenada() {
    setAvisoCoordenada(null);
    setErros((atual) => ({ ...atual, coordenada: undefined }));
    if (!("geolocation" in navigator)) {
      setErros((atual) => ({ ...atual, coordenada: "Seu navegador não suporta localização." }));
      return;
    }

    setObtendoCoordenada(true);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const { latitude, longitude, accuracy } = posicao.coords;
        const lat = Number(latitude.toFixed(6));
        const lng = Number(longitude.toFixed(6));
        const texto = formatarCoordenada({ lat, lng });
        setDados((atual) => ({ ...atual, coordenadaTexto: texto }));
        setAvisoCoordenada(accuracy > 100 ? `Localização aproximada (precisão de ${Math.round(accuracy)} m). Confira antes de salvar; no celular com GPS fica mais precisa.` : null);
        setObtendoCoordenada(false);
      },
      (erro) => {
        setAvisoCoordenada(null);
        const mensagens = {
          1: "Permissão de localização negada. Ative a localização no aparelho e permita o acesso nas configurações do navegador.",
          2: "Não foi possível obter a localização. Verifique se o GPS está ligado.",
          3: "Tempo esgotado ao obter a localização. Tente novamente em um local aberto.",
        };
        setErros((atual) => ({
          ...atual,
          coordenada: mensagens[erro.code] ?? "Não foi possível obter a localização.",
        }));
        setObtendoCoordenada(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function enviar(e) {
    e.preventDefault();
    const novos = validarCliente(dados);
    const parsed = parseCoordenada(dados.coordenadaTexto);
    if (!parsed.valido) novos.coordenada = "Use o formato -3.7327, -38.5267.";
    setErros(novos);
    if (Object.keys(novos).length > 0) {
      rolarParaPrimeiroErro(novos);
      return;
    }

    setEnviando(true);
    setErroGeral(null);
    try {
      await onSalvar({
        ...dados,
        cep: (dados.cep ?? "").replace(/\D/g, ""),
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

  const totalAnexos = anexosExistentes.length + anexosNovos.length;
  const localizacaoAproximada = textoLocalizacaoAproximada(cliente);

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <label className="campo">
        <span className="campo-rotulo">Nome do cliente *</span>
        <input
          ref={registrarRef("nomeCliente")}
          className="campo-input"
          value={dados.nomeCliente}
          onChange={alterar("nomeCliente")}
          required
        />
        {erros.nomeCliente ? <span className="campo-erro">{erros.nomeCliente}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Nome do comércio *</span>
        <input
          ref={registrarRef("nomeComercio")}
          className="campo-input"
          value={dados.nomeComercio}
          onChange={alterar("nomeComercio")}
          required
        />
        {erros.nomeComercio ? <span className="campo-erro">{erros.nomeComercio}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Cód PDV *</span>
        <input
          ref={registrarRef("codPdv")}
          className="campo-input mono"
          value={dados.codPdv}
          onChange={alterar("codPdv")}
          required
        />
        {erros.codPdv ? <span className="campo-erro">{erros.codPdv}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">CPF/CNPJ *</span>
        <input
          ref={registrarRef("cpf")}
          className="campo-input mono"
          value={dados.cpf}
          onChange={alterar("cpf")}
          inputMode="numeric"
          required
        />
        {erros.cpf ? <span className="campo-erro">{erros.cpf}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Segmento *</span>
        <input
          ref={registrarRef("segmento")}
          className="campo-input"
          value={dados.segmento}
          onChange={alterar("segmento")}
          required
        />
        {erros.segmento ? <span className="campo-erro">{erros.segmento}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Responsável *</span>
        <input
          ref={registrarRef("responsavel")}
          className="campo-input"
          value={dados.responsavel}
          onChange={alterar("responsavel")}
          placeholder="Ex. Sr Joelio"
          required
        />
        {erros.responsavel ? <span className="campo-erro">{erros.responsavel}</span> : null}
      </label>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Rua *</span>
          <input
            ref={registrarRef("rua")}
            className="campo-input"
            value={dados.rua}
            onChange={alterar("rua")}
            required
          />
          {erros.rua ? <span className="campo-erro">{erros.rua}</span> : null}
        </label>
        <label className="campo">
          <span className="campo-rotulo">Número *</span>
          <input
            ref={registrarRef("numero")}
            className="campo-input mono"
            value={dados.numero}
            onChange={alterar("numero")}
            inputMode="text"
            required
          />
          <span className="campo-dica">Use S/N se não houver número</span>
          {erros.numero ? <span className="campo-erro">{erros.numero}</span> : null}
        </label>
      </div>

      <div className="campo-linha">
        <label className="campo">
          <span className="campo-rotulo">Bairro *</span>
          <input
            ref={registrarRef("bairro")}
            className="campo-input"
            value={dados.bairro}
            onChange={alterar("bairro")}
            required
          />
          {erros.bairro ? <span className="campo-erro">{erros.bairro}</span> : null}
        </label>
        <label className="campo">
          <span className="campo-rotulo">Cidade *</span>
          <input
            ref={registrarRef("cidade")}
            className="campo-input"
            value={dados.cidade}
            onChange={alterar("cidade")}
            required
          />
          {erros.cidade ? <span className="campo-erro">{erros.cidade}</span> : null}
        </label>
      </div>

      <label className="campo">
        <span className="campo-rotulo">CEP *</span>
        <input
          ref={registrarRef("cep")}
          className="campo-input mono"
          value={dados.cep}
          onChange={alterar("cep")}
          inputMode="numeric"
          placeholder="00000-000"
          required
        />
        <span className="campo-dica">Usado para localizar o cliente quando não houver GPS capturado.</span>
        {erros.cep ? <span className="campo-erro">{erros.cep}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Complemento</span>
        <input className="campo-input" value={dados.complemento} onChange={alterar("complemento")} />
      </label>

      <label className="campo">
        <span className="campo-rotulo">Celular/WhatsApp *</span>
        <input
          ref={registrarRef("whatsapp")}
          className="campo-input mono"
          value={dados.whatsapp}
          onChange={alterar("whatsapp")}
          inputMode="tel"
          placeholder="(85) 99999-9999"
        />
        <span className="campo-dica">Preencha pelo menos um celular/WhatsApp (DDD + 9 dígitos).</span>
        {erros.whatsapp ? <span className="campo-erro">{erros.whatsapp}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Celular/WhatsApp 2</span>
        <input
          ref={registrarRef("whatsapp2")}
          className="campo-input mono"
          value={dados.whatsapp2}
          onChange={alterar("whatsapp2")}
          inputMode="tel"
          placeholder="(85) 99999-9999"
        />
        {erros.whatsapp2 ? <span className="campo-erro">{erros.whatsapp2}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Celular/WhatsApp 3</span>
        <input
          ref={registrarRef("whatsapp3")}
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

      <p className="campo-dica">Preencha a coordenada apenas quando o endereço não for conhecido.</p>
      <div className="campo">
        <span className="campo-rotulo">Coordenada</span>
        <div className="campo-com-botao">
          <input
            ref={registrarRef("coordenada")}
            className="campo-input mono"
            value={dados.coordenadaTexto}
            onChange={(e) => {
              setAvisoCoordenada(null);
              alterar("coordenadaTexto")(e);
            }}
            placeholder="-3.7327, -38.5267"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={adquirirCoordenada}
            disabled={obtendoCoordenada}
          >
            {obtendoCoordenada ? "Obtendo…" : "Adquirir coordenada"}
          </Button>
        </div>
        {erros.coordenada ? <span className="campo-erro">{erros.coordenada}</span> : null}
        {avisoCoordenada ? <span className="campo-aviso">{avisoCoordenada}</span> : null}
        {localizacaoAproximada && !dados.coordenadaTexto?.trim() ? (
          <span className="campo-dica">{localizacaoAproximada}</span>
        ) : null}
      </div>

      <div className="campo">
        <span className="campo-rotulo">
          Anexos (imagens ou PDF) — {totalAnexos}/{MAX_ANEXOS}
        </span>
        <input
          type="file"
          className="campo-input"
          accept="image/*,application/pdf"
          multiple
          disabled={totalAnexos >= MAX_ANEXOS}
          onChange={selecionarArquivos}
        />
        {erros.anexos ? <span className="campo-erro">{erros.anexos}</span> : null}

        {totalAnexos > 0 && (
          <ul className="lista-anexos">
            {anexosExistentes.map((anexo) => (
              <li key={anexo.caminho} className="lista-anexos-item">
                {anexo.tipo?.startsWith("image/") ? (
                  <img src={anexo.url} alt="" className="lista-anexos-miniatura" />
                ) : (
                  <span className="lista-anexos-icone" aria-hidden>📄</span>
                )}
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
                <MiniaturaArquivo arquivo={arquivo} />
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
