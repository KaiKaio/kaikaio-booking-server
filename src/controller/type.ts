import { Controller } from 'egg';
import { ApiResponse, BillType } from '../types';

export default class TypeController extends Controller {
  /**
   * @swagger
   * /api/type/list:
   *   get:
   *     summary: 获取消费类型列表
   *     tags: [Type]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取类型列表
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
   *                         $ref: '#/components/schemas/BillType'
   */
  async list(): Promise<void> {
    const { ctx, app } = this;
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization as string;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    const user_id = String(decode.userid);
    const list = await ctx.service.type.list(user_id);
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
   * /api/type/detail:
   *   get:
   *     summary: 获取单个类型详情
   *     tags: [Type]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: 类型ID
   *     responses:
   *       200:
   *         description: 成功获取类型详情
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
   *                   $ref: '#/components/schemas/BillType'
   *       400:
   *         description: 类型ID不能为空
   *       404:
   *         description: 类型不存在
   */
  async detail(): Promise<void> {
    const { ctx, app } = this;
    const { id } = ctx.query as { id?: string };

    if (!id) {
      ctx.body = {
        code: 400,
        msg: '类型ID不能为空',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = String(decode.userid);

      const detail = await ctx.service.type.detail(parseInt(id), user_id);
      if (!detail) {
        ctx.body = {
          code: 404,
          msg: '类型不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: detail,
      };
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
   * /api/type/add:
   *   post:
   *     summary: 添加消费类型
   *     tags: [Type]
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
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *                 description: 类型名称
   *               type:
   *                 type: integer
   *                 enum: [1, 2]
   *                 description: '1: 支出, 2: 收入'
   *               icon:
   *                 type: string
   *                 description: 图标
   *     responses:
   *       200:
   *         description: 添加成功
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
   *                   example: 添加成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   */
  async add(): Promise<void> {
    const { ctx, app } = this;
    const { name, type, icon } = ctx.request.body as { name: string; type: number; icon?: string };

    if (!name || !type) {
      ctx.body = {
        code: 400,
        msg: '类型名称和类型不能为空',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = String(decode.userid);

      const params: BillType = {
        name,
        type,
        icon: icon || '',
        user_id,
      };

      const result = await ctx.service.type.add(params);
      if (!result) {
        ctx.body = {
          code: 500,
          msg: '添加失败',
          data: null,
        } as ApiResponse;
        return;
      }

      ctx.body = {
        code: 200,
        msg: '添加成功',
        data: { id: result.insertId },
      };
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
   * /api/type/update:
   *   post:
   *     summary: 更新消费类型
   *     tags: [Type]
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
   *               - name
   *               - type
   *             properties:
   *               id:
   *                 type: integer
   *                 description: 类型ID
   *               name:
   *                 type: string
   *                 description: 类型名称
   *               type:
   *                 type: integer
   *                 enum: [1, 2]
   *                 description: '1: 支出, 2: 收入'
   *               icon:
   *                 type: string
   *                 description: 图标
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
    const { id, name, type, icon } = ctx.request.body as { id: number; name: string; type: number; icon?: string };

    if (!id || !name || !type) {
      ctx.body = {
        code: 400,
        msg: '参数不完整',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = String(decode.userid);

      // 检查类型是否存在且属于当前用户
      const detail = await ctx.service.type.detail(id, user_id);
      if (!detail) {
        ctx.body = {
          code: 404,
          msg: '类型不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      const params: BillType = {
        id,
        name,
        type,
        icon: icon || '',
        user_id,
      };

      const result = await ctx.service.type.update(params);
      if (!result || result.affectedRows === 0) {
        ctx.body = {
          code: 500,
          msg: '更新失败',
          data: null,
        } as ApiResponse;
        return;
      }

      ctx.body = {
        code: 200,
        msg: '更新成功',
        data: null,
      };
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
   * /api/type/delete:
   *   post:
   *     summary: 删除消费类型（软删除）
   *     tags: [Type]
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
   *                 description: 类型ID
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
        msg: '类型ID不能为空',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = String(decode.userid);

      // 检查类型是否存在且属于当前用户
      const detail = await ctx.service.type.detail(id, user_id);
      if (!detail) {
        ctx.body = {
          code: 404,
          msg: '类型不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      const result = await ctx.service.type.delete(id, user_id);
      if (!result || result.affectedRows === 0) {
        ctx.body = {
          code: 500,
          msg: '删除失败',
          data: null,
        } as ApiResponse;
        return;
      }

      ctx.body = {
        code: 200,
        msg: '删除成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }
}
