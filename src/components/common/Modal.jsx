import { useEffect } from "react";

export default function Modal({ aberto, titulo, onFechar, children, dataTourCabecalho }) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => {
      if (e.key === "Escape") onFechar?.();
    };
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onFechar}>
      <div
        className="modal-painel"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-cabecalho" data-tour={dataTourCabecalho}>
          <h2 className="modal-titulo">{titulo}</h2>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  );
}
