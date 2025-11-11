#!/usr/bin/env node

// Website/server/server.js — Express ESM 版本
// 静态托管 client/dist 文件夹

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 兼容 ESM 环境没有 __dirname 的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 静态文件托管 dist（Vite 打包输出）
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
);

// 启动服务器
app.listen(3000, '0.0.0.0', () => {
  console.log('✅ Server running at http://<树莓派IP>:3000');
});
