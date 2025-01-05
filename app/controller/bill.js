'use strict';

const moment = require('moment');
const csvtojson = require('csvtojson');

const Controller = require('egg').Controller;

class BillController extends Controller {
  async list() {
    const { ctx, app } = this;
    const {
      start,
      end,
      page,
      orderBy,
      page_size = 10,
      type_id = '',
    } = ctx.query;
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) {
        return;
      }

      const user_id = decode.userid;
      const {
        result: list,
        total,
        expenseTotal,
        incomeTotal,
      } = await ctx.service.bill.list({
        id: user_id,
        start, end,
        type_id,
        orderBy,
        pageNum: page,
        pageSize: page_size,
      });

      const totalNum = total[0]['COUNT(*)'] || 0;
      const expenseReuslt = expenseTotal[0]['SUM(amount)'] || 0;
      const incomeReuslt = incomeTotal[0]['SUM(amount)'] || 0;

      // 格式化
      const dateMap = new Map();
      list.forEach(item => {
        const formatItemDate = moment(item.date).format('YYYY-MM-DD');
        const itemDateList = dateMap.get(formatItemDate) || [];
        dateMap.set(formatItemDate, [ ...itemDateList, item ]);
      });

      const _list = [];
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
          totalPage: Math.ceil(totalNum / page_size),
          list: _list,
        },
      };
    } catch (err) {
      console.log(err, '查询列表抛错');
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async getEarliestItemDate() {
    const { ctx, app } = this;
    const {
      type_id = '',
    } = ctx.query;
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);

      if (!decode) {
        return;
      }

      const user_id = decode.userid;

      const earliestList = await ctx.service.bill.getEarliestItemDate({ user_id, type_id });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: earliestList.length ? earliestList[0].EarliestDate : '',
      };
    } catch (err) {
      console.log(err, '查询列表抛错');
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async add() {
    const { ctx, app } = this;
    const { amount, type_id, type_name, pay_type, remark = '', date } = ctx.request.body;

    if (!amount || !type_id || !type_name || !pay_type || !date) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      await ctx.service.bill.add({
        amount,
        type_id,
        type_name,
        date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
        pay_type,
        remark,
        user_id,
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async detail() {
    const { ctx, app } = this;
    const { id = '' } = ctx.query;
    // 获取用户 user_id
    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    const user_id = decode.userid;

    if (!id) {
      ctx.body = {
        code: 500,
        msg: '订单id不能为空',
        data: null,
      };
      return;
    }

    try {
      const detail = await ctx.service.bill.detail(id, user_id);
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
      };
    }
  }

  async update() {
    const { ctx, app } = this;
    const { id, amount, type_id, type_name, date, pay_type, remark = '' } = ctx.request.body;

    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      await ctx.service.bill.update({
        id,
        amount,
        type_id,
        type_name,
        date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
        pay_type,
        remark,
        user_id,
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      await ctx.service.bill.delete(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async data() {
    const { ctx, app } = this;
    const { start = '', end = '' } = ctx.query;

    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;

    const user_id = decode.userid;

    if (!start || !end) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }

    try {
      const {
        result: list,
        expenseTotal,
        incomeTotal,
      } = await ctx.service.bill.list({
        id: user_id,
        start,
        end,
        isAll: true,
      });

      const expenseReuslt = expenseTotal[0]['SUM(amount)'] || 0;
      const incomeReuslt = incomeTotal[0]['SUM(amount)'] || 0;

      // 获取收支构成
      const total_data = list.reduce((arr, cur) => {
        const index = arr.findIndex(item => item.type_id === cur.type_id);
        if (index > -1) {
          arr[index].number += Number(cur.amount);
        } else {
          arr.push({
            type_id: cur.type_id,
            type_name: cur.type_name,
            pay_type: cur.pay_type,
            number: Number(cur.amount),
          });
        }
        return arr;
      }, []).map(item => {
        item.number = Number(Number(item.number).toFixed(2));
        return item;
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
      };
    }
  }

  async queyBillByMonthly() {
    const {
      ctx,
      app,
    } = this;
    const { startMonth = '', endMonth = '' } = ctx.query;

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;

      const user_id = decode.userid;

      if (!startMonth || !endMonth) {
        ctx.body = {
          code: 400,
          msg: '参数错误',
          data: null,
        };
        return;
      }

      // 使用moment.js解析传入的年月字符串，将日期设置为该月的最后一天
      const startMonthFormat = moment(startMonth, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
      const endMonthFormat = moment(endMonth, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');
      const result = await ctx.service.bill.queyBillByMonthly({ user_id, startMonth: startMonthFormat, endMonth: endMonthFormat });
      const formateResult = result.map(item => {
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
      console.log(err, 'queyBillByMonthly - con -error');
    }
  }

  async import() {
    const { ctx, app } = this;
    const file = ctx.request.files[0];

    if (!file.filepath) {
      return;
    }

    const res = await csvtojson().fromFile(file.filepath);

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) {
        return;
      }

      const user_id = decode.userid;

      const typeList = await ctx.service.type.list(user_id);

      const dataMapIsTimiApp = {};
      typeList.forEach(item => {
        dataMapIsTimiApp[item.name] = item.id;
      });

      const params = res.map(item => ({
        amount: item['金额'],
        type_id: dataMapIsTimiApp[item['账目名称']] || '999',
        type_name: item['账目名称'],
        date: item['时间'],
        pay_type: item['类型'] === '支出' ? '1' : '2', // 收入支出
        remark: item['备注'],
        user_id,
      }));

      await ctx.service.bill.add(params);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }

  }
}

module.exports = BillController;
