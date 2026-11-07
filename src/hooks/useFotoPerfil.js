import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./useAuth";
import { buscarUsuario } from "../services/userService";

let estado = { uid: null, fotoUrl: null, nome: null };
let uidBuscado = null;
const ouvintes = new Set();

function emitir(novo) {
  estado = { ...estado, ...novo };
  ouvintes.forEach((fn) => fn());
}

function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

// Chamado pela página de perfil depois de enviar/remover a foto.
export function atualizarFotoPerfil(uid, fotoUrl) {
  uidBuscado = uid;
  emitir({ uid, fotoUrl });
}

// Retorna { fotoUrl, nome } do cadastro em "usuarios" (nome é null até carregar).
export function useDadosUsuario() {
  const { uid, ehVisitante } = useAuth();
  const snap = useSyncExternalStore(assinar, () => estado);

  useEffect(() => {
    if (!uid || ehVisitante) {
      uidBuscado = null;
      return;
    }
    if (uidBuscado === uid) return;
    uidBuscado = uid;
    buscarUsuario(uid)
      .then((u) => emitir({ uid, fotoUrl: u?.fotoUrl ?? null, nome: u?.nome ?? null }))
      .catch((e) => {
        console.error("Erro ao carregar dados do usuário:", e);
        uidBuscado = null;
      });
  }, [uid, ehVisitante]);

  return snap.uid === uid
    ? { fotoUrl: snap.fotoUrl, nome: snap.nome }
    : { fotoUrl: null, nome: null };
}

// Mantido para quem só quer a foto.
export function useFotoPerfil() {
  return useDadosUsuario().fotoUrl;
}
