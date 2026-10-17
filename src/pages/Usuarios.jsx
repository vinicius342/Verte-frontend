import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/common/Button";
import UsuarioModal from "../components/users/UsuarioModal";
import { useAuth } from "../hooks/useAuth";
import { useUsuarios } from "../hooks/useUsuarios";
import { definirAtivo } from "../services/usuarioAdminService";

const ROTULO_PAPEL = { vendedor: "Vendedor", supervisor: "Supervisor", gerente: "Gerente", admin: "Admin" };

export default function UsuariosPage() {
  const { uid, papel: meuPapel } = useAuth();
  const { usuarios, loading, erro, recarregar } = useUsuarios();
  const [menuAberto, setMenuAberto] = useState(false);
  const [modal, setModal] = useState(null); // null | { usuario?: obj }
  const [aviso, setAviso] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);

  // Admin gerencia todos (menos a si mesmo); gerente só vendedores
  function podeGerenciar(u) {
    if (u.id === uid) return false;
    if (meuPapel === "admin") return true;
    return meuPapel === "gerente" && ["vendedor", "supervisor"].includes(u.papel);
  }

  async function alternarAtivo(u) {
    const desativar = u.ativo !== false;
    const msg = desativar
      ? `Desativar ${u.nome || u.email}? O acesso ao app será bloqueado. Você poderá reativar depois.`
      : `Reativar ${u.nome || u.email}?`;
    if (!window.confirm(msg)) return;

    setErroAcao(null);
    try {
      await definirAtivo(u.id, !desativar);
      setAviso(desativar ? "Usuário desativado." : "Usuário reativado.");
      recarregar();
    } catch {
      setErroAcao("Não foi possível alterar o usuário.");
    }
  }

  return (
    <div className="pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo">
        <div className="conteudo-topo">
          <h1 className="titulo-secao">Usuários</h1>
          <span className="contador mono">{usuarios.length}</span>
        </div>

        {aviso ? <p className="campo-dica">{aviso}</p> : null}
        {erroAcao ? <p className="estado-erro">{erroAcao}</p> : null}
        {loading ? <p className="estado-vazio">Carregando usuários…</p> : null}
        {erro ? <p className="estado-erro">{erro}</p> : null}

        {!loading && !erro ? (
          <ul className="lista-clientes">
            {usuarios.map((u) => {
              const inativo = u.ativo === false;
              return (
                <li key={u.id} className="linha-cliente" style={inativo ? { opacity: 0.55 } : undefined}>
                  <div className="linha-botao">
                    <span className="linha-texto">
                      <span className="linha-nome">
                        {u.nome || "Sem nome"}
                        {u.id === uid ? " (você)" : ""}
                      </span>
                      <span className="linha-endereco">{u.email}</span>
                    </span>
                    <span className="mono">
                      {ROTULO_PAPEL[u.papel] ?? "—"}
                      {inativo ? " · Inativo" : ""}
                    </span>
                  </div>
                  <div className="formulario-acoes">
                    {(podeGerenciar(u) || u.id === uid) && (
                      <Button variant="ghost" onClick={() => setModal({ usuario: u })}>
                        Editar
                      </Button>
                    )}
                    {podeGerenciar(u) && (
                      <Button variant="ghost" onClick={() => alternarAtivo(u)}>
                        {inativo ? "Reativar" : "Desativar"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>

      <Button
        className="botao-adicionar-fixo"
        aria-label="Novo usuário"
        onClick={() => {
          setAviso(null);
          setModal({});
        }}
      >
        <Plus aria-hidden="true" size={22} strokeWidth={2.4} />
        <span>Novo usuário</span>
      </Button>

      {modal && (
        <UsuarioModal
          usuario={modal.usuario}
          onFechar={() => setModal(null)}
          onSalvo={(nome, editou) => {
            setAviso(editou ? `Usuário ${nome} atualizado.` : `Usuário ${nome} criado.`);
            recarregar();
          }}
        />
      )}
    </div>
  );
}