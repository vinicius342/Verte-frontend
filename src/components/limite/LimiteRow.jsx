import { formatDate } from "../../utils/formatDate";

function formatarDataHora(valor) {
    if (!valor) return null;
    const data = typeof valor?.toDate === "function" ? valor.toDate() : valor;
    return formatDate(data, { hora: true }); // ajuste as opções conforme a assinatura real de formatDate
}

export default function LimiteRow({ limite, onSelecionar }) {
    const dataHora = formatarDataHora(limite.createdAt);
    const subtitulo = [limite.codPdv, dataHora].filter(Boolean).join(" · ");

    return (
        <li className="linha-cliente">
            <button type="button" className="linha-botao" onClick={() => onSelecionar(limite)}>
                <span className="linha-pino" aria-hidden>
                </span>
                <span className="linha-texto">
                    <span className="linha-nome">{limite.razaoSocial || "Sem razão social"}</span>
                    {subtitulo ? <span className="linha-comercio">{subtitulo}</span> : null}
                </span>
                <span className="linha-seta" aria-hidden>
                    →
                </span>
            </button>
        </li>
    );
}