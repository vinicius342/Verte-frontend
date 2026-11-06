import { useState } from "react";
import {
  Plus, Pencil, UserX, UserCheck, Shield, BadgeDollarSign, Eye, Briefcase,
  Users, AlertTriangle, CheckCircle2, Truck, HardHat
} from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Avatar from "../components/common/Avatar";
import Carregando from "../components/common/Carregando";
import UsuarioModal from "../components/users/UsuarioModal";
import { useAuth } from "../hooks/useAuth";
import { useUsuarios } from "../hooks/useUsuarios";
import { definirAtivo } from "../services/usuarioAdminService";
import "../styles/usuarios.css";

const PAPEIS = {
  admin: { rotulo: "Admin", Icone: Shield },
  gerente: { rotulo: "Gerente", Icone: Briefcase },
  supervisor: { rotulo: "Supervisor", Icone: Eye },
  vendedor: { rotulo: "Vendedor", Icone: BadgeDollarSign },
  motorista: { rotulo: "Motorista", Icone: Truck },
  auxiliar_motorista: { rotulo: "Auxiliar de motorista", Icone: HardHat },
};

const PAPEIS_DO_GERENTE = ["vendedor", "motorista", "auxiliar_motorista", "supervisor"];

export default function UsuariosPage() {
  const { uid, papel: meuPapel, loading: authLoading, recarregarVinculo } = useAuth();
  const { usuarios, loading, erro, recarregar } = useUsuarios();
  const carregando = authLoading || loading;
  const [menuAberto, setMenuAberto] = useState(false);
  const [modal, setModal] = useState(null); // null | { usuario?: obj }
  const [aviso, setAviso] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);
  const [acaoId, setAcaoId] = useState(null);

  // Admin gerencia todos (menos a si mesmo); gerente só vendedor/motorista/auxiliar/supervisor
  function podeGerenciar(u) {
    if (u.id === uid) return false;
    if (meuPapel === "admin") return true;
    return meuPapel === "gerente" && PAPEIS_DO_GERENTE.includes(u.papel);
  }

  async function alternarAtivo(u) {
    const desativar = u.ativo !== false;
    const msg = desativar
      ? `Desativar ${u.nome || u.email}? O acesso ao app será bloqueado. Você poderá reativar depois.`
      : `Reativar ${u.nome || u.email}?`;
    if (!window.confirm(msg)) return;

    setErroAcao(null);
    setAcaoId(u.id);
    try {
      await definirAtivo(u.id, !desativar);
      setAviso(desativar ? "Usuário desativado." : "Usuário reativado.");
      recarregar();
    } catch {
      setErroAcao("Não foi possível alterar o usuário.");
    } finally {
      setAcaoId(null);
    }
  }

  return (
    <div className="pagina usuarios-pagina">
      <Header onAbrirMenu={() => setMenuAberto(true)} />
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />

      <main className="conteudo usuarios-conteudo">
        <div className="usuarios-topo">
          <h1 className="usuarios-topo__titulo">Usuários</h1>
          <span className="usuarios-contador">
            {usuarios.length} {usuarios.length === 1 ? "usuário" : "usuários"}
          </span>
        </div>

        {aviso ? (
          <div className="usuarios-aviso usuarios-aviso--sucesso">
            <CheckCircle2 size={18} aria-hidden="true" />
            {aviso}
          </div>
        ) : null}
        {erroAcao ? (
          <div className="usuarios-aviso usuarios-aviso--erro">
            <AlertTriangle size={18} aria-hidden="true" />
            {erroAcao}
          </div>
        ) : null}

        {carregando ? <Carregando tela /> : null}

        {!carregando && erro ? (
          <div className="usuarios-estado usuarios-estado--erro">
            <AlertTriangle aria-hidden="true" />
            <p className="usuarios-estado__titulo">Não foi possível carregar</p>
            <p>{erro}</p>
          </div>
        ) : null}

        {!carregando && !erro && usuarios.length === 0 ? (
          <div className="usuarios-estado">
            <Users aria-hidden="true" />
            <p className="usuarios-estado__titulo">Nenhum usuário ainda</p>
            <p>Toque em "Novo usuário" para começar.</p>
          </div>
        ) : null}

        {!carregando && !erro && usuarios.length > 0 ? (
          <ul className="usuarios-lista">
            {usuarios.map((u) => {
              const inativo = u.ativo === false;
              const souEu = u.id === uid;
              const info = PAPEIS[u.papel];
              const Icone = info?.Icone;
              const ocupado = acaoId === u.id;

              return (
                <li key={u.id} className={`usuario-linha ${inativo ? "usuario-linha--inativo" : ""}`}>
                  <div className="usuario-linha__info">
                    <div className="usuario-linha__avatar" aria-hidden="true">
                      <Avatar nome={u.nome || u.email} fotoUrl={u.fotoUrl} />
                    </div>
                    <div className="usuario-linha__textos">
                      <div className="usuario-linha__nome-linha">
                        <span className="usuario-linha__nome">{u.nome || "Sem nome"}</span>
                        {souEu ? <span className="usuario-linha__voce">você</span> : null}
                      </div>
                      <p className="usuario-linha__email">{u.email}</p>
                    </div>
                  </div>

                  <div className="usuario-linha__acoes">
                    {inativo ? (
                      <span className="usuario-selo usuario-selo--inativo">
                        <UserX aria-hidden="true" />
                        Inativo
                      </span>
                    ) : info ? (
                      <span className={`usuario-selo usuario-selo--${u.papel}`}>
                        <Icone aria-hidden="true" />
                        {info.rotulo}
                      </span>
                    ) : null}

                    <div className="usuario-linha__botoes">
                      {(podeGerenciar(u) || souEu) && (
                        <button
                          type="button"
                          className="usuarios-botao usuarios-botao--contorno"
                          onClick={() => setModal({ usuario: u })}
                        >
                          <Pencil aria-hidden="true" /> Editar
                        </button>
                      )}

                      {podeGerenciar(u) &&
                        (inativo ? (
                          <button
                            type="button"
                            className={`usuarios-botao usuarios-botao--sucesso ${ocupado ? "usuarios-botao--carregando" : ""}`}
                            disabled={ocupado}
                            onClick={() => alternarAtivo(u)}
                          >
                            <UserCheck aria-hidden="true" /> Reativar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`usuarios-botao usuarios-botao--perigo ${ocupado ? "usuarios-botao--carregando" : ""}`}
                            disabled={ocupado}
                            onClick={() => alternarAtivo(u)}
                          >
                            <UserX aria-hidden="true" /> Desativar
                          </button>
                        ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>

      <button
        type="button"
        className="usuarios-fab"
        aria-label="Novo usuário"
        onClick={() => {
          setAviso(null);
          setErroAcao(null);
          setModal({});
        }}
      >
        <Plus aria-hidden="true" />
        <span>Novo usuário</span>
      </button>

      {modal && (
        <UsuarioModal
          usuario={modal.usuario}
          usuarios={usuarios}
          onFechar={() => setModal(null)}
          onSalvo={(nome, editou) => {
            setAviso(editou ? `Usuário ${nome} atualizado.` : `Usuário ${nome} criado.`);
            if (modal.usuario?.id === uid) recarregarVinculo();
            recarregar();
          }}
          onExcluido={(nome) => {
            setAviso(`Usuário ${nome} excluído.`);
            recarregar();
          }}
          onRedefinida={(nome) => setAviso(`Senha de ${nome} redefinida para a provisória.`)}
        />
      )}
    </div>
  );
}