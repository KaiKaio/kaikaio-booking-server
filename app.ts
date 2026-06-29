import { WebSocketServer } from 'ws';
import type { App } from './src/types/application';

export default (app: App) => {
  console.log('[App] App.ts Loaded');

  app.punchTask = null;
  app.punchWsClients = new Set();

  const dbEnabled = process.env.ENABLE_DATABASE !== 'false';
  if (!dbEnabled) {
    app.logger.info('[Database] Database connection is disabled by ENABLE_DATABASE=false');
  } else if (!app.mysql) {
    app.logger.warn('[Database] MySQL plugin is not available');
  } else {
    app.logger.info('[Database] MySQL connected successfully');
  }

  app.once('server', (server: App['server']) => {
    console.log('HTTP Server Ready');

    const wss = new WebSocketServer({
      noServer: true,
    });

    server.on('upgrade', (request, socket, head) => {
      console.log('upgrade', request.url);

      if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, ws => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    wss.on('connection', ws => {
      console.log('WebSocket Connected');

      app.punchWsClients.add(ws);

      ws.on('close', () => {
        app.punchWsClients.delete(ws);
      });

      ws.on('error', () => {
        app.punchWsClients.delete(ws);
      });
    });

    app.punchWss = wss;
  });
};
