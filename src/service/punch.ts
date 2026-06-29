import { Service } from 'egg';
import nodes from '../config/nodes';

import net from 'node:net';

interface PunchTask {
  running: boolean;
  nodeId: string;
  ip: string;
  port: number;
  tryCount: number;
}

interface AppWithPunch {
  punchTask: PunchTask | null;
  punchWsClients: Set<any>;
}

export default class PunchService extends Service {
  private get appPunch(): AppWithPunch {
    return this.app as any;
  }

  getNodes() {
    return nodes.map(n => ({ id: n.id, name: n.name }));
  }

  getNodeById(nodeId: string) {
    return nodes.find(n => n.id === nodeId);
  }

  isRunning() {
    const task = this.appPunch.punchTask;
    return task !== null && task.running;
  }

  getStatus() {
    const task = this.appPunch.punchTask;
    if (!task) return 'Idle';
    if (task.running) return `Punching ${task.ip}:${task.port} (Try #${task.tryCount})`;
    return 'Idle';
  }

  private broadcast(message: string) {
    const clients = this.appPunch.punchWsClients;
    const data = JSON.stringify({ time: new Date().toLocaleTimeString(), message });
    for (const client of clients) {
      try {
        client.send(data);
      } catch {
        clients.delete(client);
      }
    }
  }

  async start(nodeId: string, probePort?: number, retryInterval?: number, timeout?: number): Promise<{ success: boolean; msg?: string }> {
    if (this.isRunning()) {
      return { success: false, msg: '已有任务运行中' };
    }

    const node = this.getNodeById(nodeId);
    if (!node) {
      return { success: false, msg: '设备不存在' };
    }

    const port = probePort || node.port;
    const interval = retryInterval || 1000;
    const totalTimeout = timeout || 60;

    this.appPunch.punchTask = {
      running: true,
      nodeId,
      ip: node.ip,
      port,
      tryCount: 0,
    };

    this.broadcast(`Task Started\nTarget: ${node.ip}:${port}`);

    this.runLoop(node.ip, port, interval, totalTimeout);

    return { success: true };
  }

  stop() {
    const task = this.appPunch.punchTask;
    if (task && task.running) {
      task.running = false;
      this.broadcast('Stopped');
      this.appPunch.punchTask = null;
    }
  }

  private async runLoop(ip: string, port: number, interval: number, totalTimeout: number) {
    const startTime = Date.now();
    const app = this.app as any;

    const tick = async (): Promise<void> => {
      const currentTask: PunchTask | null = app.punchTask;
      if (!currentTask || !currentTask.running) return;

      if (Date.now() - startTime > totalTimeout * 1000) {
        this.broadcast('Timeout (exceeded total timeout)');
        currentTask.running = false;
        app.punchTask = null;
        return;
      }

      currentTask.tryCount++;
      this.broadcast(`Try #${currentTask.tryCount}`);

      try {
        await this.tryConnect(ip, port, 5000);
        this.broadcast('Connected');
        this.broadcast('Task Finished');
        currentTask.running = false;
        app.punchTask = null;
        return;
      } catch {
        this.broadcast('Timeout');
      }

      await this.sleep(interval);
      return tick();
    };

    tick();
  }

  private tryConnect(ip: string, port: number, connectTimeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: ip, port }, () => {
        socket.destroy();
        resolve();
      });
      socket.setTimeout(connectTimeout);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('timeout'));
      });
      socket.on('error', () => {
        socket.destroy();
        reject(new Error('error'));
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
