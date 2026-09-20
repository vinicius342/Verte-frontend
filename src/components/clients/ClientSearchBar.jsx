export default function ClientSearchBar({ valor, onChange }) {
  return (
    <div className="busca">
      <span className="busca-icone" aria-hidden>
        ⌕
      </span>
      <input
        type="search"
        className="busca-campo"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por cliente, comércio ou rua"
        aria-label="Buscar clientes"
      />
    </div>
  );
}
