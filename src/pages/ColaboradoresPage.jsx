import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  MessageCircle,
  Search,
  Shield,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Avatar from "../components/common/Avatar";
import Carregando from "../components/common/Carregando";
import { useAuth } from "../hooks/useAuth";
import { useColaboradores } from "../hooks/useColaboradores";
import { apenasDigitos, formatarCelular, linkWhatsapp } from "../utils/whatsapp";

const PAPEIS = {
  admin: { rotulo: "Admin", Icone: Shield },
  gerente: { rotulo: "Gerente", Icone: BriefcaseBusiness },
  supervisor: { rotulo: "Supervisor", Icone: UserRound },
  vendedor: { rotulo: "Vendedor", Icone: UserRound },
  motorista: { rotulo: "Motorista", Icone: Truck },
  auxiliar_motorista: { rotulo: "Auxiliar de motorista", Icone: UserRound },
};

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "vendedor", rotulo: "Vendedores" },
  { valor: "motorista", rotulo: "Motoristas" },
  { valor: "auxiliar_motorista", rotulo: "Auxiliares" },
  { valor: "supervisor", rotulo: "Supervisores" },
  { valor: "admin", rotulo: "Admin" },
  { valor: "gerente", rotulo: "Gerentes" },
];

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function textoBusca(colaborador) {
  const plural = FILTROS.find((filtro) => filtro.valor === colaborador.papel)?.rotulo;
  return normalizar(
    [colaborador.nome, colaborador.papel, PAPEIS[colaborador.papel]?.rotulo, plural]
      .filter(Boolean)
      .join(" "),
  );
}

export default function ColaboradoresPage() {
  const { uid, loading: authLoading } = useAuth();
  const { colaboradores, loading, erro } = useColaboradores();
  const carregando = authLoading || loading;
  const [menuAberto, setMenuAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const filtrosVisiveis = useMemo(() => {
    const papeis = new Set(colaboradores.map((colaborador) => colaborador.papel));
    return FILTROS.filter((opcao) => opcao.valor === "todos" || papeis.has(opcao.valor));
  }, [colaboradores]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca).trim();
    const digitosBusca = apenasDigitos(busca);

    return colaboradores.filter((colaborador) => {
      if (filtro !== "todos" && colaborador.papel !== filtro) return false;
      if (!termo) return true;

      const digitos = apenasDigitos(colaborador.whatsapp);
      return (
        textoBusca(colaborador).includes(termo) ||
        (Boolean(digitosBusca) && digitos.includes(digitosBusca))
      );
    });
  }, [colaboradores, busca, filtro]);

  return (
    <div className="pagina rota-pagina colab-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo rota-conteudo">
        <div>
          <h1 className="rota-titulo">Colaboradores</h1>
        </div>

        <div className="colab-busca">
          <Search aria-hidden="true" />
          <input
            className="colab-busca-input"
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar colaborador"
            aria-label="Buscar colaborador"
          />
          {busca ? (
            <button
              type="button"
              className="colab-busca-limpar"
              aria-label="Limpar busca"
              onClick={() => setBusca("")}
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="comodato-filtros colab-filtros">
          {filtrosVisiveis.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`comodato-filtro ${filtro === opcao.valor ? "comodato-filtro--ativo" : ""}`}
              aria-pressed={filtro === opcao.valor}
              onClick={() => setFiltro(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>

        {carregando ? <Carregando tela /> : null}

        {!carregando && erro ? (
          <p className="estado-erro" role="alert">
            {erro}
          </p>
        ) : null}

        {!carregando && !erro && filtrados.length > 0 ? (
          <ul className="colab-lista">
            {filtrados.map((colaborador) => {
              const souEu = colaborador.id === uid;
              const info = PAPEIS[colaborador.papel];
              const Icone = info?.Icone ?? UserRound;
              const rotulo = info?.rotulo ?? colaborador.papel ?? "Colaborador";
              const digitos = apenasDigitos(colaborador.whatsapp);

              return (
                <li
                  key={colaborador.id}
                  className={`colab-item ${souEu ? "colab-item--voce" : ""}`}
                >
                  <div className="colab-item-grid">
                    <div className="colab-avatar" aria-hidden="true">
                      <Avatar nome={colaborador.nome} fotoUrl={colaborador.fotoUrl} />
                    </div>

                    <div className="colab-info">
                      <div className="colab-nome-linha">
                        <h2 className="colab-nome">{colaborador.nome || "Sem nome"}</h2>
                        {souEu ? <span className="colab-voce">Você</span> : null}
                      </div>

                      {digitos ? (
                        <a
                          className="colab-whatsapp"
                          href={linkWhatsapp(digitos)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle aria-hidden="true" />
                          {formatarCelular(digitos)}
                        </a>
                      ) : (
                        <p className="colab-sem-whatsapp">WhatsApp não cadastrado</p>
                      )}
                    </div>

                    <span className={`colab-selo colab-selo--${colaborador.papel}`}>
                      <Icone aria-hidden="true" />
                      {rotulo}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!carregando && !erro && filtrados.length === 0 ? (
          <div className="colab-vazio">
            <Search aria-hidden="true" />
            <p>Nenhum colaborador encontrado.</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
