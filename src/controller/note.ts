import { Controller } from 'egg';
import { ApiResponse } from '../types';

export default class NoteController extends Controller {
  async list(): Promise<void> {
    const { ctx, app } = this;
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization as string;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    const user_id = decode.userid;
    if (!user_id && user_id !== 0) {
      ctx.body = {
        code: 500,
        msg: '用户id不能为空',
        data: null,
      } as ApiResponse;
      return;
    }
    const list = await ctx.service.note.list(user_id);
    ctx.body = {
      code: 200,
      msg: '请求成功',
      data: {
        list,
      },
    };
  }

  async add(): Promise<void> {
    const { ctx, app } = this;
    const { note } = ctx.request.body as { note: string };

    if (!note) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      if (!user_id && user_id !== 0) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.note.add({
        content: note,
        create_time: new Date().getTime(),
        update_time: new Date().getTime(),
        user_id,
      });
      if (!result) throw new Error();
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      } as ApiResponse;
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }

  async delete(): Promise<void> {
    const { ctx, app } = this;
    const { id } = ctx.request.body as { id: number };

    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      if (!user_id && user_id !== 0) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.note.delete(id, user_id);
      if (!result) throw new Error();
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      } as ApiResponse;
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }

  async update(): Promise<void> {
    const { ctx, app } = this;
    const { id, note } = ctx.request.body as { id: number; note: string };

    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      if (!user_id && user_id !== 0) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.note.update({
        id,
        content: note,
        update_time: new Date().getTime(),
        user_id,
      });
      if (!result) throw new Error();
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      } as ApiResponse;
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }
}
