import { Controller } from 'egg';
import { User, ApiResponse, JwtPayload } from '../types';

const defaultAvatar = 'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e24b8013f40d1f2fa98a2.png';

export default class UserController extends Controller {
  async register(): Promise<void> {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body as { username: string; password: string };

    if (!username || !password) {
      ctx.body = {
        code: 500,
        msg: '账号密码不能为空',
        data: null,
      } as ApiResponse;
      return;
    }

    // 验证数据库内是否已经有该账户名
    const userInfo = await ctx.service.user.getUserByName(username);

    if (userInfo && userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账户名已被注册，请重新输入',
        data: null,
      } as ApiResponse;
      return;
    }

    // 调用远程用户服务获取 _id
    let remoteUserId: string | null = null;
    try {
      const remoteServiceUrl = process.env.REMOTE_USER_SERVICE_URL || 'http://127.0.0.1:4000';
      const remoteResponse = await app.curl<{
        _id: string;
        msg: string;
      }>(`${remoteServiceUrl}/api/user/register`, {
        method: 'POST',
        contentType: 'json',
        data: { userName: username, password },
        dataType: 'json',
        timeout: 10000,
      });

      const _id = remoteResponse.data._id;

      if (_id) {
        remoteUserId = _id;
      } else {
        ctx.body = {
          code: 500,
          msg: remoteResponse.data?.msg || '远程服务注册失败',
          data: null,
        } as ApiResponse;
        return;
      }
    } catch (error: any) {
      ctx.body = {
        code: 500,
        msg: '无法连接到远程用户服务',
        data: null,
      } as ApiResponse;
      return;
    }

    // 使用远程获取的 user_id 存入本地 user 表
    const result = await ctx.service.user.register({
      username,
      password,
      signature: '世界和平。',
      avatar: defaultAvatar,
      user_id: remoteUserId!,
    });

    if (result) {
      ctx.body = {
        code: 200,
        msg: '注册成功',
        data: { user_id: remoteUserId },
      } as ApiResponse;
    } else {
      ctx.body = {
        code: 500,
        msg: '注册失败',
        data: null,
      } as ApiResponse;
    }
  }

  async login(): Promise<void> {
    // app 为全局属性，相当于所有的插件方法都植入到了 app 对象
    const { ctx, app } = this;
    const { username, password } = ctx.request.body as { username: string; password: string };
    // 根据用户名，在数据库查找相对应的id操作
    const userInfo = await ctx.service.user.getUserByName(username);
    // 没找到说明没有该用户
    if (!userInfo || !userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '账号不存在',
        data: null,
      } as ApiResponse;
      return;
    }

    if (userInfo && password !== userInfo.password) {
      ctx.body = {
        code: 500,
        msg: '账号密码错误',
        data: null,
      } as ApiResponse;
      return;
    }

    // 生成 token 加盐
    const token = app.jwt.sign(
      {
        id: userInfo.id,
        username: userInfo.username,
      } as JwtPayload,
      app.config.jwt.secret,
      { expiresIn: app.config.jwt.sign.expiresIn }
    );

    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        token,
      },
    };
  }

  async getUserInfo(): Promise<void> {
    const { ctx, app } = this;
    const token = ctx.request.header.authorization as string;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    const userInfo = await ctx.service.user.getUserById(decode.userid || decode.id);
    ctx.body = {
      code: 200,
      msg: 'success',
      data: {
        id: userInfo?.id || '',
        username: userInfo?.username || '',
        signature: userInfo?.signature || '',
        avatar: userInfo?.avatar || '',
      },
    };
  }

  async editUserInfo(): Promise<void> {
    const { ctx, app } = this;
    const { signature = '', avatar = '' } = ctx.request.body as { signature: string; avatar: string };

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;

      const userInfo = await ctx.service.user.getUserByName(decode.username);
      if (!userInfo) {
        ctx.body = {
          code: 500,
          msg: '用户不存在',
          data: null,
        } as ApiResponse;
        return;
      }
      await ctx.service.user.editUserInfo({
        ...userInfo,
        signature,
        avatar,
      } as User);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          id: user_id,
          signature,
          username: userInfo.username,
          avatar,
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      } as ApiResponse;
    }
  }

  async modifyPass(): Promise<void> {
    const { ctx, app } = this;
    const { old_pass = '', new_pass = '', new_pass2 = '' } = ctx.request.body as {
      old_pass: string;
      new_pass: string;
      new_pass2: string;
    };

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      if (decode.username === 'admin') {
        ctx.body = {
          code: 400,
          msg: '管理员账户，不允许修改密码！',
          data: null,
        } as ApiResponse;
        return;
      }
      const userInfo = await ctx.service.user.getUserByName(decode.username);
      if (!userInfo) {
        ctx.body = {
          code: 500,
          msg: '用户不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      if (old_pass !== userInfo.password) {
        ctx.body = {
          code: 400,
          msg: '原密码错误',
          data: null,
        } as ApiResponse;
        return;
      }

      if (new_pass !== new_pass2) {
        ctx.body = {
          code: 400,
          msg: '新密码不一致',
          data: null,
        } as ApiResponse;
        return;
      }

      await ctx.service.user.modifyPass({
        ...userInfo,
        password: new_pass,
      } as User);

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

  async verify(): Promise<void> {
    const { ctx, app } = this;
    const { authorization } = ctx.request.header;
    try {
      app.jwt.verify(authorization as string, app.config.jwt.secret);
      ctx.body = {
        code: 200,
      };
    } catch (error) {
      console.error(error, 'verify-error');
      ctx.status = 401;
      ctx.body = {
        code: 401,
      };
    }
  }
}
