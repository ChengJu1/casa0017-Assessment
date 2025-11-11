// Website/server/db/config.js  (ESM)
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

// __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// SQLite 文件路径（根据你的实际位置调整）
const dbPath = path.resolve(__dirname, "eco_env.sqlite");
// 如果你的库在 Website/server/db/eco_env.sqlite 就是上面这一行
// 若在 Website/server/eco_env.sqlite 则用：path.resolve(__dirname, "../eco_env.sqlite")

console.log("🔗 SQLite path:", dbPath);

export const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

// 可选的一些 PRAGMA
await db.exec("PRAGMA foreign_keys = ON;");
await db.exec("PRAGMA journal_mode = DELETE;");
await db.exec("PRAGMA synchronous = NORMAL;");

console.log("✅ database connect successfully！");
