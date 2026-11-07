import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { buscarPerfil } from "../services/perfilService";
import { buscarUsuario } from "../services/userService";

const PAPEIS_COM_SUPERVISOR = ["vendedor", "motorista", "auxiliar_motorista"];

const ESTADO_INICIAL = {
  perfil: null,
  usuario: null,
  supervisor: null,
  temGerente: false,
  exigeSupervisor: false,
  supervisorErro: false,
};

// Carrega o perfil do usuário logado. Nome, código e supervisor vêm do cadastro
// em "usuarios" (editado por admin/gerente); só a assinatura é do próprio usuário.
// O `perfil` retornado já traz vendedor/vendedorCodigo/supervisor/supervisorCodigo
// atualizados, então quem consome (Comodato, Limite...) não precisa mudar.
export function usePerfil() {
  const { uid, revendedoraId, ehVisitante, loading: loadingAuth } = useAuth();
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (loadingAuth) return;
    if (!uid || !revendedoraId || ehVisitante) {
      setLoading(false);
      return;
    }

    let cancelado = false;

    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const [perfilDoc, usuario] = await Promise.all([
          buscarPerfil(revendedoraId, uid),
          buscarUsuario(uid),
        ]);

        const exigeSupervisor = PAPEIS_COM_SUPERVISOR.includes(usuario?.papel);

        let supervisor = null;
        let supervisorErro = false;
        if (exigeSupervisor && usuario?.supervisorId) {
          try {
            supervisor = await buscarUsuario(usuario.supervisorId);
          } catch (e) {
            console.error("Erro ao carregar supervisor:", e);
            supervisorErro = true;
          }
        }

        const perfil = {
          ...(perfilDoc ?? {}),
          vendedor: usuario?.nome ?? perfilDoc?.vendedor ?? "",
          vendedorCodigo: usuario?.codigo ?? perfilDoc?.vendedorCodigo ?? "",
          supervisor: supervisor?.nome ?? "",
          supervisorCodigo: supervisor?.codigo ?? "",
        };

        if (!cancelado) {
          setEstado({
            perfil,
            usuario,
            supervisor,
            temGerente: Boolean(usuario?.gerenteId),
            exigeSupervisor,
            supervisorErro,
          });
        }
      } catch (e) {
        console.error("Erro ao carregar perfil:", e);
        if (!cancelado) setErro(e?.message ?? "Não foi possível carregar o perfil.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [uid, revendedoraId, ehVisitante, loadingAuth]);

  return { ...estado, loading, erro };
}
