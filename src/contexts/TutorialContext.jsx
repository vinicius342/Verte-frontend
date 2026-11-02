import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import TutorialOverlay from "../components/tutorial/TutorialOverlay";

export const TutorialContext = createContext(null);

const MODULOS = {
  tutorialInicio: {
    rota: "/",
    menuTour: "menu-inicio",
    titulo: "Comece por aqui",
    texto: "Toque em Início para conhecer a tela de clientes.",
  },
  tutorialComodato: {
    rota: "/comodato",
    menuTour: "menu-comodatos",
    titulo: "Agora, os comodatos",
    texto: "Toque em Comodatos para conhecer essa tela.",
  },
  tutorialLimite: {
    rota: "/limite",
    menuTour: "menu-limites",
    titulo: "Por último, os limites",
    texto: "Toque em Solicitações de limite para conhecer essa tela.",
  },
};

const COMPAT_DETALHE = {
  detalheCliente: "copiarCliente",
  detalheComodato: "copiarComodato",
  detalheLimite: "copiarLimite",
};

function modulosDoPapel(papel, ehMotorista) {
  if (!papel || papel === "admin") return [];
  if (ehMotorista) return ["tutorialInicio"];
  if (papel === "vendedor" || papel === "supervisor" || papel === "gerente") {
    return ["tutorialInicio", "tutorialComodato", "tutorialLimite"];
  }
  return [];
}

function etapaAcao(chave) {
  const modulo = MODULOS[chave];
  return {
    id: `${chave}-acao`,
    tipo: "acao",
    alvo: `[data-tour="${modulo.menuTour}"]`,
    naSidebar: true,
    rota: modulo.rota,
    titulo: modulo.titulo,
    texto: modulo.texto,
  };
}

function montarEtapasModulo(chave, papel, ehMotorista) {
  const modulo = MODULOS[chave];
  if (!modulo) return [];
  const etapas = [etapaAcao(chave)];
  const ehVendedor = papel === "vendedor";

  if (chave === "tutorialInicio") {
    etapas.push({
      id: "inicio-busca",
      alvo: '[data-tour="busca-clientes"]',
      rota: "/",
      titulo: "Busca rápida",
      texto: "Digite o nome do cliente, o comércio ou a rua para achar rápido.",
    });

    if (!ehMotorista) {
      etapas.push({
        id: "inicio-novo-cliente",
        alvo: '[data-tour="novo-cliente"]',
        rota: "/",
        titulo: "Cadastre um cliente",
        texto:
          "Toque aqui para cadastrar. Cada cliente é cadastrado uma única vez e serve para comodatos e solicitações de limite.",
        forcarAcima: true,
      });
    }

    etapas.push({
      id: "inicio-lista",
      alvo: '[data-tour="clientes-lista"]',
      rota: "/",
      titulo: "Detalhes do cliente",
      texto: ehMotorista
        ? "Toque em um cliente para abrir o mapa e chamar no WhatsApp."
        : "Toque em um cliente para abrir o mapa, chamar no WhatsApp e copiar o cadastro de contatos. Quando quiser, abra o menu de novo para conhecer os comodatos.",
    });

    return etapas;
  }

  if (chave === "tutorialComodato") {
    etapas.push({
      id: "comodato-filtros",
      alvo: '[data-tour="comodato-filtros"]',
      rota: "/comodato",
      titulo: ehVendedor ? "Acompanhe os status" : "Sua vez de responder",
      texto: ehVendedor
        ? "Filtre por pendentes, confirmados e rejeitados para acompanhar cada comodato."
        : "Use o filtro Minha vez para ver os comodatos que esperam a sua resposta.",
    });

    if (ehVendedor) {
      etapas.push({
        id: "comodato-novo",
        alvo: '[data-tour="novo-comodato"]',
        rota: "/comodato",
        titulo: "Crie um comodato",
        texto:
          "Primeiro cadastre o cliente na tela de Clientes. Depois toque aqui, escolha o cliente e informe os materiais. O comodato segue para confirmação do supervisor e do gerente.",
        forcarAcima: true,
      });
    }

    etapas.push({
      id: "comodato-lista",
      alvo: '[data-tour="comodatos-lista"]',
      rota: "/comodato",
      titulo: "Abra um comodato",
      texto: ehVendedor
        ? "Toque em um comodato para ver os detalhes, copiar a mensagem e gerar o PDF do termo. Quando quiser, abra o menu de novo para conhecer as solicitações de limite."
        : "Toque em um comodato para confirmar ou rejeitar. Quando quiser, abra o menu de novo para conhecer as solicitações de limite.",
    });

    return etapas;
  }

  if (chave === "tutorialLimite") {
    etapas.push({
      id: "limite-novo",
      alvo: '[data-tour="novo-limite"]',
      rota: "/limite",
      titulo: "Peça um limite",
      texto:
        "Primeiro cadastre o cliente na tela de Clientes. Depois toque aqui, escolha o cliente e preencha o valor e o motivo.",
      forcarAcima: true,
    });

    etapas.push({
      id: "limite-lista",
      alvo: '[data-tour="limites-lista"]',
      rota: "/limite",
      titulo: "Mensagem pronta",
      texto: "Toque em uma solicitação para ver a mensagem pronta, copiar e colar no WhatsApp.",
    });

    return etapas;
  }

  return [];
}

export function TutorialProvider({ children }) {
  const {
    usuario,
    papel,
    ehMotorista,
    precisaConfigurarAssinatura,
    dicaVista,
    marcarDicaVista,
  } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [etapas, setEtapas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [ativo, setAtivo] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [tipo, setTipo] = useState(null);
  const [chave, setChave] = useState(null);
  const timerRef = useRef(null);
  const sessaoRef = useRef(false);

  const etapa = etapas[indice] ?? null;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const encerrarEstado = useCallback(() => {
    sessaoRef.current = false;
    setAtivo(false);
    setSaindo(false);
    setEtapas([]);
    setIndice(0);
    setTipo(null);
    setChave(null);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    if (!usuario || precisaConfigurarAssinatura) {
      clearTimeout(timerRef.current);
      encerrarEstado();
    }
  }, [ativo, usuario, precisaConfigurarAssinatura, encerrarEstado]);

  // Mantém o usuário na rota do módulo nos passos informativos.
  useEffect(() => {
    if (!ativo || tipo !== "tela" || !etapa || etapa.tipo === "acao") return;
    if (etapa.rota && pathname !== etapa.rota) navigate(etapa.rota);
  }, [ativo, tipo, etapa, pathname, navigate]);

  const iniciar = useCallback((novoTipo, novaChave, lista) => {
    if (!lista.length) return false;
    clearTimeout(timerRef.current);
    sessaoRef.current = true;
    setTipo(novoTipo);
    setChave(novaChave);
    setEtapas(lista);
    setIndice(0);
    setSaindo(false);
    setAtivo(true);
    return true;
  }, []);

  const moduloVisto = useCallback(
    (chaveModulo) => dicaVista("tutorial") || dicaVista(chaveModulo),
    [dicaVista],
  );

  const detalheVisto = useCallback(
    (chaveDetalhe) => {
      const compat = COMPAT_DETALHE[chaveDetalhe];
      return dicaVista(chaveDetalhe) || (compat ? dicaVista(compat) : false);
    },
    [dicaVista],
  );

  const notificarAberturaSidebar = useCallback(() => {
    if (sessaoRef.current || ativo || saindo) return false;
    if (!usuario || precisaConfigurarAssinatura) return false;
    const chaves = modulosDoPapel(papel, ehMotorista);
    const proxima = chaves.find((chaveModulo) => !moduloVisto(chaveModulo));
    if (!proxima) return false;
    return iniciar("tela", proxima, montarEtapasModulo(proxima, papel, ehMotorista));
  }, [
    ativo,
    saindo,
    usuario,
    precisaConfigurarAssinatura,
    papel,
    ehMotorista,
    moduloVisto,
    iniciar,
  ]);

  const iniciarTutorialDetalhe = useCallback(
    (chaveDetalhe, lista) => {
      if (sessaoRef.current || ativo || saindo) return false;
      if (!usuario || precisaConfigurarAssinatura) return false;
      if (!lista?.length) return false;
      if (detalheVisto(chaveDetalhe)) return false;
      // Pula passos cujo elemento não está na tela (ex.: sem WhatsApp, sem anexos).
      const validas = lista.filter((item) => document.querySelector(item.alvo));
      if (!validas.length) return false;
      // Marca no início para nunca repetir, mesmo se o tutorial for interrompido.
      marcarDicaVista(chaveDetalhe);
      return iniciar("detalhe", chaveDetalhe, validas);
    },
    [ativo, saindo, usuario, precisaConfigurarAssinatura, detalheVisto, marcarDicaVista, iniciar],
  );

  const finalizar = useCallback(() => {
    setSaindo(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sessaoRef.current = false;
      setAtivo(false);
      setSaindo(false);
      setEtapas([]);
      setIndice(0);
      setTipo(null);
      setChave(null);
    }, 180);
  }, []);

  const avancar = useCallback(() => {
    if (indice >= etapas.length - 1) {
      if (tipo === "tela" && chave) marcarDicaVista(chave);
      finalizar();
      return;
    }
    setIndice((valor) => valor + 1);
  }, [indice, etapas.length, tipo, chave, marcarDicaVista, finalizar]);

  const voltar = useCallback(() => {
    setIndice((valor) => Math.max(0, valor - 1));
  }, []);

  const tutorialAtivo = ativo && !saindo;
  const value = useMemo(
    () => ({
      tutorialAtivo,
      notificarAberturaSidebar,
      iniciarTutorialDetalhe,
      detalheVisto,
      manterSidebarAberta:
        tutorialAtivo && tipo === "tela" && Boolean(etapa?.naSidebar),
    }),
    [
      tutorialAtivo,
      notificarAberturaSidebar,
      iniciarTutorialDetalhe,
      detalheVisto,
      tipo,
      etapa,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {ativo && etapa ? (
        <TutorialOverlay
          key={`${tipo}-${chave}-${etapa.id}`}
          etapa={etapa}
          indice={indice}
          total={etapas.length}
          saindo={saindo}
          onVoltar={voltar}
          onAvancar={avancar}
        />
      ) : null}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial precisa estar dentro de <TutorialProvider>.");
  return ctx;
}
