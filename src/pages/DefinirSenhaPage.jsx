import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { definirSenha } from "../services/userService";

export default function DefinirSenhaPage() {
  const navigate = useNavigate();
  const { usuario, login, logout, recarregarVinculo, setTrocandoSenha } = useAuth();
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();

    const novos = {};
    if (nova.length < 6) {
      novos.nova = "A senha precisa ter pelo menos 6 caracteres.";
    } else if (nova === "123456") {
      novos.nova = "Escolha uma senha diferente da senha provisória.";
    }
    if (confirmar !== nova) {
      novos.confirmar = "As senhas não coincidem.";
    }
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    const email = usuario?.email;
    if (!email) {
      setErroGeral("Não foi possível identificar seu e-mail. Entre novamente.");
      return;
    }

    setEnviando(true);
    setErroGeral(null);
    setTrocandoSenha(true);

    let senhaAlterada = false;
    try {
      await definirSenha(nova);
      senhaAlterada = true;
      await login(email, nova);
      await recarregarVinculo();
      setTrocandoSenha(false);
    } catch (err) {
      setTrocandoSenha(false);

      if (err?.status === 409) {
        await recarregarVinculo();
        return;
      }

      if (!senhaAlterada) {
        setErroGeral(err?.message ?? "Não foi possível definir a senha.");
        return;
      }

      await logout();
      navigate("/login", {
        replace: true,
        state: { mensagem: "Senha alterada. Entre novamente com a nova senha." },
      });
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    await logout();
  }

  return (
    <main className="login-theme relative min-h-screen bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      <div className="bg-brand-gradient relative overflow-hidden rounded-b-[2.5rem] lg:rounded-none">
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#dots)"
            className="text-brand-deep-foreground"
          />
        </svg>

        <div className="relative mx-auto flex min-h-[42vh] w-full max-w-md flex-col justify-center px-6 pb-16 pt-14 text-center lg:min-h-screen lg:max-w-xl lg:items-start lg:px-16 lg:text-left">
          <header className="animate-rise text-brand-deep-foreground">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-deep-foreground/10 ring-1 ring-brand-deep-foreground/20 backdrop-blur lg:mx-0 lg:h-20 lg:w-20">
              <MapPin className="h-8 w-8 text-accent lg:h-10 lg:w-10" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight lg:text-6xl">
              Verte
            </h1>
            <p className="mt-1 text-sm text-brand-deep-foreground/75 lg:mt-3 lg:text-lg">
              O Assistente que todos precisam.
            </p>
          </header>
        </div>
      </div>

      <div className="relative z-10 -mt-12 flex items-center justify-center px-6 pb-10 lg:mt-0 lg:min-h-screen lg:px-12">
        <section
          className="animate-rise w-full max-w-md rounded-3xl bg-card p-7 shadow-card lg:my-10 lg:p-10"
          style={{ animationDelay: "120ms" }}
        >
          <div className="lg:hidden">
            <h2 className="font-display text-2xl font-bold">Defina sua senha</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Você está usando a senha provisoria. Escolha uma senha só sua para continuar.
            </p>
          </div>
          <div className="hidden lg:block">
            <h2 className="font-display text-3xl font-bold">Defina sua senha</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Você está usando a senha provisória. Escolha uma senha só sua para continuar.
            </p>
          </div>

          <form onSubmit={enviar} noValidate className="mt-7 space-y-5 lg:mt-9 lg:space-y-6">
            <Field label="Nova senha" icon={<Lock className="h-5 w-5" />} error={erros.nova}>
              <input
                type="password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-13 w-full bg-transparent pl-11 pr-4 text-base outline-none placeholder:text-muted-foreground/60"
              />
            </Field>

            <Field
              label="Confirmar senha"
              icon={<Lock className="h-5 w-5" />}
              error={erros.confirmar}
            >
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-13 w-full bg-transparent pl-11 pr-4 text-base outline-none placeholder:text-muted-foreground/60"
              />
            </Field>

            {erroGeral ? (
              <p className="estado-erro" role="alert">
                {erroGeral}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={enviando}
              className="group flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-card transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{enviando ? "Salvando…" : "Definir senha"}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={sair}
              disabled={enviando}
              className="w-full text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              Sair
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {label}
      </span>
      <div className="relative mt-2 rounded-xl border border-input bg-background/60 transition-all focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/15">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
      {error ? <span className="campo-erro mt-1 block text-sm">{error}</span> : null}
    </label>
  );
}
