import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AtivoAutocomplete({
  campo, // "codigo" ou "material": em qual campo do ativo buscar
  valor,
  selecionado,
  ativos,
  loading,
  placeholder,
  mono = false,
  inputMode,
  erro,
  onDigitar,
  onSelecionar,
  onIrParaAtivos,
}) {
  const [aberto, setAberto] = useState(false);
  const { podeConfigurar } = useAuth();
  const termo = normalizar(valor).trim();

  const sugestoes = useMemo(() => {
    if (!termo || selecionado) return [];
    return ativos.filter((a) => normalizar(a[campo]).includes(termo)).slice(0, 6);
  }, [ativos, campo, selecionado, termo]);

  const naoCadastrado = Boolean(termo) && !selecionado && !loading && (sugestoes.length === 0 || erro);

  return (
    <div className="comodato-autocomplete">
      <input
        className={`campo-input ${mono ? "mono" : ""}`}
        placeholder={placeholder}
        value={valor}
        inputMode={inputMode}
        autoComplete="off"
        onChange={(e) => {
          onDigitar(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={(e) => e.key === "Escape" && setAberto(false)}
      />

      {aberto && sugestoes.length > 0 ? (
        <div className="comodato-autocomplete-dropdown" role="listbox">
          {sugestoes.map((ativo) => (
            <button
              key={ativo.id}
              type="button"
              role="option"
              className="comodato-autocomplete-item"
              // mouseDown evita o blur do input antes do clique registrar
              onMouseDown={(e) => {
                e.preventDefault();
                onSelecionar(ativo);
                setAberto(false);
              }}
            >
              <span className="comodato-autocomplete-nome mono">{ativo.codigo}</span>
              <span className="comodato-autocomplete-comercio">{ativo.material}</span>
            </button>
          ))}
        </div>
      ) : null}

      {naoCadastrado ? (
        <span className="campo-erro">
          {podeConfigurar ? (
            <>
              Ativo não cadastrado.{" "}
              <button type="button" className="ativo-autocomplete-link" onClick={onIrParaAtivos}>
                Cadastrar ativo
              </button>
            </>
          ) : (
            "Ativo não cadastrado. Peça a um responsável para cadastrá-lo."
          )}
        </span>
      ) : null}
    </div>
  );
}