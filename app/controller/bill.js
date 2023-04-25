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
      page_size = 10,
      // type_id = 'all'
    } = ctx.query;
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);

      if (!decode) {
        return;
      }

      const user_id = decode.id;
      const list = await ctx.service.bill.list({ id: user_id, start, end, pageNum: page, pageSize: page_size });

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

      // 分页处理
      const totalExpense = 100;
      const totalIncome = 200;

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          totalExpense,
          totalIncome,
          totalPage: Math.ceil(_list.length / page_size),
          list: _list,
        },
      };
    } catch (err) {
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
      const user_id = decode.id;
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
    const user_id = decode.id;

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
      const user_id = decode.id;
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
      const user_id = decode.id;
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

    const user_id = decode.id;

    if (!start || !end) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }

    try {
      const _data = await ctx.service.bill.list({ id: user_id, start, end, isAll: true });
      // 总支出
      const total_expense = _data.reduce((total, cur) => {
        if (cur.pay_type === '1') {
          total += Number(cur.amount);
        }
        return total;
      }, 0);

      // 总收入
      const total_income = _data.reduce((total, cur) => {
        if (cur.pay_type === '2') {
          total += Number(cur.amount);
        }
        return total;
      }, 0);

      // 获取收支构成
      let total_data = _data.reduce((arr, cur) => {
        const index = arr.findIndex(item => item.type_id === cur.type_id);
        if (index === -1) {
          arr.push({
            type_id: cur.type_id,
            type_name: cur.type_name,
            pay_type: cur.pay_type,
            number: Number(cur.amount),
          });
        }
        if (index > -1) {
          arr[index].number += Number(cur.amount);
        }
        return arr;
      }, []);

      total_data = total_data.map(item => {
        item.number = Number(Number(item.number).toFixed(2));
        return item;
      });

      // 柱状图数据
      let bar_data = _data.reduce((curr, arr) => {
        const index = curr.findIndex(item => item.date === moment(Number(arr.date)).format('YYYY-MM-DD'));
        if (index === -1) {
          curr.push({
            pay_type: arr.pay_type,
            date: moment(Number(arr.date)).format('YYYY-MM-DD'),
            number: Number(arr.amount),
          });
        }
        if (index > -1) {
          curr[index].number += Number(arr.amount);
        }

        return curr;
      }, []);

      bar_data = bar_data.sort((a, b) => moment(a.date).unix() - moment(b.date).unix()).map(item => {
        item.number = Number(item.number).toFixed(2);
        return item;
      });

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          total_expense: Number(total_expense).toFixed(2),
          total_income: Number(total_income).toFixed(2),
          total_data: total_data || [],
          bar_data: bar_data || [],
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
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

      const user_id = decode.id;

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
