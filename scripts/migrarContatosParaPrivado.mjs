import admin from "firebase-admin";

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();
const dryRun = process.argv.includes("--dry-run");
const campos = ["whatsapp", "whatsapp2", "whatsapp3", "anexos"];
const revendedoras = await db.collection("revendedoras").get();
let batch = db.batch();
let operacoes = 0;
let migrados = 0;

async function concluirBatch() {
  if (!dryRun && operacoes > 0) await batch.commit();
  batch = db.batch();
  operacoes = 0;
}

for (const revendedora of revendedoras.docs) {
  const clientes = await revendedora.ref.collection("clientes").get();
  for (const cliente of clientes.docs) {
    const dados = cliente.data();
    const privados = Object.fromEntries(
      campos.filter((campo) => Object.hasOwn(dados, campo)).map((campo) => [campo, dados[campo]]),
    );
    if (Object.keys(privados).length === 0) continue;

    const privadoRef = cliente.ref.collection("privado").doc("dados");
    batch.set(privadoRef, privados, { merge: true });
    batch.update(
      cliente.ref,
      Object.fromEntries(campos.map((campo) => [campo, admin.firestore.FieldValue.delete()])),
    );
    operacoes += 2;
    migrados += 1;

    if (operacoes >= 450) await concluirBatch();
    if (dryRun) {
      // No dry-run, processa e relata sem gravar no Firestore.
      batch = db.batch();
      operacoes = 0;
    }
  }
}

await concluirBatch();
console.log(
  `${dryRun ? "Dry-run: " : ""}${migrados} cliente(s) ${dryRun ? "seriam migrados" : "migrados"}.`,
);
