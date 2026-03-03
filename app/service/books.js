'use strict';

const Service = require('egg').Service;

class BooksService extends Service {
  async list({
    userId,
  }) {
    const { app } = this;

    const sql = 'SELECT'
      + ' id, name'
      + ' FROM books'
      + ' WHERE user_id = ?';

    try {
      const result = await app.mysql.query(sql, [ userId ]);
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
