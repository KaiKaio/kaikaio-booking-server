import { Context } from 'egg';

export default function apiLogger(options: {
  excludePaths?: string[];
  sampleRate?: number;
}): any {
  const excludePaths = options.excludePaths || [ '/health', '/favicon.ico' ];
  const sampleRate = options.sampleRate || 1;

  return async function apiLoggerMiddleware(ctx: Context, next: () => Promise<any>): Promise<void> {
    if (excludePaths.some(p => ctx.path === p)) {
      await next();
      return;
    }

    if (sampleRate < 1 && Math.random() > sampleRate) {
      await next();
      return;
    }

    const start = Date.now();
    const requestId = ctx.get('x-request-id') || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    await next();

    const duration = Date.now() - start;
    const decoded: any = ctx.state.user;
    const userId = decoded?.id || decoded?.userid || null;

    const logData = {
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      duration,
      user_id: userId,
      ip: ctx.ip,
      user_agent: ctx.get('user-agent')?.slice(0, 512) || null,
      request_id: requestId,
      created_at: new Date(),
    };

    setImmediate(() => {
      ctx.app.mysql.insert('api_logs', logData).catch((err: Error) => {
        ctx.logger.error('[apiLogger] insert failed:', err.message);
      });
    });
  };
}
