import Carregando from "../common/Carregando";
import LimiteRow from "./LimiteRow";

export default function LimiteList({ limites, loading, erro, onSelecionar }) {
  if (loading) {
    return <Carregando />;
  }
  if (erro) {
    return <p className="estado-erro">{erro}</p>;
  }
  if (!limites.length) {
    return <p className="estado-vazio">Nenhuma solicitação encontrada.</p>;
  }

  return (
    <ul className="lista-clientes">
      {limites.map((limite) => (
        <LimiteRow key={limite.id} limite={limite} onSelecionar={onSelecionar} />
      ))}
    </ul>
  );
}