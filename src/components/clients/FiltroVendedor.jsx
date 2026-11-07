import { useMemo } from "react";
import { useColaboradores } from "../../hooks/useColaboradores";

export default function FiltroVendedor({ clientes, valor, onChange }) {
  const { colaboradores, loading } = useColaboradores();

  const opcoes = useMemo(() => {
    const ids = [...new Set((clientes ?? []).map((cliente) => cliente.createdBy).filter(Boolean))];
    return ids
      .map((id) => ({
        id,
        nome: colaboradores.find((colaborador) => colaborador.id === id)?.nome ?? "Vendedor não identificado",
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [clientes, colaboradores]);

  if (loading) return null;

  return (
    <label className="campo">
      <span className="campo-rotulo">Vendedor</span>
      <select className="campo-input" value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos os vendedores</option>
        {opcoes.map(({ id, nome }) => (
          <option key={id} value={id}>
            {nome}
          </option>
        ))}
      </select>
    </label>
  );
}
