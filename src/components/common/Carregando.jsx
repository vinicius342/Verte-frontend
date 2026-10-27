export default function Carregando({ tela = false, escala = 1, variante, cheia = false }) {
  return (
    <div
      className={`carregando ${tela ? "carregando--tela" : ""} ${cheia ? "carregando--cheia" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`loader ${variante ? `loader--${variante}` : ""}`}
        style={{ "--size": `${escala}px` }}
        aria-hidden="true"
      />
      <span className="sr-only">Carregando</span>
    </div>
  );
}
