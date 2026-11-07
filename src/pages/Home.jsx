import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ClientList from "../components/clients/ClientList";
import FiltroVendedor from "../components/clients/FiltroVendedor";
import Carregando from "../components/common/Carregando";
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
  const { clientes, loading, erro, recarregar } = useClients();
  const { usuario, papel, ehMotorista, loading: authLoading } = useAuth();
  const carregando = authLoading || loading;
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [novoCliente, setNovoCliente] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [iniciarEdicaoSelecionado, setIniciarEdicaoSelecionado] = useState(false);
  const [recemCriado, setRecemCriado] = useState(false);
  const [vendedorFiltro, setVendedorFiltro] = useState("");
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
    const base =
      papel === "supervisor" && vendedorFiltro
        ? clientes.filter((c) => c.createdBy === vendedorFiltro)
        : clientes;
    const termo = normalizar(busca).trim();
    if (!termo) return base;
    return base.filter((c) =>
      [c.nomeCliente, c.nomeComercio, c.rua].some((campo) => normalizar(campo).includes(termo)),
    );
  }, [clientes, busca, papel, vendedorFiltro]);

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
        <div className="conteudo-topo clientes-topo">
          <h1 className="titulo-secao">Clientes</h1>
          <span className="contador-clientes" aria-live="polite">
            {filtrados.length} {filtrados.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>

        {papel === "supervisor" && !carregando && (
          <FiltroVendedor clientes={clientes} valor={vendedorFiltro} onChange={setVendedorFiltro} />
        )}

        <div data-tour="clientes-lista">
          {carregando ? (
            <Carregando tela />
          ) : (
            <ClientList
              clientes={filtrados}
              loading={loading}
              erro={erro}
              onSelecionar={(cliente) => {
                setSelecionadoId(cliente.id);
                setIniciarEdicaoSelecionado(false);
              }}
            />
          )}
        </div>
      </main>

      {usuario && !ehMotorista && (
        <Button
          className="botao-adicionar-fixo"
          data-tour="novo-cliente"
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
        onSalvo={async (id) => {
          setRecemCriado(true);
          await recarregar();
          setSelecionadoId(id);
          setIniciarEdicaoSelecionado(false);
        }}
      />}
      <ClientDetailModal
        cliente={atual}
        iniciarEdicao={iniciarEdicaoSelecionado}
        recemCriado={recemCriado}
        onFechar={() => {
          setSelecionadoId(null);
          setIniciarEdicaoSelecionado(false);
          setRecemCriado(false);
        }}
      />
    </div>
  );
}
