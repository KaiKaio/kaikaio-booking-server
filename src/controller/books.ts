import { Controller } from 'egg';
import { ApiResponse } from '../types';

export default class BooksController extends Controller {
  /**
   * @swagger
   * /api/books/add:
   *   post:
   *     summary: 添加账本
   *     tags: [Books]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: 账本名称
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
    const { name = '' } = ctx.request.body as { name: string };

    if (!name) {
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
      if (!decode) {
        return;
      }

      const user_id = decode.userid;
      if (!user_id && user_id !== 0) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.books.add({
        name,
        user_id,
      });
      if (!result) {
        throw new Error();
      }
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
   * /api/books/list:
   *   get:
   *     summary: 获取账本列表
   *     tags: [Books]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取账本列表
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
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       user_id:
   *                         type: integer
   */
  async list(): Promise<void> {
    const { ctx, app } = this;

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);

      if (!decode) {
        return;
      }

      const user_id = decode.userid;
      if (!user_id && user_id !== 0) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const data = (await ctx.service.books.list({
        userId: user_id,
      })) || [];

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data,
      };
    } catch (err) {
      console.log(err, '查询列表抛错');
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }
}
