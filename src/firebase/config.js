// Inicialização do app Firebase, agora só com Auth (login fica no frontend).
// Firestore e Storage passam pelo backend (verteApi).
// As chaves vêm de variáveis de ambiente (.env) — nunca hardcoded.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env["VITE_FIREBASE_API_KEY"],
  authDomain: env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: env["VITE_FIREBASE_PROJECT_ID"],
  appId: env["VITE_FIREBASE_APP_ID"],
  messagingSenderId: env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

// Inicialização tardia: só acontece quando um service realmente precisa,
// evitando execução durante a renderização no servidor.
function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no arquivo .env.",
    );
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
