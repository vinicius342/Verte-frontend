import { useAuth } from "../../hooks/useAuth";

// Só renderiza os filhos quando existe uma conta autenticada de verdade.
export default function ProtectedAction({ children, fallback = null }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  return usuario && !usuario.isAnonymous ? children : fallback;
}
