# Swagger API 文档集成指南

## 安装依赖

```bash
npm install swagger-jsdoc swagger-ui-express --save
```

## 使用方式

### 1. 启动项目

```bash
npm run dev
```

### 2. 访问 API 文档

启动后可通过以下地址访问：

- **Swagger UI 界面**: http://localhost:7001/api-docs
- **Swagger JSON**: http://localhost:7001/swagger.json

## 文档编写规范

### JSDoc 注释示例

```typescript
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
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
async login(): Promise<void> {
  // ... 业务代码
}
```

### GET 请求示例

```typescript
/**
 * @swagger
 * /api/bill/list:
 *   get:
 *     summary: 获取账单列表
 *     tags: [Bill]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取账单列表
 */
```

## 配置说明

### swagger.ts (配置文件)

位置: `src/config/swagger.ts`

- 定义 OpenAPI 基本信息
- 配置通用 Schema (User, Bill, ApiResponse 等)
- 配置认证方式 (JWT Bearer)

### swagger.ts (中间件)

位置: `src/middleware/swagger.ts`

- 自动扫描 `src/controller/*.ts` 中的 JSDoc 注释
- 生成 Swagger 文档并挂载到路由

## 常用标签

- `@swagger` - 标识这是 Swagger 文档注释
- `summary` - 接口简要描述
- `tags` - 接口分组标签
- `security` - 认证方式 (需要 JWT 的接口)
- `requestBody` - 请求体定义
- `parameters` - 请求参数定义
- `responses` - 响应定义
- `$ref` - 引用预定义的 Schema

## 已完成文档的接口

### User 模块
- ✅ POST /api/user/register - 用户注册
- ✅ POST /api/user/login - 用户登录
- ✅ GET /api/user/get_userinfo - 获取用户信息
- ✅ POST /api/user/edit_userinfo - 编辑用户信息
- ✅ POST /api/user/modify_pass - 修改密码
- ✅ POST /api/user/verify - 验证token
- ✅ POST /api/user/upload/avatar - 上传头像

### Bill 模块
- ✅ GET /api/bill/list - 获取账单列表
- ✅ POST /api/bill/add - 添加账单
- ✅ POST /api/bill/batchAdd - 批量添加账单
- ✅ GET /api/bill/detail - 获取账单详情
- ✅ POST /api/bill/update - 更新账单
- ✅ POST /api/bill/delete - 删除账单
- ✅ GET /api/bill/data - 获取统计数据
- ✅ GET /api/bill/getEarliestItemDate - 查询最早日期
- ✅ GET /api/bill/getMonthList - 查询月份列表
- ✅ GET /api/bill/queyBillByMonthly - 按月查询账单
- ✅ POST /api/bill/import - 导入账单

### Type 模块
- ✅ GET /api/type/list - 获取类型列表
- ✅ GET /api/type/detail - 获取类型详情
- ✅ POST /api/type/add - 添加类型
- ✅ POST /api/type/update - 更新类型
- ✅ POST /api/type/delete - 删除类型

### Books 模块
- ✅ GET /api/books/list - 获取账本列表
- ✅ POST /api/books/add - 添加账本

### Note 模块
- ✅ GET /api/note/list - 获取笔记列表
- ✅ POST /api/note/add - 添加笔记
- ✅ POST /api/note/delete - 删除笔记
- ✅ POST /api/note/update - 更新笔记

### Upload 模块
- ✅ POST /api/upload/upload - 上传文件

## 下一步

所有接口文档已完成！启动项目即可访问。

## 测试

启动项目后访问 http://localhost:7001/api-docs，应该能看到已定义的接口文档。
