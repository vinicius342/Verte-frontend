import { useRef, useState } from "react";
import Button from "../common/Button";

function dadosIniciais(ativo) {
  return {
    codigo: ativo?.codigo ?? "",
    material: ativo?.material ?? "",
    tipo: ativo?.tipo ?? "",
  };
}

export default function AtivoForm({ onSalvar, onCancelar, ativoExistente }) {
  const refs = {
    codigo: useRef(null),
    material: useRef(null),
    tipo: useRef(null),
  };
  const [dados, setDados] = useState(() => dadosIniciais(ativoExistente));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  function alterar(campo) {
    return (e) => {
      const valor = e.target.value;
      setDados((atual) => ({ ...atual, [campo]: valor }));
      setErros((atual) => ({ ...atual, [campo]: undefined }));
    };
  }

  async function enviar(e) {
    e.preventDefault();
    const novosErros = {};
    if (!dados.codigo.trim()) novosErros.codigo = "Informe o código.";
    if (!dados.material.trim()) novosErros.material = "Informe o material.";
    if (!dados.tipo.trim()) novosErros.tipo = "Informe o tipo.";

    setErros(novosErros);
    const primeiro = ["codigo", "material", "tipo"].find((c) => novosErros[c]);
    if (primeiro) {
      refs[primeiro].current?.focus();
      return;
    }

    setEnviando(true);
    setErroGeral(null);
    try {
      await onSalvar(dados);
    } catch (erro) {
      if (erro?.code === "ativo-duplicado") {
        setErros((atual) => ({ ...atual, codigo: erro.message }));
        refs.codigo.current?.focus();
      } else {
        setErroGeral(erro?.message ?? "Não foi possível salvar.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <label className="campo">
        <span className="campo-rotulo">Código</span>
        <input ref={refs.codigo} className="campo-input mono" value={dados.codigo} onChange={alterar("codigo")} />
        {erros.codigo ? <span className="campo-erro">{erros.codigo}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Material</span>
        <input ref={refs.material} className="campo-input" value={dados.material} onChange={alterar("material")} />
        {erros.material ? <span className="campo-erro">{erros.material}</span> : null}
      </label>

      <label className="campo">
        <span className="campo-rotulo">Tipo</span>
        <input ref={refs.tipo} className="campo-input" value={dados.tipo} onChange={alterar("tipo")} />
        {erros.tipo ? <span className="campo-erro">{erros.tipo}</span> : null}
      </label>

      {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

      <div className="formulario-acoes">
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}