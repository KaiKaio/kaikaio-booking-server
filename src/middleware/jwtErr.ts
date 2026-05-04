import { Context } from 'egg';

export default function jwtErr(options: { secret: string }): any {
  return async function jwtErrMiddleware(ctx: Context, next: () => Promise<any>): Promise<void> {
    const token = ctx.request.header.authorization;
    if (token !== 'null' && token) {
      try {
        const decoded = ctx.app.jwt.verify(token as string, options.secret);
        ctx.state.user = decoded;
        await next();
      } catch (error) {
        console.log('error', error);
        ctx.status = 401;
        ctx.body = {
          msg: '登录已过期，请重新登录',
          code: 401,
        };
        return;
      }
    } else {
      ctx.status = 401;
      ctx.body = {
        code: 401,
      };
      return;
    }
  };
}
