import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  login as loginService,
  logout as logoutService,
  cadastrarUsuario as cadastrarService,
  observarUsuarioLogado,
} from "../services/authService";
import { buscarVinculo, REVENDEDORA_PADRAO } from "../services/userService";
import { buscarConfiguracao, salvarConfiguracao } from "../services/configService";
import { getFirebaseAuth, isFirebaseConfigured } from "../firebase/config";
import { signInAnonymously } from "firebase/auth";
import Carregando from "../components/common/Carregando";

export const AuthContext = createContext(null);

const DICAS_REINICIADAS = {
  tutorialInicio: false,
  tutorialComodato: false,
  tutorialLimite: false,
  detalheCliente: false,
  detalheComodato: false,
  detalheLimite: false,
  tutorial: false,
  copiarCliente: false,
  copiarComodato: false,
  copiarLimite: false,
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [revendedoraId, setRevendedoraId] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [papel, setPapel] = useState(null);
  const [assinaturaConfigurada, setAssinaturaConfigurada] = useState(null);
  const [trocarSenha, setTrocarSenha] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [dicasVistas, setDicasVistas] = useState({});
  const [loading, setLoading] = useState(true);
  const requisicao = useRef(0);
  const tentouAnonimo = useRef(false);

  // Só a busca mais recente vale: evita que uma resposta antiga sobrescreva a nova.
  const carregarPerfil = useCallback(async (uid, ehVisitante = false) => {
    const minha = ++requisicao.current;
    let vinculo = {
      revendedoraId: null,
      papel: null,
      ativo: true,
      assinaturaConfigurada: true,
      trocarSenha: false,
    };
    try {
      vinculo = await buscarVinculo(uid);
    } catch (e) {
      console.error("Falha ao buscar o vínculo do usuário:", e);
    }
    if (minha !== requisicao.current) return vinculo.revendedoraId;

    // Conta desativada: encerra a sessão; o listener de auth limpa o estado.
    if (vinculo.ativo === false) {
      await logoutService();
      return null;
    }

    if (ehVisitante) {
      vinculo = {
        ...vinculo,
        revendedoraId: REVENDEDORA_PADRAO,
        papel: "visitante",
        assinaturaConfigurada: true,
        trocarSenha: false,
      };
      setDicasVistas(null);
    } else {
      try {
        const config = await buscarConfiguracao(uid);
        if (minha !== requisicao.current) return vinculo.revendedoraId;
        setDicasVistas(config?.dicasVistas ?? {});
      } catch (e) {
        console.error("Falha ao buscar as dicas vistas:", e);
        if (minha !== requisicao.current) return vinculo.revendedoraId;
        // Sem a configuração não dá para saber o que já foi visto: não mostra nada.
        setDicasVistas(null);
      }
    }

    setRevendedoraId(vinculo.revendedoraId);
    setCodigo(vinculo.codigo ?? "");
    setPapel(vinculo.papel);
    setAssinaturaConfigurada(vinculo.assinaturaConfigurada);
    setTrocarSenha(!ehVisitante && vinculo.trocarSenha === true);
    return vinculo.revendedoraId;
  }, []);

  const recarregarVinculo = useCallback(() => {
    if (!usuario?.uid) return Promise.resolve();
    return carregarPerfil(usuario.uid, usuario.isAnonymous === true);
  }, [usuario, carregarPerfil]);

  useEffect(() => {
    const cancelar = observarUsuarioLogado(async (u) => {
      setUsuario(u ?? null);
      if (!u) {
        requisicao.current++;
        setRevendedoraId(null);
        setCodigo("");
        setPapel(null);
        setAssinaturaConfigurada(null);
        setTrocarSenha(false);
        setDicasVistas({});
        if (!isFirebaseConfigured() || tentouAnonimo.current || trocandoSenha) {
          setLoading(false);
          return;
        }
        tentouAnonimo.current = true;
        setLoading(true);
        try {
          await signInAnonymously(getFirebaseAuth());
        } catch (e) {
          console.error("Falha ao criar sessão de visitante:", e);
          setLoading(false);
        }
        return;
      }
      if (!u.isAnonymous) tentouAnonimo.current = false;
      setLoading(true);
      await carregarPerfil(u.uid, u.isAnonymous === true);
      setLoading(false);
    });
    return cancelar;
  }, [carregarPerfil, trocandoSenha]);

  const dicaVista = useCallback(
    (chave) => {
      if (dicasVistas == null) return true;
      return dicasVistas[chave] === true;
    },
    [dicasVistas],
  );

  const marcarDicaVista = useCallback(
    (chave) => {
      if (usuario?.isAnonymous) return;
      setDicasVistas((anterior) => ({ ...(anterior ?? {}), [chave]: true }));
      const uid = usuario?.uid;
      if (!uid) return;
      salvarConfiguracao(uid, { dicasVistas: { [chave]: true } }).catch((e) => {
        console.error("Falha ao salvar a dica vista:", e);
      });
    },
    [usuario?.uid],
  );

  const reiniciarTutoriais = useCallback(async () => {
    if (usuario?.isAnonymous) throw new Error("Visitantes não possuem tutoriais.");
    const uid = usuario?.uid;
    if (!uid) throw new Error("Usuário não autenticado.");
    await salvarConfiguracao(uid, { dicasVistas: DICAS_REINICIADAS });
    setDicasVistas((anterior) => ({ ...(anterior ?? {}), ...DICAS_REINICIADAS }));
  }, [usuario?.uid]);

  const value = useMemo(() => {
    const ehVisitante = usuario?.isAnonymous === true;
    const ehMotorista = ehVisitante || papel === "motorista" || papel === "auxiliar_motorista";
    return {
      usuario,
      uid: usuario?.uid ?? null,
      revendedoraId,
      codigo,
      papel,
      ehMotorista,
      ehVisitante,
      assinaturaConfigurada,
      precisaConfigurarAssinatura:
        !ehVisitante &&
        papel !== "admin" &&
        !ehMotorista &&
        papel != null &&
        assinaturaConfigurada === false,
      definirAssinaturaConfigurada: setAssinaturaConfigurada,
      podeConfigurar: !ehVisitante && (papel === "admin" || papel === "gerente"),
      nome: usuario?.displayName ?? usuario?.email ?? null,
      loading,
      configurado: isFirebaseConfigured(),
      trocarSenha,
      trocandoSenha,
      setTrocandoSenha,
      dicasVistas,
      dicaVista,
      marcarDicaVista,
      reiniciarTutoriais,
      recarregarVinculo,
      login: (email, senha) => loginService(email, senha),
      logout: () => logoutService(),
      // O listener de auth dispara antes de o perfil ser criado; busca de novo ao terminar.
      cadastrar: async (dados) => {
        const u = await cadastrarService(dados);
        await carregarPerfil(u.uid);
        return u;
      },
    };
  }, [
    usuario,
    revendedoraId,
    codigo,
    papel,
    assinaturaConfigurada,
    loading,
    trocarSenha,
    trocandoSenha,
    dicasVistas,
    dicaVista,
    marcarDicaVista,
    reiniciarTutoriais,
    recarregarVinculo,
    carregarPerfil,
  ]);

  if (loading) return <Carregando cheia />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
