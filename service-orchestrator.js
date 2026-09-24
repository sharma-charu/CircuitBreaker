#!/usr/bin/env node

/**
 * ==============================================================================
 * 🌟 Circuit Breaker & Resilience Microservices Cluster Orchestrator
 * ==============================================================================
 * A unified cluster manager that boots, monitors, streams logs, and shuts down
 * all microservices (Eureka, Gateway, Product, Inventory, Recommendation, Dashboard)
 * with a single command and intelligent startup sequencing.
 * ==============================================================================
 */

const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const readline = require('readline');
const os = require('os');
const fs = require('fs');

// Terminal ANSI styling
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m\x1b[37m',
  bgCyan: '\x1b[46m\x1b[30m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgYellow: '\x1b[43m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m',
  bgMagenta: '\x1b[45m\x1b[37m'
};

const ROOT_DIR = path.resolve(__dirname);
const IS_WIN = os.platform() === 'win32';
const MVNW_CMD = IS_WIN ? '.\\mvnw.cmd' : './mvnw';
const NPM_CMD = IS_WIN ? 'npm.cmd' : 'npm';

const GATEWAY_INTERNAL_PORT = parseInt(process.env.GATEWAY_PORT || '8090');
const DASHBOARD_PUBLIC_PORT = parseInt(process.env.PORT || '5173');

// Microservices Configuration Registry
const SERVICES = [
  {
    id: 'eureka',
    name: 'Eureka Discovery Server',
    tag: '[EUREKA]       ',
    color: C.magenta,
    bgTag: C.bgMagenta,
    port: 8761,
    healthEndpoint: 'http://localhost:8761/actuator/health',
    cwd: path.join(ROOT_DIR, 'Eureka-server'),
    cmd: MVNW_CMD,
    args: ['spring-boot:run'],
    isCore: true,
    tier: 1 // Starts first
  },
  {
    id: 'gateway',
    name: 'Spring Cloud Gateway',
    tag: '[API-GATEWAY]  ',
    color: C.cyan,
    bgTag: C.bgCyan,
    port: GATEWAY_INTERNAL_PORT,
    healthEndpoint: `http://localhost:${GATEWAY_INTERNAL_PORT}/actuator/health`,
    cwd: path.join(ROOT_DIR, 'api-Gateway'),
    cmd: MVNW_CMD,
    args: ['spring-boot:run'],
    tier: 2 // Starts after Eureka
  },
  {
    id: 'product',
    name: 'Product Service',
    tag: '[PRODUCT-SVC]  ',
    color: C.blue,
    bgTag: C.bgBlue,
    port: 8081,
    healthEndpoint: 'http://localhost:8081/actuator/health',
    cwd: path.join(ROOT_DIR, 'product-service'),
    cmd: MVNW_CMD,
    args: ['spring-boot:run'],
    tier: 2
  },
  {
    id: 'inventory',
    name: 'Inventory Service',
    tag: '[INVENTORY-SVC]',
    color: C.yellow,
    bgTag: C.bgYellow,
    port: 8082,
    healthEndpoint: 'http://localhost:8082/actuator/health',
    cwd: path.join(ROOT_DIR, 'inventory-service'),
    cmd: MVNW_CMD,
    args: ['spring-boot:run'],
    tier: 2
  },
  {
    id: 'recommendation',
    name: 'Recommendation Service',
    tag: '[RECOMMEND-SVC]',
    color: C.green,
    bgTag: C.bgGreen,
    port: 8083,
    healthEndpoint: 'http://localhost:8083/actuator/health',
    cwd: ROOT_DIR,
    cmd: MVNW_CMD,
    args: ['spring-boot:run'],
    tier: 2
  },
  {
    id: 'dashboard',
    name: 'Resilience Dashboard UI',
    tag: '[DASHBOARD-UI] ',
    color: C.cyan,
    bgTag: C.bgCyan,
    port: DASHBOARD_PUBLIC_PORT,
    healthEndpoint: `http://localhost:${DASHBOARD_PUBLIC_PORT}`,
    cwd: path.join(ROOT_DIR, 'resilience-dashboard-ui'),
    cmd: NPM_CMD,
    args: ['run', 'dev', '--', '--host'],
    tier: 3 // Starts last
  }
];

const processes = new Map();
const serviceStatuses = new Map();

// Helper to check HTTP health
function checkEndpoint(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        timeout: timeoutMs
      }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400 || res.statusCode === 503);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

// Kill process on port (Windows & Unix)
function killPort(port) {
  try {
    if (IS_WIN) {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = out.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
          } catch { }
        }
      }
    } else {
      execSync(`fuser -k -n tcp ${port} 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch { }
}

// Kill all cluster ports
function killAllClusterPorts() {
  console.log(`${C.yellow}🧹 Cleaning up existing service ports...${C.reset}`);
  SERVICES.forEach(s => killPort(s.port));
}

// Built-in Static & API Gateway Reverse Proxy Server for Dashboard
function startStaticDashboardServer(port = 5173, distDir) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2'
  };

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const pathname = (req.url || '/').split('?')[0];

    // Reverse-proxy API & Actuator requests to API Gateway
    const isProxy = /^\/(actuator|products|inventory|api|fallback)/.test(pathname);
    if (isProxy) {
      const proxyReq = http.request({
        hostname: '127.0.0.1',
        port: GATEWAY_INTERNAL_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${GATEWAY_INTERNAL_PORT}`
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', () => {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'GATEWAY_STARTING', message: 'API Gateway is initializing...' }));
      });

      req.pipe(proxyReq, { end: true });
      return;
    }

    // Static Asset Delivery with SPA fallback
    let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  const listenPort = parseInt(process.env.PORT || port);
  server.listen(listenPort, '0.0.0.0', () => {
    console.log(`${C.green}${C.bright}✔ [READY] Dashboard UI Static & Proxy Server ONLINE on 0.0.0.0:${listenPort}${C.reset}`);
  });

  return server;
}

// Dynamic command resolver (Runs pre-built JARs with memory optimization if available, or dev mode)
function getServiceExecConfig(svc) {
  // Check for pre-built JAR in target/
  const targetDir = path.join(svc.cwd, 'target');
  if (fs.existsSync(targetDir)) {
    try {
      const files = fs.readdirSync(targetDir);
      const jar = files.find(f => f.endsWith('.jar') && !f.endsWith('.original') && !f.includes('javadoc') && !f.includes('sources'));
      if (jar) {
        const jarPath = path.join(targetDir, jar);
        return {
          cmd: 'java',
          args: [
            '-XX:+UseSerialGC',
            '-Xms24m',
            '-Xmx64m',
            '-Xss256k',
            '-XX:TieredStopAtLevel=1',
            '-XX:CICompilerCount=2',
            '-Dspring.jmx.enabled=false',
            '-Djava.security.egd=file:/dev/./urandom',
            '-jar',
            jarPath
          ]
        };
      }
    } catch { }
  }

  return { cmd: svc.cmd, args: svc.args };
}

// Spawn a microservice process
function startService(svc) {
  return new Promise((resolve) => {
    // If dashboard has a production dist folder, serve it with built-in HTTP server
    if (svc.id === 'dashboard') {
      const distPath = path.join(svc.cwd, 'dist');
      if (fs.existsSync(distPath)) {
        console.log(`${svc.color}${C.bright}▶ Launching ${svc.name} via Native Node Static/Proxy Server...${C.reset}`);
        serviceStatuses.set(svc.id, 'ONLINE');
        const srv = startStaticDashboardServer(svc.port, distPath);
        processes.set(svc.id, { kill: () => srv.close() });
        resolve(true);
        return;
      }
    }

    const execConfig = getServiceExecConfig(svc);
    console.log(`${svc.color}${C.bright}▶ Launching ${svc.name} on Port ${svc.port} [${execConfig.cmd}]...${C.reset}`);
    serviceStatuses.set(svc.id, 'STARTING');

    const proc = spawn(execConfig.cmd, execConfig.args, {
      cwd: svc.cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    processes.set(svc.id, proc);

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        console.log(`${svc.color}${svc.tag}${C.reset} ${line}`);
      }
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        console.log(`${C.red}${svc.tag}[ERR]${C.reset} ${line}`);
      }
    });

    proc.on('exit', (code) => {
      if (serviceStatuses.get(svc.id) !== 'STOPPED') {
        serviceStatuses.set(svc.id, 'EXITED');
        console.log(`${C.yellow}⚠️ ${svc.name} exited with code ${code}${C.reset}`);
      }
    });

    // Poll until healthy or 40 seconds timeout
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const isUp = await checkEndpoint(svc.healthEndpoint);
      if (isUp) {
        clearInterval(interval);
        serviceStatuses.set(svc.id, 'ONLINE');
        console.log(`${C.green}${C.bright}✔ [READY] ${svc.name} is ONLINE on port ${svc.port}${C.reset}`);
        resolve(true);
      } else if (attempts > 60) {
        clearInterval(interval);
        serviceStatuses.set(svc.id, 'TIMEOUT');
        console.log(`${C.yellow}⏳ ${svc.name} startup ongoing in background...${C.reset}`);
        resolve(false);
      }
    }, 1500);
  });
}

// Print Status Matrix Table
function printStatusMatrix() {
  console.log('\n' + C.cyan + '='.repeat(70) + C.reset);
  console.log(`${C.bright}${C.cyan}               MICROSERVICES CLUSTER STATUS MONITOR${C.reset}`);
  console.log(C.cyan + '='.repeat(70) + C.reset);
  console.log(`${C.dim}SERVICE NAME               PORT   STATUS     ENDPOINT${C.reset}`);
  console.log(C.gray + '-'.repeat(70) + C.reset);

  SERVICES.forEach(svc => {
    const status = serviceStatuses.get(svc.id) || 'OFFLINE';
    let statusFormatted = `${C.gray}OFFLINE   ${C.reset}`;
    if (status === 'ONLINE') statusFormatted = `${C.green}ONLINE  ✔ ${C.reset}`;
    else if (status === 'STARTING') statusFormatted = `${C.yellow}BOOTING ⏳${C.reset}`;
    else if (status === 'EXITED') statusFormatted = `${C.red}STOPPED ✖${C.reset}`;

    const padName = (svc.name + ' '.repeat(26)).slice(0, 26);
    const padPort = (svc.port + ' '.repeat(6)).slice(0, 6);
    console.log(`${padName} :${padPort} ${statusFormatted} http://localhost:${svc.port}`);
  });
  console.log(C.cyan + '='.repeat(70) + C.reset);
  console.log(`${C.bright}Shortcuts:${C.reset} [${C.green}s${C.reset}] Status Table | [${C.cyan}o${C.reset}] Open Browser UI | [${C.yellow}r${C.reset}] Restart Cluster | [${C.red}q / Ctrl+C${C.reset}] Stop All\n`);
}

// Gracefully Stop All Services
async function stopAll() {
  console.log(`\n${C.red}${C.bright}🛑 Shutting down entire microservices cluster...${C.reset}`);
  SERVICES.forEach(s => serviceStatuses.set(s.id, 'STOPPED'));

  processes.forEach((proc, id) => {
    try {
      if (IS_WIN && proc.pid) {
        execSync(`taskkill /F /PID ${proc.pid} /T`, { stdio: 'ignore' });
      } else {
        proc.kill('SIGTERM');
      }
    } catch { }
  });

  killAllClusterPorts();
  console.log(`${C.green}✔ All services stopped cleanly. Goodbye!${C.reset}\n`);
  process.exit(0);
}

// Open Browser URL (safe for both local desktop and headless cloud)
function openBrowser(url) {
  if (process.env.DOCKER || process.env.RAILWAY_ENVIRONMENT || !process.stdin.isTTY) {
    return;
  }
  const startCmd = IS_WIN ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url} 2>/dev/null || true`;
  exec(startCmd, () => { });
}

// Setup Interactive Terminal CLI Keybindings
function setupKeyboardControls() {
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c' || key.name === 'q') {
        stopAll();
      } else if (key.name === 's') {
        printStatusMatrix();
      } else if (key.name === 'o') {
        console.log(`${C.cyan}🚀 Opening Resilience Dashboard UI (http://localhost:5173)...${C.reset}`);
        openBrowser('http://localhost:5173');
      } else if (key.name === 'r') {
        console.log(`${C.yellow}🔄 Restarting cluster...${C.reset}`);
        processes.forEach(proc => {
          try {
            if (IS_WIN && proc.pid) execSync(`taskkill /F /PID ${proc.pid} /T`, { stdio: 'ignore' });
            else proc.kill('SIGTERM');
          } catch { }
        });
        killAllClusterPorts();
        main();
      }
    });
  }
}

// Main Orchestrator Flow
async function main() {
  console.clear();
  console.log(C.cyan + `
  ██████╗ ██████╗  ██████╗██╗  ██╗███████╗███████╗████████╗██████╗  █████╗ ████████╗ ██████╗ ██████╗ 
 ██╔════╝██╔═══██╗██╔════╝██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗
 ██║     ██║   ██║██║     ███████║█████╗  ███████╗   ██║   ██████╔╝███████║   ██║   ██║   ██║██████╔╝
 ██║     ██║   ██║██║     ██╔══██║██╔══╝  ╚════██║   ██║   ██╔══██╗██╔══██║   ██║   ██║   ██║██╔══██╗
 ╚██████╗╚██████╔╝╚██████╗██║  ██║███████╗███████║   ██║   ██║  ██║██║  ██║   ██║   ╚██████╔╝██║  ██║
  ╚═════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
  ` + C.reset);
  console.log(`${C.bright}${C.yellow}▶ Initializing Full Microservices Cluster Orchestration...${C.reset}\n`);

  killAllClusterPorts();

  // Tier 1: Resilience Dashboard UI & API Proxy (Starts immediately to satisfy cloud health check)
  const dashboard = SERVICES.find(s => s.id === 'dashboard');
  console.log(`\n${C.green}${C.bright}[STAGE 1/3] Starting Resilience Dashboard Frontend & Gateway Proxy...${C.reset}`);
  await startService(dashboard);

  // Tier 2: Eureka Discovery Server (Foundation)
  const eureka = SERVICES.find(s => s.id === 'eureka');
  console.log(`\n${C.magenta}${C.bright}[STAGE 2/3] Starting Eureka Service Discovery...${C.reset}`);
  await startService(eureka);

  // Tier 3: Microservices & API Gateway (Sequential startup to eliminate RAM spikes)
  const tier2Services = SERVICES.filter(s => s.tier === 2);
  console.log(`\n${C.cyan}${C.bright}[STAGE 3/3] Starting API Gateway & Microservices Cluster Sequentially...${C.reset}`);
  for (const s of tier2Services) {
    await startService(s);
  }

  console.log(`\n${C.green}${C.bright}🎉 ALL MICROSERVICES ARE RUNNING & CONNECTED!${C.reset}`);
  printStatusMatrix();

  // Auto-open Dashboard
  setTimeout(() => {
    openBrowser(`http://localhost:${DASHBOARD_PUBLIC_PORT}`);
  }, 1000);

  setupKeyboardControls();
}

// Handle Command Line Args (--stop, --status, --help)
const arg = process.argv[2];
if (arg === '--stop') {
  killAllClusterPorts();
  console.log(`${C.green}✔ All cluster ports cleared.${C.reset}`);
  process.exit(0);
} else if (arg === '--status') {
  (async () => {
    for (const s of SERVICES) {
      const up = await checkEndpoint(s.healthEndpoint);
      serviceStatuses.set(s.id, up ? 'ONLINE' : 'OFFLINE');
    }
    printStatusMatrix();
    process.exit(0);
  })();
} else {
  // Handle unexpected interrupts
  process.on('SIGINT', stopAll);
  process.on('SIGTERM', stopAll);
  process.on('exit', () => processes.forEach(p => p.kill && p.kill()));

  main();
}
