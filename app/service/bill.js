'use strict';

const Service = require('egg').Service;

class BillService extends Service {

  // 获取账单列表
  async list({ id, start, end, pageNum, pageSize, isAll = false, type_id = '' }) {
    const { app } = this;

    const sql = `
      select id, pay_type, amount, date, type_id, type_name, remark
      from bill 
      where user_id = ${id} AND 
      ${type_id ? `type_id = ${type_id} AND ` : ''}
      date BETWEEN '${start}' AND '${end}' 
      ORDER BY UNIX_TIMESTAMP(date) DESC , id DESC
      ${isAll ? '' : `limit ${(pageNum - 1) * pageSize}, ${pageSize}`}
    `;

    const totalSql = `SELECT COUNT(*) from bill WHERE user_id = ${id} AND 
    ${type_id ? `type_id = ${type_id} AND ` : ''}
    date BETWEEN '${start}' AND '${end}'`;

    const expenseSql = `SELECT SUM(amount) from bill WHERE user_id = ${id} AND 
    pay_type = 1 AND 
    ${type_id ? `type_id = ${type_id} AND ` : ''}
    date BETWEEN '${start}' AND '${end}'`;

    const inComeSql = `SELECT SUM(amount) from bill WHERE user_id = ${id} AND 
    pay_type = 2 AND 
    ${type_id ? `type_id = ${type_id} AND ` : ''}
    date BETWEEN '${start}' AND '${end}'`;

    try {
      const result = await app.mysql.query(sql);
      const total = await app.mysql.query(totalSql);
      const expenseTotal = await app.mysql.query(expenseSql);
      const incomeTotal = await app.mysql.query(inComeSql);
      return { result, total, expenseTotal, incomeTotal };
    } catch (error) {
      console.log(error, 'Service - Bill - Error');
      return null;
    }
  }

  async getEarliestItemDate({ type_id = '', user_id = '' }) {
    const { app } = this;
    try {
      const result = await app.mysql.query(`SELECT MIN(date) as EarliestDate FROM bill WHERE user_id = ${user_id}${type_id ? ` AND type_id = ${type_id}` : ''}`);
      return result;
    } catch (error) {
      console.log(error, 'Service - Bill - getEarliestItemDate - Error');
      return null;
    }
  }

  async add(params) {
    const { app } = this;
    try {
      await app.mysql.query('SET NAMES utf8mb4');
      const result = await app.mysql.insert('bill', params);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async detail(id, user_id) {
    const { app } = this;
    try {
      const result = await app.mysql.get('bill', { id, user_id });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async update(params) {
    const { app } = this;
    try {
      const result = await app.mysql.update('bill', {
        ...params,
      }, {
        id: params.id,
        user_id: params.user_id,
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async delete(id, user_id) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('bill', {
        id,
        user_id,
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = BillService;
