import { Controller } from 'egg';

export default class TypeController extends Controller {
  async list(): Promise<void> {
    const { ctx, app } = this;
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization as string;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    const list = await ctx.service.type.list();
    ctx.body = {
      code: 200,
      msg: '请求成功',
      data: {
        list,
      },
    };
  }
}
