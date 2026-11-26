// Guarda o estado de cada pessoa.
// Com DATABASE_URL usa Postgres (recomendado em produção).
// Sem DATABASE_URL usa um arquivo local (bom para testes; some se o servidor for recriado).
import fs from "node:fs/promises";
import path from "node:path";

let pool = null;
const dir = process.env.DATA_DIR || "./data";
const arquivo = path.join(dir, "estado.json");
let cache = null;
let escrita = Promise.resolve();

export async function iniciar() {
  if (process.env.DATABASE_URL) {
    const pg = await import("pg");
    pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined
    });
    await pool.query("create table if not exists kv (key text primary key, value jsonb not null)");
    console.log("Armazenamento: Postgres");
  } else {
    await fs.mkdir(dir, { recursive: true });
    try { cache = JSON.parse(await fs.readFile(arquivo, "utf8")); } catch { cache = {}; }
    console.log("Armazenamento: arquivo local (os dados somem se o servidor for recriado)");
  }
}

export async function carregar(chave) {
  if (pool) {
    const r = await pool.query("select value from kv where key = $1", [chave]);
    return r.rows[0]?.value ?? null;
  }
  return cache[chave] ?? null;
}

export async function salvar(chave, valor) {
  if (pool) {
    await pool.query(
      "insert into kv (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value",
      [chave, JSON.stringify(valor)]
    );
    return;
  }
  cache[chave] = valor;
  escrita = escrita.then(async () => {
    const tmp = arquivo + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(cache));
    await fs.rename(tmp, arquivo);
  });
  await escrita;
}
