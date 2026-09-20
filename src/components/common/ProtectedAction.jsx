import { useAuth } from "../../hooks/useAuth";

// Só renderiza os filhos quando existe usuário logado.
export default function ProtectedAction({ children, fallback = null }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  return usuario ? children : fallback;
}
