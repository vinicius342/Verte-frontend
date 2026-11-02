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
import { buscarVinculo } from "../services/userService";
import { buscarConfiguracao, salvarConfiguracao } from "../services/configService";
import { isFirebaseConfigured } from "../firebase/config";
import Carregando from "../components/common/Carregando";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [revendedoraId, setRevendedoraId] = useState(null);
  const [papel, setPapel] = useState(null);
  const [assinaturaConfigurada, setAssinaturaConfigurada] = useState(null);
  const [trocarSenha, setTrocarSenha] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [dicasVistas, setDicasVistas] = useState({});
  const [loading, setLoading] = useState(true);
  const requisicao = useRef(0);

  // Só a busca mais recente vale: evita que uma resposta antiga sobrescreva a nova.
  const carregarPerfil = useCallback(async (uid) => {
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

    setRevendedoraId(vinculo.revendedoraId);
    setPapel(vinculo.papel);
    setAssinaturaConfigurada(vinculo.assinaturaConfigurada);
    setTrocarSenha(vinculo.trocarSenha === true);
    return vinculo.revendedoraId;
  }, []);

  const recarregarVinculo = useCallback(() => {
    if (!usuario?.uid) return Promise.resolve();
    return carregarPerfil(usuario.uid);
  }, [usuario?.uid, carregarPerfil]);

  useEffect(() => {
    const cancelar = observarUsuarioLogado(async (u) => {
      setUsuario(u ?? null);
      if (!u) {
        requisicao.current++;
        setRevendedoraId(null);
        setPapel(null);
        setAssinaturaConfigurada(null);
        setTrocarSenha(false);
        setDicasVistas({});
        setLoading(false);
        return;
      }
      setLoading(true);
      await carregarPerfil(u.uid);
      setLoading(false);
    });
    return cancelar;
  }, [carregarPerfil]);

  const dicaVista = useCallback(
    (chave) => {
      if (dicasVistas == null) return true;
      return dicasVistas[chave] === true;
    },
    [dicasVistas],
  );

  const marcarDicaVista = useCallback(
    (chave) => {
      setDicasVistas((anterior) => ({ ...(anterior ?? {}), [chave]: true }));
      const uid = usuario?.uid;
      if (!uid) return;
      salvarConfiguracao(uid, { dicasVistas: { [chave]: true } }).catch((e) => {
        console.error("Falha ao salvar a dica vista:", e);
      });
    },
    [usuario?.uid],
  );

  const value = useMemo(() => {
    const ehMotorista = papel === "motorista" || papel === "auxiliar_motorista";
    return {
      usuario,
      uid: usuario?.uid ?? null,
      revendedoraId,
      papel,
      ehMotorista,
      assinaturaConfigurada,
      precisaConfigurarAssinatura:
        papel !== "admin" && !ehMotorista && papel != null && assinaturaConfigurada === false,
      definirAssinaturaConfigurada: setAssinaturaConfigurada,
      podeConfigurar: papel === "admin" || papel === "gerente",
      nome: usuario?.displayName ?? usuario?.email ?? null,
      loading,
      configurado: isFirebaseConfigured(),
      trocarSenha,
      trocandoSenha,
      setTrocandoSenha,
      dicasVistas,
      dicaVista,
      marcarDicaVista,
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
    papel,
    assinaturaConfigurada,
    loading,
    trocarSenha,
    trocandoSenha,
    dicasVistas,
    dicaVista,
    marcarDicaVista,
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
