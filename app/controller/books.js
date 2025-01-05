'use strict';

const Controller = require('egg').Controller;

class BooksController extends Controller {
  async add() {
    const { ctx, app } = this;
    const { name = '' } = ctx.request.body;

    if (!name) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) {
        return;
      }

      const user_id = decode.userid;
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
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  async list() {
    const { ctx, app } = this;

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);

      if (!decode) {
        return;
      }

      const user_id = decode.userid;
      const data = await ctx.service.books.list({
        userId: user_id,
      }) || [];

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
      };
    }
  }
}

module.exports = BooksController;
