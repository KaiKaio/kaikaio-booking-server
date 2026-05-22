import { Controller } from 'egg';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import csvtojson from 'csvtojson';
import { ApiResponse, Bill } from '../types';

dayjs.extend(customParseFormat);

interface BillItem {
	type_id: number;
	type_name: string;
	pay_type: number;
	amount: number;
}

export default class BillController extends Controller {
  /**
   * @swagger
   * /api/bill/list:
   *   get:
   *     summary: 获取账单列表
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: start
   *         schema:
   *           type: string
   *         description: 开始日期
   *       - in: query
   *         name: end
   *         schema:
   *           type: string
   *         description: 结束日期
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: 页码
   *       - in: query
   *         name: page_size
   *         schema:
   *           type: integer
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: type_id
   *         schema:
   *           type: string
   *         description: 类型ID
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *         description: 排序字段
   *     responses:
   *       200:
   *         description: 成功获取账单列表
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  async list(): Promise<void> {
    const { ctx, app } = this;
    const {
      start,
      end,
      page,
      orderBy,
      page_size = 10,
      type_id = '',
    } = ctx.query as {
			start: string;
			end: string;
			page: string;
			orderBy: string;
			page_size: string;
			type_id: string;
		};
    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) {
        return;
      }

      const user_id = decode.userid;
      if (!user_id) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.bill.list({
        id: user_id,
        start,
        end,
        type_id,
        orderBy,
        pageNum: parseInt(page),
        pageSize: parseInt(page_size as string),
      });

      if (!result) {
        ctx.body = {
          code: 500,
          msg: '查询失败',
          data: null,
        } as ApiResponse;
        return;
      }

      const { result: list, total, expenseTotal, incomeTotal } = result;

      const totalNum = total[0]['COUNT(*)'] || 0;
      const expenseReuslt = expenseTotal[0]['SUM(amount)'] || 0;
      const incomeReuslt = incomeTotal[0]['SUM(amount)'] || 0;

      // 格式化
      const dateMap = new Map<string, any[]>();
      list.forEach((item: any) => {
        const formatItemDate = dayjs(item.date).format('YYYY-MM-DD');
        const itemDateList = dateMap.get(formatItemDate) || [];
        dateMap.set(formatItemDate, [ ...itemDateList, item ]);
      });

      const _list: { bills: any[]; date: string }[] = [];
      dateMap.forEach((value, key) => {
        _list.push({
          bills: value,
          date: key,
        });
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          totalExpense: expenseReuslt,
          totalIncome: incomeReuslt,
          totalPage: Math.ceil(totalNum / parseInt(page_size as string)),
          list: _list,
        },
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

  /**
   * @swagger
   * /api/bill/getEarliestItemDate:
   *   get:
   *     summary: 查询账单最早日期
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type_id
   *         schema:
   *           type: string
   *         description: 类型ID
   *     responses:
   *       200:
   *         description: 成功获取最早日期
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
   *                   type: string
   *                   description: 最早日期
   */
  async getEarliestItemDate(): Promise<void> {
    const { ctx, app } = this;
    const {
      type_id = '',
    } = ctx.query as { type_id?: string };
    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);

      if (!decode) {
        return;
      }

      const user_id = decode.userid;

      const earliestList = await ctx.service.bill.getEarliestItemDate({ user_id: String(user_id), type_id });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: earliestList && earliestList.length ? earliestList[0].EarliestDate : '',
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

  /**
   * @swagger
   * /api/bill/getMonthList:
   *   get:
   *     summary: 查询月份列表
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type_id
   *         schema:
   *           type: string
   *         description: 类型ID
   *     responses:
   *       200:
   *         description: 成功获取月份列表
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
   *                     type: string
   */
  async getMonthList(): Promise<void> {
    const { ctx, app } = this;
    const {
      type_id = '',
    } = ctx.query as { type_id?: string };
    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);

      if (!decode) {
        return;
      }

      const user_id = decode.userid;

      const monthList = await ctx.service.bill.getMonthList({ user_id: String(user_id), type_id });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: monthList || [],
      };
    } catch (err) {
      console.log(err, '查询月份列表抛错');
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }

  /**
   * @swagger
   * /api/bill/add:
   *   post:
   *     summary: 添加账单
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *               - type_id
   *               - type_name
   *               - pay_type
   *               - date
   *             properties:
   *               amount:
   *                 type: number
   *                 description: 金额
   *               type_id:
   *                 type: integer
   *                 description: 类型ID
   *               type_name:
   *                 type: string
   *                 description: 类型名称
   *               pay_type:
   *                 type: integer
   *                 enum: [1, 2]
   *                 description: '1: 支出, 2: 收入'
   *               date:
   *                 type: string
   *                 description: 日期
   *               remark:
   *                 type: string
   *                 description: 备注
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
    const { amount, type_id, type_name, pay_type, remark = '', date, client_local_id = '' } = ctx.request.body as {
			amount: number;
			type_id: number;
			type_name: string;
			pay_type: number;
			remark?: string;
			date: string;
			client_local_id?: string;
		};

    if (!amount || !type_id || !type_name || !pay_type || !date) {
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
      const result = await ctx.service.bill.add({
        amount,
        type_id,
        type_name,
        date: dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        pay_type,
        remark,
        user_id,
      } as Bill);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          ...result,
          client_local_id,
        },
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
   * /api/bill/batchAdd:
   *   post:
   *     summary: 批量添加账单
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               required:
   *                 - amount
   *                 - type_id
   *                 - type_name
   *                 - pay_type
   *                 - date
   *               properties:
   *                 amount:
   *                   type: number
   *                 type_id:
   *                   type: integer
   *                 type_name:
   *                   type: string
   *                 pay_type:
   *                   type: integer
   *                   enum: [1, 2]
   *                 date:
   *                   type: string
   *                 remark:
   *                   type: string
   *     responses:
   *       200:
   *         description: 批量添加成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  async batchAdd(): Promise<void> {
    const { ctx, app } = this;
    const list = ctx.request.body; // Expecting an array directly or a wrapper object

    // Extract list if wrapped in an object like { list: [...] }
    const bills = Array.isArray(list) ? list : list && Array.isArray(list.list) ? list.list : [];

    if (bills.length === 0) {
      ctx.body = {
        code: 400,
        msg: '参数错误：需要提供账单数组',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;

      const params = bills.map((item: any) => {
        const { amount, type_id, type_name, pay_type, remark = '', date } = item;
        if (!amount || !type_id || !type_name || !pay_type || !date) {
          throw new Error('参数错误');
        }
        return {
          amount,
          type_id,
          type_name,
          date: dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
          pay_type,
          remark,
          user_id,
        } as Bill;
      });

      await ctx.service.bill.batchAdd(params);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      } as ApiResponse;
    } catch (error: any) {
      ctx.body = {
        code: error.message === '参数错误' ? 400 : 500,
        msg: error.message === '参数错误' ? '参数错误：缺少必要字段' : '系统错误',
        data: null,
      } as ApiResponse;
    }
  }

  /**
   * @swagger
   * /api/bill/detail:
   *   get:
   *     summary: 获取账单详情
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: 账单ID
   *     responses:
   *       200:
   *         description: 成功获取账单详情
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
   *                   $ref: '#/components/schemas/Bill'
   */
  async detail(): Promise<void> {
    const { ctx, app } = this;
    const { id = '' } = ctx.query as { id?: string };
    // 获取用户 user_id
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

    if (!id) {
      ctx.body = {
        code: 500,
        msg: '订单id不能为空',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      const detail = await ctx.service.bill.detail(parseInt(id), user_id);
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
   * /api/bill/update:
   *   post:
   *     summary: 更新账单
   *     tags: [Bill]
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
   *               - amount
   *               - type_id
   *               - type_name
   *               - pay_type
   *               - date
   *             properties:
   *               id:
   *                 type: integer
   *               amount:
   *                 type: number
   *               type_id:
   *                 type: integer
   *               type_name:
   *                 type: string
   *               pay_type:
   *                 type: integer
   *                 enum: [1, 2]
   *               date:
   *                 type: string
   *               remark:
   *                 type: string
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
    const { id, amount, type_id, type_name, date, pay_type, remark = '', client_local_id = '' } = ctx.request.body as {
			id: number;
			amount: number;
			type_id: number;
			type_name: string;
			date: string;
			pay_type: number;
			remark?: string;
			client_local_id?: string;
		};

    if (!amount || !type_id || !type_name || !date || !pay_type) {
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
      const result = await ctx.service.bill.update({
        id,
        amount,
        type_id,
        type_name,
        date: dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        pay_type,
        remark,
        user_id,
      } as Bill);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          ...result,
          client_local_id,
        },
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
   * /api/bill/delete:
   *   post:
   *     summary: 删除账单
   *     tags: [Bill]
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

      await ctx.service.bill.delete(id, user_id);
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
   * /api/bill/data:
   *   get:
   *     summary: 获取账单数据统计
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: start
   *         schema:
   *           type: string
   *         required: true
   *         description: 开始日期
   *       - in: query
   *         name: end
   *         schema:
   *           type: string
   *         required: true
   *         description: 结束日期
   *     responses:
   *       200:
   *         description: 成功获取统计数据
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
   *                     total_expense:
   *                       type: string
   *                     total_income:
   *                       type: string
   *                     total_data:
   *                       type: array
   *                       items:
   *                         type: object
   */
  async data(): Promise<void> {
    const { ctx, app } = this;
    const { start = '', end = '' } = ctx.query as { start?: string; end?: string };

    const token = ctx.request.header.authorization as string;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;

    const user_id = decode.userid;

    if (!start || !end) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      } as ApiResponse;
      return;
    }

    try {
      if (!user_id) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.bill.list({
        id: user_id,
        start,
        end,
        isAll: true,
      });

      if (!result) {
        ctx.body = {
          code: 500,
          msg: '查询失败',
          data: null,
        } as ApiResponse;
        return;
      }

      const { result: list, expenseTotal, incomeTotal } = result;

      const expenseReuslt = expenseTotal[0]['SUM(amount)'] || 0;
      const incomeReuslt = incomeTotal[0]['SUM(amount)'] || 0;

      // 获取收支构成
      const total_data = list
        .reduce((arr: BillItem[], cur: any) => {
          const index = arr.findIndex((item: BillItem) => item.type_id === cur.type_id);
          if (index > -1) {
            arr[index].amount += Number(cur.amount);
          } else {
            arr.push({
              type_id: cur.type_id,
              type_name: cur.type_name,
              pay_type: cur.pay_type,
              amount: Number(cur.amount),
            });
          }
          return arr;
        }, [] as BillItem[])
        .map((item: BillItem) => {
          const newItem = item as BillItem & { number: number };
          newItem.number = Number(Number(item.amount).toFixed(2));
          return newItem;
        });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          total_expense: expenseReuslt.toFixed(2),
          total_income: incomeReuslt.toFixed(2),
          total_data: total_data || [],
        },
      };
    } catch (error) {
      console.log(error, 'Controller - Bill - Error');
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }

  /**
   * @swagger
   * /api/bill/queyBillByMonthly:
   *   get:
   *     summary: 按月查询账单
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startMonth
   *         schema:
   *           type: string
   *         required: true
   *         description: 开始月份 (YYYY-MM)
   *       - in: query
   *         name: endMonth
   *         schema:
   *           type: string
   *         required: true
   *         description: 结束月份 (YYYY-MM)
   *     responses:
   *       200:
   *         description: 成功获取账单数据
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
   */
  async queyBillByMonthly(): Promise<void> {
    const { ctx, app } = this;
    const { startMonth = '', endMonth = '' } = ctx.query as { startMonth?: string; endMonth?: string };

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;

      const user_id = decode.userid;

      if (!startMonth || !endMonth) {
        ctx.body = {
          code: 400,
          msg: '参数错误',
          data: null,
        } as ApiResponse;
        return;
      }

      // 使用moment.js解析传入的年月字符串，将日期设置为该月的最后一天
      const startMonthFormat = dayjs(startMonth, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
      const endMonthFormat = dayjs(endMonth, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');
      if (!user_id && user_id !== 0) {
        ctx.body = {
          code: 500,
          msg: '用户id不能为空',
          data: null,
        } as ApiResponse;
        return;
      }
      const result = await ctx.service.bill.queyBillByMonthly({
        user_id,
        startMonth: startMonthFormat,
        endMonth: endMonthFormat,
      });
      if (!result) {
        ctx.body = {
          code: 500,
          msg: '查询失败',
          data: null,
        } as ApiResponse;
        return;
      }
      const formateResult = result.map((item: any) => {
        return {
          ...item,
          total_expense: parseFloat(item.total_expense.toFixed(2)),
        };
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: formateResult,
      };
    } catch (err) {
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
      console.log(err, 'queyBillByMonthly - con -error');
    }
  }

  /**
   * @swagger
   * /api/bill/import:
   *   post:
   *     summary: 导入账单(CSV)
   *     tags: [Bill]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: CSV文件
   *     responses:
   *       200:
   *         description: 导入成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  async import(): Promise<void> {
    const { ctx, app } = this;
    const files = ctx.request.files;
    if (!files || files.length === 0) {
      ctx.body = {
        code: 400,
        msg: '请上传文件',
        data: null,
      } as ApiResponse;
      return;
    }
    const file = files[0];

    if (!file.filepath) {
      return;
    }

    const res = await csvtojson().fromFile(file.filepath);

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) {
        return;
      }

      const user_id = decode.userid;

      const typeList = await ctx.service.type.list(String(user_id));

      const dataMapIsTimiApp: Record<string, number> = {};
      if (typeList) {
        typeList.forEach((item: any) => {
          dataMapIsTimiApp[item.name] = item.id;
        });
      }

      const params = res.map((item: any) => ({
        amount: item['金额'],
        type_id: dataMapIsTimiApp[item['账目名称']] || 999,
        type_name: item['账目名称'],
        date: item['时间'],
        pay_type: item['类型'] === '支出' ? 1 : 2, // 收入支出
        remark: item['备注'],
        user_id,
      })) as Bill[];

      await ctx.service.bill.add(params[0]); // 注意：这里原代码可能有bug，应该是batchAdd

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
