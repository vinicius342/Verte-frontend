import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useColaboradores } from "../../hooks/useColaboradores";

export default function FiltroVendedor({ clientes, valor, onChange }) {
  const { colaboradores, loading } = useColaboradores();

  const opcoes = useMemo(() => {
    const ids = [...new Set(clientes.map((c) => c.createdBy).filter(Boolean))];
    return ids
      .map((id) => ({
        id,
        nome: colaboradores.find((c) => c.id === id)?.nome || "Vendedor não identificado",
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [clientes, colaboradores]);

  if (loading) return null;

  return (
    <div className="filtro-vendedor">
      <label htmlFor="vendedor" className="filtro-vendedor-label">
        Vendedor
      </label>
      <span className="filtro-vendedor-campo">
        <select
          id="vendedor"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="filtro-vendedor-select"
        >
          <option value="">Todos os vendedores</option>
          {opcoes.map(({ id, nome }) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>
        <ChevronDown className="filtro-vendedor-icone" size={16} aria-hidden="true" />
      </span>
    </div>
  );
}
