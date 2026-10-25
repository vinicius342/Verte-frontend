import { useEffect, useState } from "react";

export function iniciais(nome) {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export default function Avatar({ nome, fotoUrl }) {
  const [falhou, setFalhou] = useState(false);
  const iniciaisCalculadas = iniciais(nome);
  useEffect(() => setFalhou(false), [fotoUrl]);

  if (fotoUrl && !falhou) {
    return <img className="avatar-foto" src={fotoUrl} alt="" onError={() => setFalhou(true)} />;
  }
  return iniciaisCalculadas;
}
