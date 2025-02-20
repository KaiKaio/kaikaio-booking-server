'use strict';

module.exports = options => {
  return async function jwtErr(ctx, next) {
    const token = ctx.request.header.authorization; // 若是没有 token，返回的是 null 字符串
    if (token !== 'null' && token) {
      try {
        ctx.app.jwt.verify(token, options.secret); // 验证token
        await next();
      } catch (error) {
        console.log('error', error);
        ctx.status = 401;
        ctx.body = {
          msg: '登录已过期，请重新登录',
          code: 401,
        };
        return;
      }
    } else {
      ctx.status = 401;
      ctx.body = {
        code: 401,
      };
      return;
    }
  };
};
