// AtivoList.jsx
import Carregando from "../common/Carregando";
import AtivoRow from "./AtivoRow";

export default function AtivoList({ ativos, loading, erro, onSelecionar }) {
  if (loading) return <Carregando />;
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