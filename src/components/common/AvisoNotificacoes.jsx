import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { useAuth } from "../../hooks/useAuth";
import { useNotificacoesPush } from "../../hooks/useNotificacoesPush";

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const chaveAdiado = (uid) => `verte:push-aviso-adiado:${uid}`;

function estaAdiado(uid) {
  try {
    return Number(localStorage.getItem(chaveAdiado(uid)) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

export default function AvisoNotificacoes() {
  const { uid, dicaVista, precisaConfigurarAssinatura } = useAuth();
  const push = useNotificacoesPush();
  const [dispensado, setDispensado] = useState(() => estaAdiado(uid));

  const podeAtivar = push.elegivel && push.suportado && push.permissao === "default";
  const precisaInstalar = push.elegivel && push.precisaInstalar && push.permissao !== "granted";
  const aberto =
    !dispensado &&
    !precisaConfigurarAssinatura &&
    dicaVista("tutorialInicio") &&
    (podeAtivar || precisaInstalar);

  function adiar() {
    try {
      localStorage.setItem(chaveAdiado(uid), String(Date.now() + UM_DIA_MS));
    } catch {
      /* sem armazenamento: só esconde nesta sessão */
    }
    setDispensado(true);
  }

  return (
    <Modal aberto={aberto} titulo="Ativar avisos no celular" onFechar={adiar}>
      <div className="detalhe">
        {precisaInstalar ? (
          <p>
            No iPhone, instale o app na tela inicial (Compartilhar, depois Adicionar à Tela de Início) e
            abra por lá para receber os avisos.
          </p>
        ) : (
          <p>
            Receba no celular os avisos de comodato (novas solicitações e respostas), mesmo com o app
            fechado.
          </p>
        )}
        <div className="formulario-acoes">
          <Button variant="ghost" onClick={adiar}>
            Agora não
          </Button>
          {!precisaInstalar && (
            <Button onClick={push.ativar} disabled={push.ativando}>
              {push.ativando ? "Ativando…" : "Ativar avisos"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
