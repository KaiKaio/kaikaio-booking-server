import type { Application } from 'egg';
import type { Server } from 'http';
import type { WebSocketServer, WebSocket } from 'ws';

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

export interface App extends Application {
  server: Server
  punchWss: WebSocketServer
  punchWsClients: Set<WebSocket>
  punchTask: PunchTask | null
}
