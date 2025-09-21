#!/usr/bin/env node

/**
 * Development Server Control Script
 * Manages frontend (Vite) and backend (Wrangler) processes with proper cleanup
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PIDFILE_DIR = '.dev-pids';
const FRONTEND_PORT = 5174;
const BACKEND_PORT = 8787;
const PIDFILES = {
  frontend: path.join(PIDFILE_DIR, 'frontend.pid'),
  backend: path.join(PIDFILE_DIR, 'backend.pid')
};

class DevServer {
  constructor() {
    this.ensurePidDir();
  }

  ensurePidDir() {
    if (!fs.existsSync(PIDFILE_DIR)) {
      fs.mkdirSync(PIDFILE_DIR);
    }
  }

  async killPort(port) {
    return new Promise((resolve) => {
      exec(`lsof -ti:${port}`, (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve();
          return;
        }
        
        const pids = stdout.trim().split('\n');
        let killCount = 0;
        
        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, (killErr) => {
            killCount++;
            if (killCount === pids.length) {
              setTimeout(resolve, 500); // Wait for port to be freed
            }
          });
        });
      });
    });
  }

  async killProcess(pidfile, serviceName) {
    if (fs.existsSync(pidfile)) {
      const pid = fs.readFileSync(pidfile, 'utf8').trim();
      
      try {
        process.kill(parseInt(pid), 'SIGTERM');
        console.log(`📁 Killed ${serviceName} process (PID: ${pid})`);
        
        // Wait a bit then force kill if still running
        setTimeout(() => {
          try {
            process.kill(parseInt(pid), 'SIGKILL');
          } catch (e) {
            // Process already dead
          }
        }, 2000);
        
      } catch (e) {
        console.log(`⚠️  ${serviceName} process (PID: ${pid}) already dead`);
      }
      
      fs.unlinkSync(pidfile);
    }
  }

  async stopAll() {
    console.log('🛑 Stopping all development servers...');
    
    // Kill tracked processes
    await this.killProcess(PIDFILES.frontend, 'Frontend');
    await this.killProcess(PIDFILES.backend, 'Backend');
    
    // Force kill anything on our ports
    await this.killPort(FRONTEND_PORT);
    await this.killPort(BACKEND_PORT);
    
    console.log('✅ All servers stopped');
  }

  async startBackend() {
    console.log('🚀 Starting backend worker...');
    
    // Ensure port is clear
    await this.killPort(BACKEND_PORT);
    
    const backend = spawn('npx', ['wrangler', 'dev', '--remote', '--port', BACKEND_PORT], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      cwd: process.cwd()
    });

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[BACKEND] ${output.trim()}`);
      
      if (output.includes(`Ready on http://localhost:${BACKEND_PORT}`)) {
        console.log(`✅ Backend ready on http://localhost:${BACKEND_PORT}`);
      }
    });

    backend.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Default inspector port')) {
        console.log(`[BACKEND ERROR] ${output.trim()}`);
      }
    });

    backend.on('exit', (code) => {
      console.log(`❌ Backend exited with code ${code}`);
      if (fs.existsSync(PIDFILES.backend)) {
        fs.unlinkSync(PIDFILES.backend);
      }
    });

    // Save PID
    fs.writeFileSync(PIDFILES.backend, backend.pid.toString());
    
    return backend;
  }

  async startFrontend() {
    console.log('🎨 Starting frontend...');
    
    // Ensure port is clear
    await this.killPort(FRONTEND_PORT);
    
    const frontend = spawn('npm', ['run', 'dev:frontend'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[FRONTEND] ${output.trim()}`);
      
      if (output.includes(`http://localhost:${FRONTEND_PORT}`)) {
        console.log(`✅ Frontend ready on http://localhost:${FRONTEND_PORT}`);
      }
    });

    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Default inspector port')) {
        console.log(`[FRONTEND ERROR] ${output.trim()}`);
      }
    });

    frontend.on('exit', (code) => {
      console.log(`❌ Frontend exited with code ${code}`);
      if (fs.existsSync(PIDFILES.frontend)) {
        fs.unlinkSync(PIDFILES.frontend);
      }
    });

    // Save PID
    fs.writeFileSync(PIDFILES.frontend, frontend.pid.toString());
    
    return frontend;
  }

  async start() {
    console.log('🏁 Starting development environment...');
    
    // Stop any existing processes
    await this.stopAll();
    
    // Start backend first (as per project requirements)
    const backend = await this.startBackend();
    
    // Wait a bit for backend to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start frontend
    const frontend = await this.startFrontend();
    
    console.log('🌟 Development environment ready!');
    console.log(`   Frontend: http://localhost:${FRONTEND_PORT}`);
    console.log(`   Backend:  http://localhost:${BACKEND_PORT}`);
    console.log('');
    console.log('💡 Use "node dev-control.js stop" to stop all servers');
    console.log('💡 Use "node dev-control.js restart" to restart everything');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, stopping servers...');
      await this.stopAll();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, stopping servers...');
      await this.stopAll();
      process.exit(0);
    });
  }

  async restart() {
    console.log('🔄 Restarting development environment...');
    await this.stopAll();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  async status() {
    console.log('📊 Development Server Status:');
    
    const checkPort = (port) => {
      return new Promise((resolve) => {
        exec(`lsof -ti:${port}`, (err, stdout) => {
          resolve(stdout.trim() !== '');
        });
      });
    };
    
    const frontendRunning = await checkPort(FRONTEND_PORT);
    const backendRunning = await checkPort(BACKEND_PORT);
    
    console.log(`   Frontend (${FRONTEND_PORT}): ${frontendRunning ? '✅ Running' : '❌ Stopped'}`);
    console.log(`   Backend (${BACKEND_PORT}):  ${backendRunning ? '✅ Running' : '❌ Stopped'}`);
    
    // Check PID files
    Object.entries(PIDFILES).forEach(([name, pidfile]) => {
      if (fs.existsSync(pidfile)) {
        const pid = fs.readFileSync(pidfile, 'utf8').trim();
        try {
          process.kill(parseInt(pid), 0); // Check if process exists
          console.log(`   ${name} PID: ${pid} (tracked)`);
        } catch (e) {
          console.log(`   ${name} PID: ${pid} (stale - cleaning up)`);
          fs.unlinkSync(pidfile);
        }
      }
    });
  }
}

// CLI Interface
async function main() {
  const devServer = new DevServer();
  const command = process.argv[2] || 'start';
  
  try {
    switch (command) {
      case 'start':
        await devServer.start();
        break;
      case 'stop':
        await devServer.stopAll();
        break;
      case 'restart':
        await devServer.restart();
        break;
      case 'status':
        await devServer.status();
        break;
      default:
        console.log('Usage: node dev-control.js [start|stop|restart|status]');
        console.log('');
        console.log('Commands:');
        console.log('  start   - Start both frontend and backend servers');
        console.log('  stop    - Stop all development servers');
        console.log('  restart - Stop and restart all servers');
        console.log('  status  - Show current server status');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DevServer;