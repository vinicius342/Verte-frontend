import Carregando from "../common/Carregando";
import ClientRow from "./ClientRow";

export default function ClientList({ clientes, loading, erro, onSelecionar }) {
  if (loading) {
    return <Carregando />;
  }
  if (erro) {
    return <p className="estado-erro">{erro}</p>;
  }
  if (!clientes.length) {
    return <p className="estado-vazio">Nenhum cliente encontrado.</p>;
  }

  return (
    <ul className="lista-clientes">
      {clientes.map((cliente) => (
        <ClientRow key={cliente.id} cliente={cliente} onSelecionar={onSelecionar} />
      ))}
    </ul>
  );
}
