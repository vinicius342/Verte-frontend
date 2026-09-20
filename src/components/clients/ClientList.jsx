import ClientRow from "./ClientRow";

export default function ClientList({ clientes, loading, erro, onSelecionar }) {
  if (loading) {
    return <p className="estado-vazio">Carregando clientes…</p>;
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
