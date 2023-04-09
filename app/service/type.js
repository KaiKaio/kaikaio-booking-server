'use strict';

const Service = require('egg').Service;

class TypeService extends Service {

  // 获取标签列表
  async list() {
    const { app } = this;
    const QUERY_STR = 'id, name, type, icon';
    const sql = `select ${QUERY_STR} from type`;
    try {
      const result = await app.mysql.query(sql);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = TypeService;
