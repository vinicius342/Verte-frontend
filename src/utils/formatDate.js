// Formata Timestamp do Firestore, Date ou string em texto legível pt-BR.
export function formatDate(valor) {
  if (!valor) return "—";
  const data =
    typeof valor?.toDate === "function" ? valor.toDate() : valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data?.getTime?.())) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUid(uid) {
  if (!uid) return "—";
  return uid.length > 12 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid;
}
