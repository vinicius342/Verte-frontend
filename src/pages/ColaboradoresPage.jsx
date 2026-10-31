import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Briefcase,
  Eye,
  HardHat,
  MessageCircle,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Avatar from "../components/common/Avatar";
import Carregando from "../components/common/Carregando";
import { useAuth } from "../hooks/useAuth";
import { useColaboradores } from "../hooks/useColaboradores";
import { apenasDigitos, formatarCelular, linkWhatsapp } from "../utils/whatsapp";
import "../styles/usuarios.css";

const PAPEIS = {
  admin: { rotulo: "Admin", Icone: Shield },
  gerente: { rotulo: "Gerente", Icone: Briefcase },
  supervisor: { rotulo: "Supervisor", Icone: Eye },
  vendedor: { rotulo: "Vendedor", Icone: BadgeDollarSign },
  motorista: { rotulo: "Motorista", Icone: Truck },
  auxiliar_motorista: { rotulo: "Auxiliar de motorista", Icone: HardHat },
};

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ColaboradoresPage() {
  const { uid, loading: authLoading } = useAuth();
  const { colaboradores, loading, erro } = useColaboradores();
  const carregando = authLoading || loading;
  const [menuAberto, setMenuAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = normalizar(busca).trim();
    if (!termo) return colaboradores;
    return colaboradores.filter((c) => normalizar(c.nome).includes(termo));
  }, [colaboradores, busca]);

  return (
    <div className="pagina usuarios-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo usuarios-conteudo">
        <div className="usuarios-topo">
          <h1 className="usuarios-topo__titulo">Colaboradores</h1>
          <span className="usuarios-contador">
            {colaboradores.length} {colaboradores.length === 1 ? "colaborador" : "colaboradores"}
          </span>
        </div>

        <input
          className="campo-input"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar colaborador"
          aria-label="Buscar colaborador"
        />

        {carregando ? <Carregando tela /> : null}

        {!carregando && erro ? (
          <div className="usuarios-estado usuarios-estado--erro">
            <AlertTriangle aria-hidden="true" />
            <p className="usuarios-estado__titulo">Não foi possível carregar</p>
            <p>{erro}</p>
          </div>
        ) : null}

        {!carregando && !erro && filtrados.length === 0 ? (
          <div className="usuarios-estado">
            <Users aria-hidden="true" />
            <p className="usuarios-estado__titulo">Nenhum colaborador encontrado.</p>
          </div>
        ) : null}

        {!carregando && !erro && filtrados.length > 0 ? (
          <ul className="usuarios-lista">
            {filtrados.map((colaborador) => {
              const souEu = colaborador.id === uid;
              const info = PAPEIS[colaborador.papel];
              const Icone = info?.Icone;
              const digitos = apenasDigitos(colaborador.whatsapp);

              return (
                <li key={colaborador.id} className="usuario-linha">
                  <div className="usuario-linha__info">
                    <div className="usuario-linha__avatar" aria-hidden="true">
                      <Avatar nome={colaborador.nome} fotoUrl={colaborador.fotoUrl} />
                    </div>
                    <div className="usuario-linha__textos">
                      <div className="usuario-linha__nome-linha">
                        <span className="usuario-linha__nome">
                          {colaborador.nome || "Sem nome"}
                        </span>
                        {souEu ? <span className="usuario-linha__voce">você</span> : null}
                      </div>
                      {digitos ? (
                        <a
                          className="colaborador-whatsapp"
                          href={linkWhatsapp(digitos)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={16} aria-hidden="true" />
                          {formatarCelular(digitos)}
                        </a>
                      ) : (
                        <p className="usuario-linha__email">WhatsApp não cadastrado</p>
                      )}
                    </div>
                  </div>

                  {info ? (
                    <div className="usuario-linha__acoes">
                      <span className={`usuario-selo usuario-selo--${colaborador.papel}`}>
                        <Icone aria-hidden="true" />
                        {info.rotulo}
                      </span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
