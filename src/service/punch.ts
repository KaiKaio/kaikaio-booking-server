import { Service } from 'egg';
import nodes from '../config/nodes';
import net from 'node:net';
import { exec } from 'node:child_process';

type ProbeConfig =
  | { type: 'tcp'; port: number }
  | { type: 'ping' };

interface PunchTask {
  running: boolean;
  nodeId: string;
  ip: string;
  probe: ProbeConfig;
  tryCount: number;
}

interface AppWithPunch {
  punchTask: PunchTask | null;
  punchWsClients: Set<any>;
}


abstract class ProbeStrategy {
  // eslint-disable-next-line no-unused-vars
  abstract probe(ip: string, config: ProbeConfig): Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  abstract label(config: ProbeConfig): string;
}

class TcpProbe extends ProbeStrategy {
  async probe(ip: string, config: ProbeConfig): Promise<boolean> {
    if (config.type !== 'tcp') return false;
    return new Promise(resolve => {
      const socket = net.createConnection({ host: ip, port: config.port }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.setTimeout(5000);
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  label(config: ProbeConfig): string {
    return config.type === 'tcp' ? `TCP:${config.port}` : 'TCP';
  }
}

class PingProbe extends ProbeStrategy {
  async probe(ip: string, _config: ProbeConfig): Promise<boolean> {
    console.log(_config);
    return new Promise(resolve => {
      exec(`ping -c 1 -W 3 ${ip}`, err => {
        resolve(!err);
      });
    });
  }

  label(_config: ProbeConfig): string {
    console.log(_config);
    return 'PING';
  }
}

const probeStrategies: Record<string, ProbeStrategy> = {
  tcp: new TcpProbe(),
  ping: new PingProbe(),
};

function getStrategy(type: string): ProbeStrategy {
  return probeStrategies[type];
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
    if (task.running) {
      const strategy = getStrategy(task.probe.type);
      return `Punching ${task.ip} [${strategy.label(task.probe)}] (Try #${task.tryCount})`;
    }
    return 'Idle';
  }

  private broadcast(message: string) {
    const clients = this.appPunch.punchWsClients;
    const status = this.getStatus();
    const data = JSON.stringify({ time: new Date().toLocaleTimeString(), message, status });
    for (const client of clients) {
      try {
        client.send(data);
      } catch {
        clients.delete(client);
      }
    }
  }

  async start(nodeId: string, retryInterval?: number, timeout?: number): Promise<{ success: boolean; msg?: string }> {
    if (this.isRunning()) {
      return { success: false, msg: '已有任务运行中' };
    }

    const node = this.getNodeById(nodeId);
    if (!node) {
      return { success: false, msg: '设备不存在' };
    }

    const interval = retryInterval || 1000;
    const totalTimeout = timeout || 60;

    this.appPunch.punchTask = {
      running: true,
      nodeId,
      ip: node.ip,
      probe: node.probe,
      tryCount: 0,
    };

    const strategy = getStrategy(node.probe.type);
    this.broadcast(`Task Started\nTarget: ${node.name}\nStrategy: ${strategy.label(node.probe)}`);

    this.runLoop(node.ip, node.probe, interval, totalTimeout);

    return { success: true };
  }

  stop() {
    const task = this.appPunch.punchTask;
    if (task && task.running) {
      task.running = false;
      this.appPunch.punchTask = null;
      this.broadcast('Stopped');
    }
  }

  private async runLoop(ip: string, probe: ProbeConfig, interval: number, totalTimeout: number) {
    const startTime = Date.now();
    const app = this.app as any;
    const strategy = getStrategy(probe.type);

    const tick = async (): Promise<void> => {
      const currentTask: PunchTask | null = app.punchTask;
      if (!currentTask || !currentTask.running) return;

      if (Date.now() - startTime > totalTimeout * 1000) {
        currentTask.running = false;
        app.punchTask = null;
        this.broadcast('Timeout (exceeded total timeout)');
        return;
      }

      currentTask.tryCount++;
      this.broadcast(`Try #${currentTask.tryCount}`);

      try {
        const result = await strategy.probe(ip, probe);
        if (result) {
          currentTask.running = false;
          app.punchTask = null;
          this.broadcast('Connected');
          this.broadcast('Task Finished');
          return;
        }
        this.broadcast('Timeout');
      } catch {
        this.broadcast('Timeout');
      }

      await this.sleep(interval);
      return tick();
    };

    tick();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
