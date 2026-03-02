# Kaikaio - Booking Server

> 📖 [English](README.en.md)

Kaikaio-Booking 服务端项目，基于 Egg.js 框架构建的 RESTful API 服务。

## 🌟 项目简介

Kaikaio Booking Server 是 Kaikaio-Booking 项目的后端服务，提供用户、账单、书单、笔记等核心功能的 API 支持。

**技术栈：** Egg.js、MySQL、JWT、dayjs

## ✨ 功能特性

- 🔐 **用户认证** - JWT Token 认证
- 💰 **账单管理** - 增删改查、分页、类型过滤
- 📚 **书单管理** - 书本 CRUD 操作
- 📝 **笔记管理** - 笔记 CRUD 操作
- 🏷️ **类型管理** - 账别类型 CRUD 操作
- 📤 **文件上传** - 支持文件上传
- 📊 **数据导入导出** - CSV 格式支持

## 🛠 技术栈

### 核心框架

- **Egg.js** - 阿里巴巴企业级 Node.js 应用框架
- **Koa** - Egg.js 底层的 Web 框架

### 数据库 & 缓存

- **MySQL** (egg-mysql) - MySQL 数据库支持
- **Redis** (可选) - 缓存支持（如需要）

### 认证与安全

- **JWT** (egg-jwt) - JWT Token 认证
- **RSA** - RSA 密钥管理（支持环境变量和文件）

### 工具库

- **dayjs** - 强大的 JavaScript 日期处理库
- **csvtojson** - CSV 格式解析
- **mkdirp** - 目录创建

### 开发工具

- **ESLint** - 代码规范检查
- **Autod** - 自动化测试

## 📁 项目结构

```
kaikaio-booking-server/
├── app/
│   ├── controller/         # 控制器层 - 请求处理、验证、响应
│   │   ├── bill.js         # 账单控制器
│   │   ├── books.js        # 书单控制器
│   │   ├── note.js         # 笔记控制器
│   │   ├── type.js         # 类型控制器
│   │   ├── upload.js       # 上传控制器
│   │   └── user.js         # 用户控制器
│   ├── service/            # 服务层 - 业务逻辑
│   │   ├── bill.js
│   │   ├── books.js
│   │   ├── note.js
│   │   ├── type.js
│   │   ├── upload.js
│   │   └── user.js
│   ├── public/             # 静态资源
│   └── router.js           # 路由定义
├── config/                # 配置文件
│   ├── config.default.js   # 主配置
│   └── plugin.js           # 插件配置
├── test/                   # 测试文件
├── .autod.conf.js        # Autod 配置
├── .eslintrc              # ESLint 配置
├── .gitignore
├── Dockerfile              # Docker 配置
├── .travis.yml            # Travis CI 配置
├── appveyor.yml            # AppVeyor CI 配置
├── package.json
├── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL 5.7+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件（可选）或配置环境变量：

```bash
# JWT
JWT_PUBLIC_KEY=your_public_key_here
JWT_SECRET_KEY=your_secret_key_here

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=kaikaio_booking

# 应用
APP_PORT=7001
```

### 初始化数据库

```bash
npm run autod
```

### 启动开发服务器

```bash
npm run dev
```

服务默认运行在 `http://localhost:7001`

### 其他命令

```bash
npm start        # 启动守护进程
npm stop         # 停止守护进程
npm debug        # 调试模式
npm test         # 运行测试
npm run cov      # 测试覆盖率
npm run lint      # 代码检查
npm run ci        # CI 模式（lint + test）
```

## 🔐 配置说明

主配置文件位于 `config/config.default.js`，支持：

- JWT 密钥配置
- MySQL 连接配置
- 应用端口
- 日志级别
- CORS 设置

## 📡 API 接口

项目提供 RESTful API，所有接口都需要 JWT Token 认证（部分公开接口除外）。

### 用户相关

- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `GET /api/user/info` - 获取用户信息

### 账单相关

- `GET /api/bill/list` - 获取账单列表（分页、过滤）
- `POST /api/bill/create` - 创建账单
- `PUT /api/bill/update` - 更新账单
- `DELETE /api/bill/delete` - 删除账单

### 书单相关

- `GET /api/books/list` - 获取书单列表
- `POST /api/books/create` - 创建书单
- `PUT /api/books/update` - 更新书单
- `DELETE /api/books/delete` - 删除书单

### 笔记相关

- `GET /api/note/list` - 获取笔记列表
- `POST /api/note/create` - 创建笔记
- `PUT /api/note/update` - 更新笔记
- `DELETE /api/note/delete` - 删除笔记

### 类型相关

- `GET /api/type/list` - 获取类型列表
- `POST /api/type/create` - 创建类型
- `PUT /api/type/update` - 更新类型
- `DELETE /api/type/delete` - 删除类型

### 文件上传

- `POST /api/upload/image` - 上传图片

## 🔒 认证说明

项目使用 JWT (JSON Web Token) 进行认证：

1. 用户登录后返回 JWT Token
2. 后续请求需要在 Header 中携带 Token：
   ```
   Authorization: Bearer <token>
   ```
3. Token 包含用户 ID，用于识别用户身份

## 🧪 测试

```bash
npm test              # 运行测试
npm run cov          # 测试覆盖率
npm run lint         #   代码检查
```

## 🐳 部署

### Docker 部署

```bash
# 构建镜像
docker build -t kaikaio-booking-server .

# 运行容器
docker run -p 7001:7001 --name kaikaio-booking-server kaikaio-booking-server
```

### 环境变量

确保配置了以下环境变量：

- JWT_PUBLIC_KEY
- JWT_SECRET_KEY
- MYSQL_HOST
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_DATABASE

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开发规范

- 使用 ESLint 进行代码检查
- 遵循 Egg.js 开发规范
- 控制器层负责请求处理、验证、响应格式化
- 服务层负责业务逻辑
- 所有 API 接口需要 JWT 认证（除登录注册外）

## 📝 许可证

MIT License