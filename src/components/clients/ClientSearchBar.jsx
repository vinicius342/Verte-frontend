export default function ClientSearchBar({ valor, onChange }) {
  return (
    <div className="busca">
      <span className="busca-icone" aria-hidden>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
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