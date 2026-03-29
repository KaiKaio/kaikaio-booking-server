#!/usr/bin/env node

/**
 * deploy-webhook.js - 轻量级 Webhook 部署服务
 *
 * 功能：监听 Webhook 请求，触发部署脚本
 *
 * 使用方法：
 *   1. 直接运行：node deploy-webhook.js
 *   2. 后台运行：nohup node deploy-webhook.js &
 *   3. 使用 PM2：pm2 start deploy-webhook.js
 */

const http = require('http');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============ 配置区域 ============
const CONFIG = {
  port: 3000,
  secret: 'your-webhook-secret',
  allowedIPs: ['127.0.0.1', '::1'],
  logFile: './logs/deploy-webhook.log',
  deployScript: './deploy.sh',
};

// ============ 日志函数 ============
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  if (data) {
    console.log(`  Data: ${JSON.stringify(data)}`);
  }
  
  // 写入日志文件
  try {
    const logDir = path.dirname(CONFIG.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  } catch (err) {
    console.error('写入日志失败:', err.message);
  }
}

// ============ 执行部署 ============
function runDeploy(extraArgs = []) {
  log('INFO', '开始执行部署脚本');
  
  const deployPath = path.resolve(CONFIG.deployScript);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const args = extraArgs.join(' ');
    const command = `/bin/bash ${deployPath} ${args}`;
    
    log('INFO', `执行命令: ${command}`);
    
    exec(command, { cwd: path.dirname(deployPath) }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (stdout) {
        console.log('脚本输出:');
        console.log(stdout);
      }
      
      if (stderr) {
        console.error('脚本错误:');
        console.error(stderr);
      }
      
      if (error) {
        log('ERROR', `部署失败，耗时: ${duration}ms`, { error: error.message });
        reject(error);
      } else {
        log('INFO', `部署成功，耗时: ${duration}ms`);
        resolve({ success: true, duration, stdout, stderr });
      }
    });
  });
}

// ============ HTTP 服务器 ============
const server = http.createServer(async (req, res) => {
  const clientIP = req.socket.remoteAddress;
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  log('INFO', `收到请求`, { method: req.method, url: req.url, ip: clientIP });
  
  // 检查 IP 访问权限（可选）
  // if (!CONFIG.allowedIPs.includes(clientIP)) {
  //   log('WARN', `拒绝访问: ${clientIP}`);
  //   res.writeHead(403, { 'Content-Type': 'application/json' });
  //   res.end(JSON.stringify({ error: 'Forbidden' }));
  //   return;
  // }
  
  // 只接受 POST /deploy 请求
  if (req.method !== 'POST' || url.pathname !== '/deploy') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }
  
  // 验证 Content-Type
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Content-Type must be application/json' }));
    return;
  }
  
  // 读取请求体
  let body = '';
  req.on('data', chunk => { body += chunk; });
  
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      
      // 提取镜像标签（从 GitHub Actions 传递的参数）
      const imageTag = data.tag || data.ref || 'latest';
      const branch = data.branch || '';
      
      log('INFO', `解析请求数据`, { imageTag, branch, body: data });
      
      // 发送 202 Accepted 响应
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'accepted', 
        message: '部署任务已接收，正在执行...',
        tag: imageTag,
        timestamp: new Date().toISOString()
      }));
      
      // 异步执行部署
      try {
        await runDeploy([imageTag, branch]);
      } catch (err) {
        log('ERROR', '部署执行失败', { error: err.message });
      }
      
    } catch (err) {
      log('ERROR', '解析请求失败', { error: err.message });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  });
});

// ============ 健康检查端点 ============
server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  }
});

// ============ 启动服务 ============
server.listen(CONFIG.port, () => {
  log('INFO', `🚀 Webhook 部署服务已启动`);
  log('INFO', `监听端口: ${CONFIG.port}`);
  log('INFO', `Webhook URL: http://localhost:${CONFIG.port}/deploy`);
  log('INFO', `健康检查: http://localhost:${CONFIG.port}/health`);
  log('INFO', `部署脚本: ${path.resolve(CONFIG.deployScript)}`);
});

// ============ 优雅关闭 ============
process.on('SIGINT', () => {
  log('INFO', '收到 SIGINT 信号，正在关闭...');
  server.close(() => {
    log('INFO', '服务已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  log('INFO', '收到 SIGTERM 信号，正在关闭...');
  server.close(() => {
    log('INFO', '服务已关闭');
    process.exit(0);
  });
});
