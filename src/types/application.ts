import type { Application } from 'egg';
import type { Server } from 'http';
import type { WebSocketServer, WebSocket } from 'ws';

interface PunchTask {
  running: boolean;
  nodeId: string;
  ip: string;
  port: number;
  tryCount: number;
}

export interface App extends Application {
  /**
   * Egg 运行时实际存在，但当前类型中没有声明
   */
  server: Server

  /**
   * WebSocket
   */
  punchWss: WebSocketServer
  punchWsClients: Set<WebSocket>
  punchTask: PunchTask | null
}
