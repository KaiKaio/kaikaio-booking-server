'use strict';

const Service = require('egg').Service;

class NoteService extends Service {

  // 获取笔记列表
  async list(id) {
    const { app } = this;
    const QUERY_STR = 'id, content, create_time, update_time';
    const sql = 'SELECT ' + QUERY_STR + ' FROM note WHERE user_id = ? ORDER BY create_time DESC';
    try {
      const result = await app.mysql.query(sql, [ id ]);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // 新增笔记
  async add(params) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('note', params);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // 删除笔记
  async delete(id, user_id) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('note', {
        id,
        user_id,
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // 修改
  async update(params) {
    const { app } = this;
    try {
      const result = await app.mysql.update('note', {
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
}

module.exports = NoteService;
