import { getApp, initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getDb } from "../firebase/config";

export async function listarUsuarios(revendedoraId) {
  const q = query(collection(getDb(), "usuarios"), where("revendedoraId", "==", revendedoraId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"));
}

// Cria a conta numa instância secundária para não trocar a sessão de quem está logado.
export async function criarUsuarioPelaRevendedora(revendedoraId, { nome, email, senha, papel = "vendedor" }) {
  const appSec = initializeApp(getApp().options, `criacao-${Date.now()}`);
  let uid;
  try {
    const authSec = getAuth(appSec);
    const cred = await createUserWithEmailAndPassword(authSec, email, senha);
    uid = cred.user.uid;
    if (nome) await updateProfile(cred.user, { displayName: nome });

    await setDoc(doc(getFirestore(appSec), "usuarios", uid), {
      nome: nome ?? null,
      email,
      revendedoraId,
      papel: "vendedor", // as Rules só aceitam vendedor na criação
      ativo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await signOut(authSec);
  } finally {
    await deleteApp(appSec);
  }

  // Segundo passo, já com a sessão do admin
  if (papel !== "vendedor") {
    try {
      await atualizarUsuario(uid, { papel });
    } catch {
      const erro = new Error("Usuário criado como vendedor, mas não foi possível definir o papel. Edite-o na lista.");
      erro.parcial = true;
      throw erro;
    }
  }
  return uid;
}

export async function atualizarUsuario(uid, { nome, papel }) {
  const campos = { updatedAt: serverTimestamp() };
  if (nome !== undefined) campos.nome = nome.trim();
  if (papel !== undefined) campos.papel = papel;
  await updateDoc(doc(getDb(), "usuarios", uid), campos);
}

export async function definirAtivo(uid, ativo) {
  await updateDoc(doc(getDb(), "usuarios", uid), { ativo, updatedAt: serverTimestamp() });
}