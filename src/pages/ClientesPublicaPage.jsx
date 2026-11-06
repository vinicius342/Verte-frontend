import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import ClientList from "../components/clients/ClientList";
import ClientDetailModal from "../components/clients/ClientDetailModal";
import Carregando from "../components/common/Carregando";
import { useClientesPublicos } from "../hooks/useClientesPublicos";

const SLUG_VALIDO = /^[a-z0-9]+-[a-z0-9]{5}$/;

function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ClientesPublicosConteudo({ slug }) {
  const { clientes, loading, erro, naoEncontrado } = useClientesPublicos(slug);
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);

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
      <Header busca={busca} onBuscar={setBusca} semMenu />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Clientes</h1>
          <span className="contador mono">{filtrados.length}</span>
        </div>

        {loading ? (
          <Carregando tela />
        ) : naoEncontrado ? (
          <p className="estado-vazio">Link não encontrado.</p>
        ) : (
          <ClientList
            clientes={filtrados}
            loading={loading}
            erro={erro}
            onSelecionar={(cliente) => setSelecionadoId(cliente.id)}
          />
        )}
      </main>

      <ClientDetailModal
        cliente={atual}
        somenteLeitura
        onFechar={() => setSelecionadoId(null)}
      />
    </div>
  );
}

export default function ClientesPublicaPage() {
  const { slug } = useParams();
  const slugValido = SLUG_VALIDO.test(slug ?? "");

  useEffect(() => {
    if (!slugValido) return;
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex,nofollow");
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [slugValido]);

  if (!slugValido) return <Navigate to="/" replace />;

  return <ClientesPublicosConteudo slug={slug} />;
}
