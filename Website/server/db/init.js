import sqlite3 from "sqlite3";
import { open } from "sqlite";
import csv from "csv-parser";
import fs from "fs";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// __dirname = Website/server/db
const ROOT = path.resolve(__dirname, "..", ".."); // -> Website/

const DB_FILE       = path.join(ROOT, "server","db", "eco_env.sqlite");              // SAME DB as server
const COUNTRY_CSV   = path.join(__dirname, "..", "data", "meta", "country.csv");
const INDICATOR_CSV = path.join(__dirname, "..", "data", "meta", "indicator.csv");
const DATAPOINT_CSV = path.join(__dirname, "..", "data", "cleaned", "datapoint.csv");


fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
// Sanity checks
for (const p of [COUNTRY_CSV, INDICATOR_CSV, DATAPOINT_CSV]) {
  if (!fs.existsSync(p)) throw new Error("Missing CSV: " + p);
}
console.log("🌱 Seeding DB:", DB_FILE);
console.log("📄 CSVs:", COUNTRY_CSV, INDICATOR_CSV, DATAPOINT_CSV);


const db = await open({
  filename: DB_FILE,
  driver: sqlite3.Database,
});

console.log("✅ Create database eco_env.sqlite");

//set pragmas//
await db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = DELETE;
  PRAGMA synchronous = NORMAL;
`);

//create tables//
await db.exec(`
DROP TABLE IF EXISTS country;
DROP TABLE IF EXISTS indicator;
DROP TABLE IF EXISTS datapoint;
DROP VIEW IF EXISTS v_series;

CREATE TABLE country (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  iso2  TEXT NOT NULL,
  iso3  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE indicator (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  code    TEXT NOT NULL UNIQUE,
  name    TEXT NOT NULL,
  unit    TEXT,
  igroup  TEXT CHECK(igroup IN ('economy','environment','policy')) NOT NULL
);

CREATE TABLE datapoint (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id    INTEGER NOT NULL,
  indicator_id  INTEGER NOT NULL,
  year          INTEGER NOT NULL,
  value         REAL,
  FOREIGN KEY(country_id) REFERENCES country(id) ON DELETE CASCADE,
  FOREIGN KEY(indicator_id) REFERENCES indicator(id) ON DELETE CASCADE
);
`);

console.log("✅ tables created successfully.");

//read CSV to array//
function readCSVtoArray(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

//import country.csv//
{
  const rows = await readCSVtoArray(COUNTRY_CSV);
  await db.exec("BEGIN;");
  const stmt = await db.prepare(
    `INSERT OR IGNORE INTO country (iso2, iso3, name) VALUES (?,?,?)`
  );
  for (const r of rows) {
    const iso2 = String(r.iso2 ?? r.ISO2 ?? "").trim();
    const iso3 = String(r.iso3 ?? r.ISO3 ?? "").trim();
    const name = String(r.name ?? r.Name ?? "").trim();
    if (!iso3 || !name) continue;
    await stmt.run(iso2, iso3, name);
  }
  await stmt.finalize();
  await db.exec("COMMIT;");
  console.log(`✅ ./data/meta/country.csv import successfully,  ${rows.length} rows processed.`);
}

//import indicator.csv//
{
  const rows = await readCSVtoArray(INDICATOR_CSV);
  await db.exec("BEGIN;");
  const stmt = await db.prepare(
    `INSERT OR IGNORE INTO indicator (code, name, unit, igroup) VALUES (?,?,?,?)`
  );
  for (const r of rows) {
    const code   = String(r.code ?? r.Code ?? "").trim();
    const name   = String(r.name ?? r.Name ?? "").trim();
    const unit   = r.unit ?? r.Unit ?? null;
    const igroup = String(r.igroup ?? r.Group ?? "").trim();
    if (!code || !name || !igroup) continue;
    await stmt.run(code, name, unit, igroup);
  }
  await stmt.finalize();
  await db.exec("COMMIT;");
  console.log(`✅ ${INDICATOR_CSV} import successfully,  ${rows.length} rows processed.`);
}

//import datapoint.csv//
{
  // setup lookup maps//
  const countryIds = Object.fromEntries(
    (await db.all(`SELECT id, iso3 FROM country`)).map(r => [String(r.iso3).trim(), r.id])
  );
  const indicatorIds = Object.fromEntries(
    (await db.all(`SELECT id, code FROM indicator`)).map(r => [String(r.code).trim(), r.id])
  );

  const rows = await readCSVtoArray(DATAPOINT_CSV);
  let ok = 0, skip = 0;
  const badSamples = [];

  await db.exec("BEGIN;");
  const stmt = await db.prepare(
    `INSERT INTO datapoint (country_id, indicator_id, year, value) VALUES (?,?,?,?)`
  );

  for (const r of rows) {
    const iso3 = String(r.Iso3 ?? r.iso3 ?? r.ISO3 ?? "").trim();
    const code = String(r.indicator_code ?? r.code ?? r.Code ?? "").trim();
    const year = Number(r.year);
    const val  = (r.value === "" || r.value == null) ? null : Number(r.value);

    const cId = countryIds[iso3];
    const iId = indicatorIds[code];

    if (!cId || !iId || !Number.isFinite(year)) {
      skip++;
      if (badSamples.length < 5) {
        badSamples.push({ iso3, code, year, val, cId, iId });
      }
      continue;
    }
    await stmt.run(cId, iId, year, val);
    ok++;
  }

  await stmt.finalize();
  await db.exec("COMMIT;");

  console.log(`✅ ${DATAPOINT_CSV} import successfully, inserted: ${ok}, skipped: ${skip}`);
  if (badSamples.length) console.log("⚠️ sample skipped rows:", badSamples);

  const cnt = await db.get(`SELECT COUNT(*) AS n FROM datapoint`);
  console.log("📊 datapoint total rows:", cnt.n);
}

await db.exec(`
  CREATE VIEW IF NOT EXISTS v_series AS
  SELECT c.iso3,
         i.code AS indicator_code,
         i.igroup,
         i.unit,
         d.year,
         d.value
  FROM datapoint d
  JOIN country  c ON c.id = d.country_id
  JOIN indicator i ON i.id = d.indicator_id;
`);
console.log("✅ view v_series created.");

console.log("✅ all data imported successfully");
await db.close();
console.log("✅ database connection closed");