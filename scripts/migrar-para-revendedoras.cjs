#!/usr/bin/env node
/**
 * Migra a estrutura plana do Firestore para:
 *
 *   usuarios/{uid}                                  <- continua existindo, ganha o campo revendedoraId
 *   revendedoras/{revendedoraId}                    <- NOVO (nome da revendedora)
 *   revendedoras/{revendedoraId}/clientes/{id}      <- antigo clientes/{id}
 *   revendedoras/{revendedoraId}/ativos/{id}        <- antigo ativos/{id}
 *   revendedoras/{revendedoraId}/comodatos/{id}     <- antigo comodatos/{id}
 *   revendedoras/{revendedoraId}/limites/{id}       <- antigo limites/{id}
 *
 * Como hoje existe uma única revendedora, TODOS os documentos vão para ela
 * e TODOS os usuários passam a pertencer a ela. IDs e timestamps são preservados.
 * A coleção "configuracoes" (por usuário) não é alterada.
 *
 * USO
 *   node scripts/migrar-para-revendedoras.cjs                    -> DRY-RUN (não grava nada)
 *   node scripts/migrar-para-revendedoras.cjs --executar         -> copia e vincula usuários
 *   node scripts/migrar-para-revendedoras.cjs --executar --limpar
 *                                                                -> apaga os originais já confirmados no destino
 *   --revendedora-id=fortaleza-6391       (padrão)
 *   --revendedora-nome="Fortaleza 6391"   (padrão)
 *
 * CREDENCIAIS
 *   export GOOGLE_APPLICATION_CREDENTIALS=/caminho/serviceAccountKey.json
 *   (ou emulador: FIRESTORE_EMULATOR_HOST=localhost:8080 e GCLOUD_PROJECT=seu-projeto)
 *
 * É seguro rodar mais de uma vez.
 */
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const opt = (nome, padrao) =>
  (args.find((a) => a.startsWith(`--${nome}=`)) || "").split("=").slice(1).join("=") || padrao;

const EXECUTAR = args.includes("--executar");
const LIMPAR = args.includes("--limpar");
const REVENDEDORA_ID = opt("revendedora-id", "fortaleza-6391");
const REVENDEDORA_NOME = opt("revendedora-nome", "Fortaleza 6391");

admin.initializeApp();
const db = admin.firestore();

const COLECOES = ["clientes", "ativos", "comodatos", "limites"];
const ALREADY_EXISTS = 6;

const stats = {};
const stat = (g) => (stats[g] ??= { lidos: 0, copiados: 0, jaExistiam: 0, erros: 0, removidos: 0 });

async function coletar() {
  const tarefas = [];

  tarefas.push({
    grupo: "revendedora",
    destino: db.doc(`revendedoras/${REVENDEDORA_ID}`),
    data: { nome: REVENDEDORA_NOME, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    merge: true,
    manter: true,
  });
  stat("revendedora").lidos++;

  for (const nome of COLECOES) {
    const snap = await db.collection(nome).get();
    for (const d of snap.docs) {
      stat(nome).lidos++;
      tarefas.push({
        grupo: nome,
        origem: d.ref,
        destino: db.doc(`revendedoras/${REVENDEDORA_ID}/${nome}/${d.id}`),
        data: d.data(),
        merge: false,
      });
    }
  }

  const usuarios = await db.collection("usuarios").get();
  for (const d of usuarios.docs) {
    stat("usuarios").lidos++;
    tarefas.push({
      grupo: "usuarios",
      destino: d.ref, // mesmo documento: só acrescenta o campo
      data: { revendedoraId: REVENDEDORA_ID },
      merge: true,
      manter: true,
    });
  }
  return tarefas;
}

async function gravar(tarefas) {
  const writer = db.bulkWriter();
  for (const t of tarefas) {
    const s = stat(t.grupo);
    const op = t.merge
      ? writer.set(t.destino, t.data, { merge: true })
      : writer.create(t.destino, t.data);
    op.then(() => {
      s.copiados++;
      t.ok = true;
    }).catch((e) => {
      if (e.code === ALREADY_EXISTS) {
        s.jaExistiam++;
        t.ok = true;
      } else {
        s.erros++;
        console.error(`[erro] ${t.destino.path}:`, e.message);
      }
    });
  }
  await writer.close();
}

async function limpar(tarefas) {
  const candidatas = tarefas.filter((t) => t.ok && !t.manter);
  const writer = db.bulkWriter();
  for (let i = 0; i < candidatas.length; i += 100) {
    const lote = candidatas.slice(i, i + 100);
    const destinos = await db.getAll(...lote.map((t) => t.destino));
    destinos.forEach((snap, idx) => {
      const t = lote[idx];
      if (!snap.exists) return console.warn(`[não removido, destino ausente] ${t.origem.path}`);
      writer
        .delete(t.origem)
        .then(() => stat(t.grupo).removidos++)
        .catch((e) => console.error(`[erro ao remover] ${t.origem.path}:`, e.message));
    });
  }
  await writer.close();
}

(async () => {
  console.log(EXECUTAR ? "MODO: EXECUÇÃO" : "MODO: DRY-RUN (nada será gravado)");
  console.log(`Revendedora: ${REVENDEDORA_ID} ("${REVENDEDORA_NOME}")`);
  const tarefas = await coletar();
  console.log(`${tarefas.length} operações planejadas.`);

  if (EXECUTAR) {
    await gravar(tarefas);
    if (LIMPAR) await limpar(tarefas);
  }

  console.log("\nResumo:");
  console.table(stats);
  if (!EXECUTAR) console.log("Rode novamente com --executar para aplicar.");
  if (EXECUTAR && !LIMPAR)
    console.log("Originais mantidos. Valide e rode com --executar --limpar.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
