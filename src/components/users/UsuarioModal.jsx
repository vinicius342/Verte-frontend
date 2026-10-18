import { useState } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "../common/Modal";
import { useAuth } from "../../hooks/useAuth";
import {
  criarUsuarioPelaRevendedora,
  atualizarUsuario,
  excluirUsuario,
} from "../../services/usuarioAdminService";
import { traduzirErroAuth } from "../../services/authService";

const PERMITIR_EXCLUSAO_DEV = true;
const PAPEIS = [
  { valor: "vendedor", rotulo: "Vendedor" },
  { valor: "motorista", rotulo: "Motorista" },
  { valor: "supervisor", rotulo: "Supervisor" },
  { valor: "gerente", rotulo: "Gerente" },
  { valor: "admin", rotulo: "Admin" },
];
const PAPEIS_DO_GERENTE = ["vendedor", "motorista", "supervisor"];
const PAPEIS_COM_SUPERVISOR = ["vendedor", "motorista"];

function SelectResponsavel({ rotulo, valor, onChange, opcoes, vazio, desabilitado }) {
  return (
    <div className="usuarios-campo">
      <span className="usuarios-campo__rotulo">{rotulo}</span>
      {opcoes.length === 0 ? (
        <span className="usuarios-campo__dica">{vazio}</span>
      ) : (
        <select
          className="usuarios-campo__input"
          aria-label={rotulo}
          value={valor}
          onChange={onChange}
          disabled={desabilitado}
        >
          <option value="">Selecione…</option>
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome || o.email}
              {o.ativo === false ? " (inativo)" : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// Renderize só quando precisar ({modal && <UsuarioModal ... />}) para o estado nascer limpo.
export default function UsuarioModal({ usuario, usuarios = [], onFechar, onSalvo, onExcluido }) {
  const { uid, revendedoraId, papel: meuPapel } = useAuth();
  const editando = Boolean(usuario);
  const ehEuMesmo = editando && usuario.id === uid;
  const souAdmin = meuPapel === "admin";

  const podeEscolherPapel = !ehEuMesmo;
  const opcoes = souAdmin || ehEuMesmo ? PAPEIS : PAPEIS.filter((p) => PAPEIS_DO_GERENTE.includes(p.valor));

  // Só ativos; mantém o atual na lista mesmo se foi desativado
  const supervisores = usuarios.filter(
    (u) => u.papel === "supervisor" && (u.ativo !== false || u.id === usuario?.supervisorId),
  );
  const gerentes = usuarios.filter(
    (u) => u.papel === "gerente" && (u.ativo !== false || u.id === usuario?.gerenteId),
  );

  const [dados, setDados] = useState({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    codigo: usuario?.codigo ?? "",
    senha: "",
    papel: usuario?.papel ?? "vendedor",
    supervisorId: supervisores.some((u) => u.id === usuario?.supervisorId) ? usuario.supervisorId : "",
    gerenteId: gerentes.some((u) => u.id === usuario?.gerenteId) ? usuario.gerenteId : "",
  });

  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const mostraSupervisor = PAPEIS_COM_SUPERVISOR.includes(dados.papel);
  const mostraGerente = mostraSupervisor || dados.papel === "supervisor";

  const alterar = (campo) => (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));

  async function excluir() {
    const nomeUsuario = usuario.nome || usuario.email;
    if (!window.confirm(`Excluir ${nomeUsuario}? Essa ação não pode ser desfeita.`)) return;

    setEnviando(true);
    setErroGeral(null);
    try {
      await excluirUsuario(usuario.id);
      onExcluido?.(nomeUsuario);
      onFechar();
    } catch (err) {
      console.error("excluirUsuario:", err?.code, err?.message, err);
      setErroGeral(`${err?.message || "Não foi possível excluir o usuário."}${err?.code ? ` (${err.code})` : ""}`);
    } finally {
      setEnviando(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    const nome = dados.nome.trim();
    const email = dados.email.trim();

    const novos = {};
    if (!nome) novos.nome = "Informe o nome.";
    if (!editando && !email) novos.email = "Informe o e-mail.";
    if (!editando && dados.senha.length < 6) novos.senha = "A senha precisa ter pelo menos 6 caracteres.";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    setErroGeral(null);
    try {
      const vinculo = {
        supervisorId: mostraSupervisor ? dados.supervisorId || null : null,
        gerenteId: mostraGerente ? dados.gerenteId || null : null,
      };

      if (editando) {
        await atualizarUsuario(usuario.id, {
          nome,
          codigo: dados.codigo,
          ...(podeEscolherPapel ? { papel: dados.papel } : {}),
          ...vinculo,
        });
      } else {
        await criarUsuarioPelaRevendedora(revendedoraId, {
          nome,
          email,
          senha: dados.senha,
          papel: dados.papel,
          codigo: dados.codigo,
          ...vinculo,
        });
      }
      onSalvo?.(nome, editando);
      onFechar();
    } catch (err) {
      if (err?.parcial) onSalvo?.(nome, false); // conta criada; só o papel falhou
      setErroGeral(err?.code ? traduzirErroAuth(err.code) : err?.message ?? "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal aberto titulo={editando ? "Editar usuário" : "Novo usuário"} onFechar={enviando ? () => { } : onFechar}>
      <form className="usuarios-form" onSubmit={enviar} noValidate>
        {erroGeral ? (
          <div className="usuarios-aviso usuarios-aviso--erro">
            <AlertCircle size={18} aria-hidden="true" />
            {erroGeral}
          </div>
        ) : null}

        <label className={`usuarios-campo ${erros.nome ? "usuarios-campo--erro" : ""}`}>
          <span className="usuarios-campo__rotulo">Nome</span>
          <input className="usuarios-campo__input" value={dados.nome} onChange={alterar("nome")} required />
          {erros.nome ? <span className="usuarios-campo__erro">{erros.nome}</span> : null}
        </label>

        <label className={`usuarios-campo ${erros.email ? "usuarios-campo--erro" : ""}`}>
          <span className="usuarios-campo__rotulo">E-mail</span>
          <input
            className="usuarios-campo__input"
            type="email"
            autoComplete="off"
            value={dados.email}
            onChange={alterar("email")}
            disabled={editando}
            required
          />
          {erros.email ? <span className="usuarios-campo__erro">{erros.email}</span> : null}
        </label>

        <label className="usuarios-campo">
          <span className="usuarios-campo__rotulo">Código</span>
          <input
            className="usuarios-campo__input"
            value={dados.codigo}
            onChange={alterar("codigo")}
            maxLength={30}
            autoComplete="off"
          />
        </label>

        {!editando && (
          <label className={`usuarios-campo ${erros.senha ? "usuarios-campo--erro" : ""}`}>
            <span className="usuarios-campo__rotulo">Senha provisória</span>
            <input
              className="usuarios-campo__input"
              type="text"
              autoComplete="new-password"
              value={dados.senha}
              onChange={alterar("senha")}
              required
            />
            {erros.senha ? <span className="usuarios-campo__erro">{erros.senha}</span> : null}
          </label>
        )}

        <label className="usuarios-campo">
          <span className="usuarios-campo__rotulo">Tipo de usuário</span>
          <select
            className="usuarios-campo__input"
            value={dados.papel}
            onChange={alterar("papel")}
            disabled={!podeEscolherPapel}
          >
            {opcoes.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
          {!souAdmin ? (
            <span className="usuarios-campo__dica">Gerentes definem apenas vendedor ou supervisor.</span>
          ) : null}
          {ehEuMesmo ? <span className="usuarios-campo__dica">Você não pode alterar o próprio tipo.</span> : null}
        </label>

        {mostraSupervisor && (
          <SelectResponsavel
            rotulo="Supervisor"
            valor={dados.supervisorId}
            onChange={alterar("supervisorId")}
            opcoes={supervisores}
            vazio="Nenhum supervisor registrado."
          />
        )}

        {mostraGerente && (
          <SelectResponsavel
            rotulo="Gerente"
            valor={dados.gerenteId}
            onChange={alterar("gerenteId")}
            opcoes={gerentes}
            vazio="Nenhum gerente registrado."
          />
        )}

        <div className="usuarios-form__acoes">
          {PERMITIR_EXCLUSAO_DEV && editando && !ehEuMesmo ? (
            <button
              type="button"
              className="usuarios-botao usuarios-botao--perigo usuarios-form__excluir"
              onClick={excluir}
              disabled={enviando}
            >
              Excluir
            </button>
          ) : null}
          <button type="button" className="usuarios-botao usuarios-botao--contorno" onClick={onFechar} disabled={enviando}>
            Cancelar
          </button>
          <button
            type="submit"
            className={`usuarios-botao usuarios-botao--primario ${enviando ? "usuarios-botao--carregando" : ""}`}
            disabled={enviando}
          >
            {editando ? "Salvar" : "Criar usuário"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
