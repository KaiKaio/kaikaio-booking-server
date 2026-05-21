import { Controller } from 'egg';
import { User, ApiResponse, JwtPayload } from '../types';
import { processUploadFile } from '../utils/upload';

const defaultAvatar = 'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e24b8013f40d1f2fa98a2.png';

export default class UserController extends Controller {
  /**
   * @swagger
   * /api/user/register:
   *   post:
   *     summary: 用户注册
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *               password:
   *                 type: string
   *                 description: 密码
   *     responses:
   *       200:
   *         description: 注册成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
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
      // 注册成功后，初始化用户预设类型
      await ctx.service.type.initUserTypes(remoteUserId!);
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

  /**
   * @swagger
   * /api/user/login:
   *   post:
   *     summary: 用户登录
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *               password:
   *                 type: string
   *                 description: 密码
   *     responses:
   *       200:
   *         description: 登录成功，返回 JWT token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: 登录成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   */
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

  /**
   * @swagger
   * /api/user/get_userinfo:
   *   get:
   *     summary: 获取用户信息
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取用户信息
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 msg:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: 未授权，token 无效或过期
   */
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

  /**
   * @swagger
   * /api/user/edit_userinfo:
   *   post:
   *     summary: 编辑用户信息
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               signature:
   *                 type: string
   *                 description: 个性签名
   *               avatar:
   *                 type: string
   *                 description: 头像URL
   *               username:
   *                 type: string
   *                 description: 用户名
   *     responses:
   *       200:
   *         description: 编辑成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  async editUserInfo(): Promise<void> {
    const { ctx, app } = this;
    const { signature, avatar, username } = ctx.request.body as {
      signature?: string; avatar?: string; username?: string;
    };

    try {
      const token = ctx.request.header.authorization as string;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.userid;
      if (!user_id) {
        ctx.body = {
          code: 500,
          msg: '用户不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      const userInfo = await ctx.service.user.getUserById(user_id);
      if (!userInfo) {
        ctx.body = {
          code: 500,
          msg: '用户不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      const params = {
        ...userInfo,
      } as User;

      if (signature) {
        params.signature = signature;
      }
      if (avatar) {
        params.avatar = avatar;
      }
      if (username) {
        params.username = username;
      }

      await ctx.service.user.editUserInfo(params);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          id: user_id,
          signature,
          username,
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

  /**
   * @swagger
   * /api/user/modify_pass:
   *   post:
   *     summary: 修改用户密码
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - oldPassword
   *               - newPassword
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 description: 旧密码
   *               newPassword:
   *                 type: string
   *                 description: 新密码
   *     responses:
   *       200:
   *         description: 修改成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  async modifyPass(): Promise<void> {
    const { ctx, app } = this;
    const { oldPassword = '', newPassword = '' } = ctx.request.body as {
      oldPassword: string;
      newPassword: string;
    };

    try {
      const token = ctx.request.header.authorization as string;
      const decode = app.jwt.verify(token, app.config.jwt.secret);
      if (!decode?.userid) return;
      const userInfo = await ctx.service.user.getUserById(decode.userid);
      if (!userInfo) {
        ctx.body = {
          code: 500,
          msg: '用户不存在',
          data: null,
        } as ApiResponse;
        return;
      }

      const remoteServiceUrl = process.env.REMOTE_USER_SERVICE_URL || 'http://127.0.0.1:4000';
      const remoteResponse = await app.curl<{
        _id: string;
        msg: string;
      }>(`${remoteServiceUrl}/api/user/changePassword`, {
        method: 'POST',
        contentType: 'json',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { oldPassword, newPassword },
        dataType: 'json',
        timeout: 10000,
      });

      if (remoteResponse.status !== 200) {
        ctx.body = {
          code: 500,
          msg: remoteResponse.data?.msg || '修改密码失败',
          data: null,
        } as ApiResponse;
        return;
      }

      await ctx.service.user.modifyPass({
        ...userInfo,
        password: newPassword,
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

  /**
   * @swagger
   * /api/user/verify:
   *   post:
   *     summary: 验证token是否有效
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: token有效
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *       401:
   *         description: token无效或过期
   */
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

  /**
   * @swagger
   * /api/user/upload/avatar:
   *   post:
   *     summary: 上传用户头像
   *     tags: [User]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: 头像文件
   *     responses:
   *       200:
   *         description: 上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 msg:
   *                   type: string
   *                   example: 上传成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       description: 头像URL
   */
  async uploadAvatar(): Promise<void> {
    const { ctx } = this;

    if (!ctx.request.files || ctx.request.files.length === 0) {
      ctx.body = {
        code: 400,
        msg: '请上传头像',
        data: null,
      } as ApiResponse;
      return;
    }

    const file = ctx.request.files[0];
    let fileUrl = '';

    try {
      fileUrl = await processUploadFile(file, this.config.uploadDir);
    } catch (error) {
      console.log(error, 'uploadAvatar-error');
      ctx.body = {
        code: 500,
        msg: '上传失败',
        data: null,
      } as ApiResponse;
      return;
    } finally {
      ctx.cleanupRequestFiles();
    }

    ctx.body = {
      code: 200,
      msg: '上传成功',
      data: {
        url: fileUrl,
      },
    };
  }
}

