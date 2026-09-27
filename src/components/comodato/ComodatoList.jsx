import ComodatoRow from "./ComodatoRow";

export default function ComodatoList({ comodatos, loading, erro, onSelecionar }) {
  if (loading) {
    return <p className="estado-vazio">Carregando comodatos…</p>;
  }
  if (erro) {
    return <p className="estado-erro">{erro}</p>;
  }
  if (!comodatos.length) {
    return <p className="estado-vazio">Nenhum comodato encontrado.</p>;
  }

  return (
    <ul className="lista-clientes">
      {comodatos.map((comodato) => (
        <ComodatoRow key={comodato.id} comodato={comodato} onSelecionar={onSelecionar} />
      ))}
    </ul>
  );
}