// Porta de entrada para o login (Firebase Authentication no SDK do frontend).
// O perfil em "usuarios" e o logout (revogação da sessão) passam pelo backend.
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "../firebase/config";
import { apiFetch } from "./apiFetch";
import { criarPerfilUsuario } from "./userService";

export async function login(email, senha) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, senha);
  return cred.user;
}

export async function enviarEmailRedefinicaoSenha(email) {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

// Revoga a sessão no backend (todos os dispositivos) e depois sai localmente.
export async function logout() {
  try {
    await apiFetch("auth/logout", { method: "POST" });
  } catch (erro) {
    console.error("Falha ao revogar a sessão no backend:", erro);
  } finally {
    await signOut(getFirebaseAuth());
  }
}

export async function cadastrarUsuario({ nome, email, senha }) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, senha);
  if (nome) {
    await updateProfile(cred.user, { displayName: nome });
  }
  await criarPerfilUsuario(cred.user.uid, { nome, email });
  return cred.user;
}

export function observarUsuarioLogado(callback) {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function traduzirErroAuth(codigo) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-not-found": "Nenhuma conta encontrada com esse e-mail.",
    "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente em alguns minutos.",
    "auth/network-request-failed": "Sem conexão. Verifique a internet.",
  };
  return mapa[codigo] ?? "Não foi possível concluir. Tente novamente.";
}
