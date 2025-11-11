#!/usr/bin/env node

// Website/back-end/server.js
// Author: your name
// Description: simple express static server

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 兼容 ESM 没有 __dirname 的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 静态文件托管：client 文件夹
app.use(express.static(path.join(__dirname, '../client')));

// 根路由
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../client/index.html'))
);

// 监听所有网卡
app.listen(3000, '0.0.0.0', () => {
  console.log('✅ API running on http://<你的电脑IP>:3000');
});
