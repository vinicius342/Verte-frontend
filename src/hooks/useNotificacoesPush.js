import { useCallback, useEffect, useState } from "react";
import { getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { registrarDispositivo } from "../services/notificacaoService";
import { useAuth } from "./useAuth";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const CHAVE_REGISTRO = "verte:push-registrado";
const PAPEIS = ["vendedor", "supervisor", "gerente"];

function lerRegistro() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_REGISTRO) ?? "null");
  } catch {
    return null;
  }
}

function permissaoAtual() {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

export function useNotificacoesPush() {
  const { uid, usuario, papel, revendedoraId } = useAuth();
  const [suportado, setSuportado] = useState(false);
  const [permissao, setPermissao] = useState(permissaoAtual);
  const [ativando, setAtivando] = useState(false);

  const elegivel = Boolean(uid && usuario && revendedoraId && VAPID_KEY && PAPEIS.includes(papel));
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalado =
    window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true;

  useEffect(() => {
    let ativo = true;
    isSupported()
      .then((ok) => {
        if (ativo) setSuportado(ok);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const registrar = useCallback(async () => {
    if (!elegivel || permissaoAtual() !== "granted") return;
    const registro = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });
    const token = await getToken(getMessaging(getApp()), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registro,
    });
    if (!token) return;
    // Só chama o backend quando o aparelho ou o usuário mudou (evita escrita à toa).
    const anterior = lerRegistro();
    if (anterior?.token === token && anterior?.uid === uid) return;
    await registrarDispositivo(revendedoraId, token);
    localStorage.setItem(CHAVE_REGISTRO, JSON.stringify({ token, uid }));
  }, [elegivel, uid, revendedoraId]);

  useEffect(() => {
    if (!suportado || !elegivel || permissao !== "granted") return;
    registrar().catch((e) => console.error("Falha ao registrar o aparelho para avisos:", e));
  }, [suportado, elegivel, permissao, registrar]);

  const ativar = useCallback(async () => {
    if (!suportado) return;
    setAtivando(true);
    try {
      setPermissao(await Notification.requestPermission());
    } finally {
      setAtivando(false);
    }
  }, [suportado]);

  return { elegivel, suportado, permissao, ativando, ativar, precisaInstalar: ios && !instalado };
}
