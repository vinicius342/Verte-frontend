import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Route as RouteIcon,
  Users,
} from "lucide-react";
import { login, traduzirErroAuth } from "../services/authService";
import { validarLogin } from "../utils/validators";

const FEATURES = [
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
    <main className="login-theme relative min-h-screen bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      <div className="bg-brand-gradient relative overflow-hidden rounded-b-[2.5rem] lg:rounded-none">
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
          <defs>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" className="text-brand-deep-foreground" />
        </svg>

        <div className="relative mx-auto flex min-h-[42vh] w-full max-w-md flex-col justify-center px-6 pb-16 pt-14 text-center lg:min-h-screen lg:max-w-xl lg:items-start lg:px-16 lg:text-left">
          <header className="animate-rise text-brand-deep-foreground">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-deep-foreground/10 ring-1 ring-brand-deep-foreground/20 backdrop-blur lg:mx-0 lg:h-20 lg:w-20">
              <MapPin className="h-8 w-8 text-accent lg:h-10 lg:w-10" strokeWidth={2.2} />
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight lg:text-6xl">Verte</h1>
            <p className="mt-1 text-sm text-brand-deep-foreground/75 lg:mt-3 lg:text-lg">
              O Assistente que todos precisam.
            </p>
          </header>

          <ul className="animate-rise mt-12 hidden w-full max-w-sm space-y-5 lg:block" style={{ animationDelay: "160ms" }}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4 text-brand-deep-foreground">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-deep-foreground/10 ring-1 ring-brand-deep-foreground/20">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
                </span>
                <span>
                  <span className="block font-display text-base font-bold">{title}</span>
                  <span className="mt-0.5 block text-sm text-brand-deep-foreground/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 -mt-12 flex items-center justify-center px-6 pb-10 lg:mt-0 lg:min-h-screen lg:px-12">
        <section
          className="animate-rise w-full max-w-md rounded-3xl bg-card p-7 shadow-card lg:my-10 lg:p-10"
          style={{ animationDelay: "120ms" }}
        >
          <div className="lg:hidden">
            <h2 className="font-display text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entre para continuar suas visitas.</p>
          </div>
          <div className="hidden lg:block">
            <h2 className="font-display text-3xl font-bold">Bem-vindo de volta</h2>
            <p className="mt-2 text-base text-muted-foreground">Entre para continuar suas visitas.</p>
          </div>

          <form onSubmit={enviar} noValidate className="mt-7 space-y-5 lg:mt-9 lg:space-y-6">
            <Field label="E-mail" icon={<Mail className="h-5 w-5" />} error={erros.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@empresa.com"
                className="h-13 w-full bg-transparent pl-11 pr-4 text-base outline-none placeholder:text-muted-foreground/60"
              />
            </Field>

            <Field label="Senha" icon={<Lock className="h-5 w-5" />} error={erros.senha}>
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-13 w-full bg-transparent pl-11 pr-12 text-base outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-primary"
              >
                {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </Field>

            {erroGeral ? (
              <p className="text-sm text-destructive" role="alert">
                {erroGeral}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={enviando}
              className="group flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-card transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{enviando ? "Entrando…" : "Entrar"}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="font-medium text-primary hover:underline">
              Voltar para a lista
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{label}</span>
      <div className="relative mt-2 rounded-xl border border-input bg-background/60 transition-all focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/15">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
      {error ? <span className="mt-1 block text-sm text-destructive">{error}</span> : null}
    </label>
  );
}
