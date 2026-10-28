import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BotaoVoltar({ para, rotulo = "Voltar" }) {
  const navigate = useNavigate();

  function handleClick() {
    if (para) {
      navigate(para);
      return;
    }
    navigate(-1);
  }

  return (
    <button type="button" className="rota-voltar" onClick={handleClick}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{rotulo}</span>
    </button>
  );
}
