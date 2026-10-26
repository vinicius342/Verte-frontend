export const STATUS_CONFIRMACAO_LABELS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  rejeitado: "Rejeitado",
};

export default function StatusConfirmacao({ status, className }) {
  const rotulo = STATUS_CONFIRMACAO_LABELS[status];

  if (!rotulo) {
    return null;
  }

  return (
    <span
      className={["selo-confirmacao", `selo-confirmacao--${status}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {rotulo}
    </span>
  );
}
