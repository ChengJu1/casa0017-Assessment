import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
const app = express(); app.use(cors()); app.use(express.json());

app.get('/api/health', (req,res)=>res.json({ok:true}));

app.get('/api/countries', async (req,res)=> {
  const [rows] = await pool.query('SELECT name,iso3 FROM country ORDER BY name');
  res.json(rows);
});

app.get('/api/country/:iso3/series', async (req,res)=>{
  const codes = (req.query.codes||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (!codes.length) return res.status(400).json({error:'codes required'});
  const [rows] = await pool.query(`
    SELECT i.code,i.name,i.unit,d.year,d.value
    FROM datapoint d
    JOIN indicator i ON i.id=d.indicator_id
    JOIN country c   ON c.id=d.country_id
    WHERE c.iso3=? AND i.code IN (?)
    ORDER BY i.code,d.year
  `,[req.params.iso3, codes]);
  res.json(rows);
});

app.get('/api/indicator/:code/slice', async (req,res)=>{
  const { code } = req.params;
  const { year, countries='BRA,POL,KOR' } = req.query;
  if (!year) return res.status(400).json({error:'year required'});
  const list = countries.split(',').map(s=>s.trim());
  const [rows] = await pool.query(`
    SELECT c.iso3, d.value
    FROM datapoint d
    JOIN indicator i ON i.id=d.indicator_id
    JOIN country c   ON c.id=d.country_id
    WHERE i.code=? AND d.year=? AND c.iso3 IN (?)
    ORDER BY c.iso3
  `,[code, year, list]);
  res.json(rows);
});

app.get('/api/country/:iso3/panel', async (req,res)=>{
  const envMap={co2:'EN.ATM.CO2E.PC',pm25:'EN.ATM.PM25.MC.M3',forest:'AG.LND.FRST.ZS'};
  const envCode = envMap[(req.query.env||'co2').toLowerCase()];
  const [rows] = await pool.query(`
    SELECT d.year,
      MAX(CASE WHEN i.code='NY.GDP.MKTP.CD' THEN d.value END) AS gdp,
      MAX(CASE WHEN i.code=? THEN d.value END) AS env,
      MAX(CASE WHEN i.code='POL.EPS' THEN d.value END) AS policy_eps
    FROM datapoint d
    JOIN indicator i ON i.id=d.indicator_id
    JOIN country c   ON c.id=d.country_id
    WHERE c.iso3=? AND i.code IN ('NY.GDP.MKTP.CD','POL.EPS',?)
    GROUP BY d.year ORDER BY d.year
  `,[envCode, req.params.iso3, envCode]);
  res.json(rows);
});

app.listen(3000, ()=>console.log('API running at http://localhost:3000'));
