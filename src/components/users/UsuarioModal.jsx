import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import {
  criarUsuarioPelaRevendedora,
  atualizarUsuario,
} from "../../services/usuarioAdminService";
import { traduzirErroAuth } from "../../services/authService";

const PAPEIS = [
  { valor: "vendedor", rotulo: "Vendedor" },
  { valor: "supervisor", rotulo: "Supervisor" },
  { valor: "gerente", rotulo: "Gerente" },
  { valor: "admin", rotulo: "Admin" },
];
const PAPEIS_DO_GERENTE = ["vendedor", "supervisor"];

// Renderize só quando precisar (ex.: {aberto && <UsuarioModal ... />}) para o estado nascer limpo.
export default function UsuarioModal({ usuario, onFechar, onSalvo }) {
  const { uid, revendedoraId, papel: meuPapel } = useAuth();
  const editando = Boolean(usuario);
  const ehEuMesmo = editando && usuario.id === uid;
  const souAdmin = meuPapel === "admin";

  const podeEscolherPapel = !ehEuMesmo;
  const opcoes = souAdmin || ehEuMesmo ? PAPEIS : PAPEIS.filter((p) => PAPEIS_DO_GERENTE.includes(p.valor));

  const [dados, setDados] = useState({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    senha: "",
    papel: usuario?.papel ?? "vendedor",
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo) => (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));

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
      if (editando) {
        await atualizarUsuario(usuario.id, {
          nome,
          ...(podeEscolherPapel ? { papel: dados.papel } : {}),
        });
      } else {
        await criarUsuarioPelaRevendedora(revendedoraId, {
          nome,
          email,
          senha: dados.senha,
          papel: dados.papel,
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
      <form className="formulario" onSubmit={enviar} noValidate>
        <label className="campo">
          <span className="campo-rotulo">Nome *</span>
          <input className="campo-input" value={dados.nome} onChange={alterar("nome")} required />
          {erros.nome ? <span className="campo-erro">{erros.nome}</span> : null}
        </label>

        <label className="campo">
          <span className="campo-rotulo">E-mail {editando ? "" : "*"}</span>
          <input
            className="campo-input"
            type="email"
            autoComplete="off"
            value={dados.email}
            onChange={alterar("email")}
            disabled={editando}
            required
          />
          {erros.email ? <span className="campo-erro">{erros.email}</span> : null}
        </label>

        {!editando && (
          <label className="campo">
            <span className="campo-rotulo">Senha provisória *</span>
            <input
              className="campo-input"
              type="text"
              autoComplete="new-password"
              value={dados.senha}
              onChange={alterar("senha")}
              required
            />
            {erros.senha ? <span className="campo-erro">{erros.senha}</span> : null}
          </label>
        )}

        <label className="campo">
          <span className="campo-rotulo">Tipo de usuário</span>
          <select
            className="campo-input"
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
          {!souAdmin ? <span className="campo-dica">Gerentes definem apenas vendedor ou supervisor.</span> : null}
          {ehEuMesmo ? <span className="campo-dica">Você não pode alterar o próprio tipo.</span> : null}
        </label>

        {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}

        <div className="formulario-acoes">
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : editando ? "Salvar" : "Criar usuário"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}