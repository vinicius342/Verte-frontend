import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { login, traduzirErroAuth } from "../services/authService";
import { validarLogin } from "../utils/validators";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const { valido, erros: novos } = validarLogin({ email, senha });
    setErros(novos);
    if (!valido) return;

    setEnviando(true);
    setErroGeral(null);
    try {
      await login(email, senha);
      navigate("/");
    } catch (erro) {
      setErroGeral(erro?.code ? traduzirErroAuth(erro.code) : (erro?.message ?? "Falha ao entrar."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-auth">
      <div className="auth-caixa">
        <div className="marca">
          <span className="marca-pino" aria-hidden>
            ⚲
          </span>
          <span className="marca-nome">Rota Certa</span>
        </div>
        <h1 className="auth-titulo">Entrar</h1>

        <form className="formulario" onSubmit={enviar} noValidate>
          <label className="campo">
            <span className="campo-rotulo">E-mail</span>
            <input
              className="campo-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {erros.email ? <span className="campo-erro">{erros.email}</span> : null}
          </label>
          <label className="campo">
            <span className="campo-rotulo">Senha</span>
            <input
              className="campo-input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
            {erros.senha ? <span className="campo-erro">{erros.senha}</span> : null}
          </label>
          {erroGeral ? <p className="estado-erro">{erroGeral}</p> : null}
          <Button type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="auth-rodape">
          <Link to="/">Voltar para a lista</Link>
        </p>
      </div>
    </div>
  );
}
