#!/usr/bin/env node
/**
 * configuracoes/{uid} -> revendedoras/{rev}/perfis/{uid}
 * codigoRevenda       -> revendedoras/{rev}/configuracoes/geral
 * usuarios/{uid}      -> ganha papel (padrão "vendedor")
 *
 *   node scripts/migrar-configuracoes.cjs                          (dry-run)
 *   node scripts/migrar-configuracoes.cjs --executar --admin=uid1 --gerente=uid2,uid3
 *   --revendedora-id=fortaleza-6391   --codigo-revenda=1234  (obrigatório se houver conflito)
 * Não apaga nada em configuracoes/ (remova à mão depois de validar).
 */
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const opt = (n, p = "") =>
  (args.find((a) => a.startsWith(`--${n}=`)) || "").split("=").slice(1).join("=") || p;
const lista = (n) => opt(n).split(",").filter(Boolean);

const EXECUTAR = args.includes("--executar");
const REV = opt("revendedora-id", "fortaleza-6391");
const ADMINS = lista("admin");
const GERENTES = lista("gerente");

admin.initializeApp();
const db = admin.firestore();
const TS = admin.firestore.FieldValue.serverTimestamp();

(async () => {
  console.log(EXECUTAR ? "MODO: EXECUÇÃO" : "MODO: DRY-RUN");
  const configs = await db.collection("configuracoes").get();
  const usuarios = await db.collection("usuarios").get();
  const writer = db.bulkWriter();
  const resumo = { perfis: 0, usuariosComPapel: 0 };

  // 1) perfis
  const codigos = new Set();
  for (const d of configs.docs) {
    const c = d.data();
    if (c.codigoRevenda) codigos.add(String(c.codigoRevenda).trim());
    const perfil = {
      vendedor: c.nomeVendedor ?? "",
      vendedorCodigo: c.codigoVendedor ?? "",
      supervisor: c.nomeSupervisor ?? "",
      supervisorCodigo: c.codigoSupervisor ?? "",
      assinatura: c.assinatura ?? null,
      updatedAt: TS,
    };
    resumo.perfis++;
    if (EXECUTAR) writer.set(db.doc(`revendedoras/${REV}/perfis/${d.id}`), perfil, { merge: true });
  }

  // 2) codigoRevenda
  let codigo = opt("codigo-revenda");
  if (!codigo) {
    if (codigos.size === 1) codigo = [...codigos][0];
    else if (codigos.size > 1) {
      console.error("CONFLITO em codigoRevenda:", [...codigos], "-> use --codigo-revenda=");
      process.exit(1);
    }
  }
  if (codigo) {
    console.log("codigoRevenda:", codigo);
    if (EXECUTAR)
      writer.set(
        db.doc(`revendedoras/${REV}/configuracoes/geral`),
        { codigoRevenda: codigo, updatedAt: TS },
        { merge: true },
      );
  }

  // 3) papel dos usuários
  for (const u of usuarios.docs) {
    const papel = ADMINS.includes(u.id) ? "admin" : GERENTES.includes(u.id) ? "gerente" : null;
    const atual = u.data().papel;
    const novo = papel ?? atual ?? "vendedor"; // não rebaixa quem já tem papel
    if (novo === atual) continue;
    resumo.usuariosComPapel++;
    if (EXECUTAR) writer.set(u.ref, { papel: novo, updatedAt: TS }, { merge: true });
  }

  await writer.close();
  console.table(resumo);
  if (!EXECUTAR) console.log("Rode com --executar para aplicar.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});