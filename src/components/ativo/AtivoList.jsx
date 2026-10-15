// AtivoList.jsx
import AtivoRow from "./AtivoRow";

export default function AtivoList({ ativos, loading, erro, onSelecionar }) {
  if (loading) return <p className="estado-vazio">Carregando ativos…</p>;
  if (erro) return <p className="estado-erro">{erro}</p>;
  if (!ativos.length) return <p className="estado-vazio">Nenhum ativo encontrado.</p>;

  return (
    <ul className="lista-clientes">
      {ativos.map((ativo) => (
        <AtivoRow key={ativo.id} ativo={ativo} onSelecionar={onSelecionar} />
      ))}
    </ul>
  );
}