// ========================================
// STEP 1: Imports
// ========================================
import express from "express";
import cors from "cors";
import { db } from "../db/config.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ========================================
// STEP 2: 文件路径设置
// ========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, "../../client/dist");
console.log(`📂 Serving frontend from: ${CLIENT_DIR}`);

// ========================================
// API 路由
// ========================================

// health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// get all countries
app.get("/api/countries", async (req, res, next) => {
  try {
    const rows = await db.all("SELECT name, iso3 FROM country ORDER BY name");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// get all indicators
app.get("/api/indicators", async (req, res, next) => {
  try {
    const rows = await db.all(
      "SELECT code, name, unit, igroup FROM indicator ORDER BY igroup, code"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Get all policy indicators and their start year for a country
app.get("/api/country/:iso3/policies", async (req, res, next) => {
  try {
    const { iso3 } = req.params;
    const rows = await db.all(
      `
      SELECT 
        i.code AS indicator_code,
        i.name AS indicator_name,
        MIN(d.year) AS start_year
      FROM datapoint d
      JOIN indicator i ON i.id = d.indicator_id
      JOIN country  c ON c.id = d.country_id
      WHERE 
        c.iso3 = ? 
        AND i.igroup = 'POL'
        AND d.value > 0
      GROUP BY i.code, i.name
      ORDER BY i.code
      `,
      [iso3]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// get time series for a country + indicators
app.get("/api/country/:iso3/series", async (req, res, next) => {
  const codes = (req.query.codes || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!codes.length)
    return res.status(400).json({ error: "codes required" });

  try {
    const placeholders = codes.map(() => "?").join(",");
    const rows = await db.all(
      `
      SELECT i.code, i.name, i.unit, d.year, d.value
      FROM datapoint d
      JOIN indicator i ON i.id = d.indicator_id
      JOIN country  c ON c.id = d.country_id
      WHERE c.iso3 = ? AND i.code IN (${placeholders})
      ORDER BY i.code, d.year
      `,
      [req.params.iso3, ...codes]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// get slice by indicator + year + countries
app.get("/api/indicator/:code/slice", async (req, res, next) => {
  const { code } = req.params;
  const { year, countries = "BRA,POL,KOR" } = req.query;
  if (!year) return res.status(400).json({ error: "year required" });

  const list = countries.split(",").map((s) => s.trim());
  try {
    const placeholders = list.map(() => "?").join(",");
    const rows = await db.all(
      `
      SELECT c.iso3, d.value
      FROM datapoint d
      JOIN indicator i ON i.id = d.indicator_id
      JOIN country  c ON c.id = d.country_id
      WHERE i.code = ? AND d.year = ? AND c.iso3 IN (${placeholders})
      ORDER BY c.iso3
      `,
      [code, year, ...list]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// get GDP + env + policy index (per year)
app.get("/api/country/:iso3/panel", async (req, res, next) => {
  const envMap = {
    co2: "EN.ATM.CO2E.PC",
    pm25: "EN.ATM.PM25.MC.M3",
    forest: "AG.LND.FRST.ZS",
  };
  const envCode = envMap[(req.query.env || "co2").toLowerCase()];

  try {
    const rows = await db.all(
      `
      SELECT d.year,
        MAX(CASE WHEN i.code = 'NY.GDP.MKTP.CD' THEN d.value END) AS gdp,
        MAX(CASE WHEN i.code = ? THEN d.value END) AS env,
        MAX(CASE WHEN i.code = 'POL.EPS' THEN d.value END) AS policy_eps
      FROM datapoint d
      JOIN indicator i ON i.id = d.indicator_id
      JOIN country  c ON c.id = d.country_id
      WHERE c.iso3 = ? AND i.code IN ('NY.GDP.MKTP.CD', 'POL.EPS', ?)
      GROUP BY d.year
      ORDER BY d.year
      `,
      [envCode, req.params.iso3, envCode]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// get GDP time series for a country
app.get("/api/country/:iso3/gdp", async (req, res, next) => {
  try {
    const rows = await db.all(
      `
      SELECT c.name, d.year, d.value AS gdp
      FROM datapoint d
      JOIN indicator i ON i.id = d.indicator_id
      JOIN country  c ON c.id = d.country_id
      WHERE c.iso3 = ? AND i.code = 'NY.GDP.MKTP.CD'
      ORDER BY d.year
      `,
      [req.params.iso3]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ========================================
// 静态文件服务（必须在 API 路由之后）
// ========================================
app.use(express.static(CLIENT_DIR));

// 处理所有非 API 路由（支持 SPA 和多个 HTML 文件）
app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, "index.html"));
});

// ========================================
// 错误处理
// ========================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: "internal_error", detail: err.message });
});

// ========================================
// 启动服务器
// ========================================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ SQLite API running at http://localhost:${PORT}`);
  console.log(`📡 Network: http://10.129.111.24:${PORT}`);
});

process.stdin.resume();