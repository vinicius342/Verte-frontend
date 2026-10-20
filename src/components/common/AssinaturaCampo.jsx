import { useEffect, useState } from "react";
import SignaturePad from "./SignaturePad";
import AssinaturaTelaCheia from "./AssinaturaTelaCheia";
import "../../styles/assinatura.css";

// Celular (toque) ou tela estreita: botão que abre a assinatura em tela cheia.
// Desktop: mantém o SignaturePad atual.
const CONSULTA_MOBILE = "(pointer: coarse), (max-width: 640px)";

function useEhMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(CONSULTA_MOBILE).matches);

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA_MOBILE);
    const aoMudar = (e) => setMobile(e.matches);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return mobile;
}

export default function AssinaturaCampo({ valor, onAlterar }) {
  const mobile = useEhMobile();
  const [aberta, setAberta] = useState(false);

  if (!mobile) return <SignaturePad valor={valor} onAlterar={onAlterar} />;

  return (
    <div className="assinatura-campo">
      <div className="assinatura-campo__previa">
        {valor ? (
          <img src={valor} alt="Sua assinatura" className="assinatura-campo__imagem" />
        ) : (
          <span className="assinatura-campo__vazio">Nenhuma assinatura</span>
        )}
      </div>

      <button type="button" className="assinatura-campo__botao" onClick={() => setAberta(true)}>
        {valor ? "Refazer assinatura" : "Assinar"}
      </button>

      {aberta ? (
        <AssinaturaTelaCheia
          onCancelar={() => setAberta(false)}
          onConfirmar={(dataUrl) => {
            onAlterar(dataUrl);
            setAberta(false);
          }}
        />
      ) : null}
    </div>
  );
}