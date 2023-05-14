'use strict';

const Service = require('egg').Service;

class BooksService extends Service {
  async list({
    userId,
  }) {
    const { app } = this;

    const sql = `
      select id, name 
      from books 
      where user_id = ${userId}
    `;

    try {
      const result = await app.mysql.query(sql);
      return result;
    } catch (error) {
      console.log(error, 'Service - Books - Error');
      return null;
    }
  }

  async add(params) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('books', params);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = BooksService;
