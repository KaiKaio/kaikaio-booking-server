import { Controller } from 'egg';
import { ApiResponse } from '../types';

export default class NoteController extends Controller {
  /**
   * @swagger
   * /api/note/list:
   *   get:
   *     summary: 获取笔记列表
   *     tags: [Note]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取笔记列表
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 msg:
   *                   type: string
   *                   example: 请求成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     list:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           content:
   *                             type: string
   *                           create_time:
   *                             type: integer
   *                           update_time:
   *                             type: integer
   */
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

  /**
   * @swagger
   * /api/note/add:
   *   post:
   *     summary: 添加笔记
   *     tags: [Note]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - note
   *             properties:
   *               note:
   *                 type: string
   *                 description: 笔记内容
   *     responses:
   *       200:
   *         description: 添加成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
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

  /**
   * @swagger
   * /api/note/delete:
   *   post:
   *     summary: 删除笔记
   *     tags: [Note]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 笔记ID
   *     responses:
   *       200:
   *         description: 删除成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
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

  /**
   * @swagger
   * /api/note/update:
   *   post:
   *     summary: 更新笔记
   *     tags: [Note]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - note
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 笔记ID
   *               note:
   *                 type: string
   *                 description: 笔记内容
   *     responses:
   *       200:
   *         description: 更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
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
