#!/usr/bin/env node

// Website/server/server.js
// Express 静态托管 Vite 构建产物（dist）+ 监听 0.0.0.0

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// 生产环境：托管 client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
);

// 启动
app.listen(3000, '0.0.0.0', () => {
  console.log('✅ Server running at http://<你的树莓派IP>:3000');
});
