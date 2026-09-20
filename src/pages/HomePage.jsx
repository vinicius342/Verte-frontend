import { useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ClientList from "../components/clients/ClientList";
import ClientDetailModal from "../components/clients/ClientDetailModal";
import AddClientModal from "../components/clients/AddClientModal";
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
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca).trim();
    if (!termo) return clientes;
    return clientes.filter((c) =>
      [c.nomeCliente, c.nomeComercio, c.rua].some((campo) => normalizar(campo).includes(termo)),
    );
  }, [clientes, busca]);

  const atual = selecionado ? clientes.find((c) => c.id === selecionado.id) ?? selecionado : null;

  return (
    <div className="pagina">
      <Header busca={busca} onBuscar={setBusca} onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} onAdicionar={() => setAdicionando(true)} />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Clientes</h1>
          <span className="contador mono">{filtrados.length}</span>
        </div>
        <ClientList clientes={filtrados} loading={loading} erro={erro} onSelecionar={setSelecionado} />
      </main>

      <AddClientModal aberto={adicionando} onFechar={() => setAdicionando(false)} />
      <ClientDetailModal cliente={atual} onFechar={() => setSelecionado(null)} />
    </div>
  );
}
