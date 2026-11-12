import { useCallback, useEffect, useRef, useState } from "react";
import { getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { registrarDispositivo } from "../services/notificacaoService";
import { useAuth } from "./useAuth";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const CHAVE_REGISTRO = "verte:push-registrado";
const PAPEIS = ["vendedor", "supervisor", "gerente"];

function chaveRegistro(uid) {
  return `${CHAVE_REGISTRO}:${uid}`;
}

// Guarda o token registrado para este usuário neste aparelho.
function lerRegistro(uid) {
  if (!uid) return null;
  try {
    return localStorage.getItem(chaveRegistro(uid));
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
  const registrando = useRef(false);
  const registrarRef = useRef(null);

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

  useEffect(() => {
    const atualizar = () => setPermissao(permissaoAtual());
    window.addEventListener("verte:push-permissao", atualizar);
    return () => window.removeEventListener("verte:push-permissao", atualizar);
  }, []);

  const registrar = useCallback(async () => {
    if (registrando.current) return;
    registrando.current = true;
    try {
      if (!uid) return;
      if (!elegivel || permissaoAtual() !== "granted") return;
      const registro = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/firebase-cloud-messaging-push-scope",
      });
      const token = await getToken(getMessaging(getApp()), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registro,
      });
      if (!token) return;
      // Só chama o backend quando o token deste usuário neste aparelho mudou (evita escrita à toa).
      if (lerRegistro(uid) === token) return;
      await registrarDispositivo(revendedoraId, token);
      localStorage.setItem(chaveRegistro(uid), token);
    } finally {
      registrando.current = false;
    }
  }, [elegivel, uid, revendedoraId]);

  // Mantém a chamada do efeito sempre com a versão atual de registrar().
  useEffect(() => {
    registrarRef.current = registrar;
  }, [registrar]);

  useEffect(() => {
    if (!uid || !suportado || !elegivel || permissao !== "granted") return;
    registrarRef
      .current?.()
      .catch((erro) => console.error("Falha ao registrar o aparelho para avisos", erro));
  }, [uid, elegivel, suportado, permissao]);

  const ativar = useCallback(async () => {
    if (!suportado) return;
    setAtivando(true);
    try {
      const resultado = await Notification.requestPermission();
      setPermissao(resultado);
      window.dispatchEvent(new Event("verte:push-permissao"));
    } finally {
      setAtivando(false);
    }
  }, [suportado]);

  return { elegivel, suportado, permissao, ativando, ativar, precisaInstalar: ios && !instalado };
}
