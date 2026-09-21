import { useState } from "react";
import Button from "../common/Button";
import { validarCliente, formatarWhatsapp } from "../../utils/validators";
import { parseCoordenada, formatarCoordenada } from "../../utils/coordinateParser";

function estadoInicial(cliente) {
  return {
    nomeCliente: cliente?.nomeCliente ?? "",
    nomeComercio: cliente?.nomeComercio ?? "",
    rua: cliente?.rua ?? "",
    numero: cliente?.numero ?? "",
    complemento: cliente?.complemento ?? "",
    whatsapp: cliente?.whatsapp ?? "",
    coordenadaTexto: formatarCoordenada(cliente?.coordenada),
  };
}

// Formulário reaproveitado na criação e na edição de clientes.
export default function ClientForm({ cliente, onSalvar, onCancelar, textoSalvar = "Salvar" }) {
  const [dados, setDados] = useState(() => estadoInicial(cliente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  const alterar = (campo) => (e) => {
    const valor = campo === "whatsapp" ? formatarWhatsapp(e.target.value) : e.target.value;
    setDados((atual) => ({ ...atual, [campo]: valor }));
  };

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
      await onSalvar({ ...dados, coordenada: parsed.coordenada });
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

      <p className="campo-dica">Preencha a coordenada apenas quando o endereço não for conhecido.</p>
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
