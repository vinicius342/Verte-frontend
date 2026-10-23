import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ClientList from "../components/clients/ClientList";
import ClientDetailModal from "../components/clients/ClientDetailModal";
import AddClientModal from "../components/clients/AddClientModal";
import Button from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";
import { useClients } from "../hooks/useClients";

function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function HomePage() {
  const { clientes, loading, erro } = useClients();
  const { usuario, ehMotorista, loading: authLoading } = useAuth();
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [novoCliente, setNovoCliente] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [iniciarEdicaoSelecionado, setIniciarEdicaoSelecionado] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (searchParams.get("adicionar") === "1") {
      if (usuario && !ehMotorista) setAdicionando(true);
      searchParams.delete("adicionar");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, usuario, ehMotorista, authLoading]);

  useEffect(() => {
    const estado = location.state;
    if (authLoading || !estado) return;

    if (ehMotorista) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (typeof estado.novoCliente === "string") {
      setNovoCliente(estado.novoCliente);
      setAdicionando(true);
    }

    if (estado.editarClienteId) {
      setSelecionadoId(estado.editarClienteId);
      setIniciarEdicaoSelecionado(true);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, ehMotorista, authLoading]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca).trim();
    if (!termo) return clientes;
    return clientes.filter((c) =>
      [c.nomeCliente, c.nomeComercio, c.rua].some((campo) => normalizar(campo).includes(termo)),
    );
  }, [clientes, busca]);

  const atual = selecionadoId ? clientes.find((c) => c.id === selecionadoId) ?? null : null;

  return (
    <div className="pagina">
      <Header busca={busca} onBuscar={setBusca} onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar
        aberta={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onAdicionar={() => setAdicionando(true)}
      />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Clientes</h1>
          <span className="contador mono">{filtrados.length}</span>
        </div>
        <ClientList
          clientes={filtrados}
          loading={loading}
          erro={erro}
          onSelecionar={(cliente) => {
            setSelecionadoId(cliente.id);
            setIniciarEdicaoSelecionado(false);
          }}
        />
      </main>

      {usuario && !ehMotorista && (
        <Button
          className="botao-adicionar-fixo"
          aria-label="Novo cliente"
          onClick={() => {
            setNovoCliente("");
            setAdicionando(true);
          }}
        >
          <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
          <span>Novo cliente</span>
        </Button>
      )}

      {!ehMotorista && <AddClientModal
        aberto={adicionando}
        cliente={novoCliente ? { nomeCliente: novoCliente } : undefined}
        onFechar={() => {
          setAdicionando(false);
          setNovoCliente("");
        }}
      />}
      <ClientDetailModal
        cliente={atual}
        iniciarEdicao={iniciarEdicaoSelecionado}
        onFechar={() => {
          setSelecionadoId(null);
          setIniciarEdicaoSelecionado(false);
        }}
      />
    </div>
  );
}
