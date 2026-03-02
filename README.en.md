# Kaikaio - Booking Server

Kaikaio Diary backend service, a RESTful API service built on Egg.js.

## 🌟 Project Overview

Kaikaio Booking Server is the backend service for the Kaikaio Diary project, providing API support for core features like users, bills, book lists, and notes.

**Tech Stack:** Egg.js, MySQL, JWT, dayjs

## ✨ Features

- 🔐 **User Authentication** - JWT Token authentication
- 💰 **Bill Management** - Add, edit, delete, query with pagination and type filtering
- 📚 **Book List Management** - CRUD operations for books
- 📝 **Note Management** - CRUD operations for notes
- 🏷️ **Type Management** - CRUD operations for bill types
- 📤 **File Upload** - File upload support
- 📊 **Data Import/Export** - CSV format support

## 🛠 Tech Stack

### Core Framework

- **Egg.js** - Alibaba's enterprise Node.js application framework
- **Koa** - Web framework that powers Egg.js

### Database & Cache

- **MySQL** (egg-mysql) - MySQL database support
- **Redis** (optional) - Cache support (if needed)

### Authentication & Security

- **JWT** (egg-jwt) - JWT Token authentication
- **RSA** - RSA key management (supports environment variables and files)

### Utility Libraries

- **dayjs** - Powerful JavaScript date library
- **csvtojson** - CSV format parsing
- **mkdirp** - Directory creation

### Development Tools

- **ESLint** - Code linting
- **Autod** - Automated testing

## 📁 Project Structure

```
kaikaio-booking-server/
├── app/
│   ├── controller/         # Controller layer - request handling, validation, response
│   │   ├── bill.js         # Bill controller
│   │   ├── books.js        # Book list controller
│   │   ├── note.js         # Note controller
│   │   ├── type.js         # Type controller
│   │   ├── upload.js       # Upload controller
│   │   └── user.js         # User controller
│   ├── service/            # Service layer - business logic
│   │   ├── bill.js
│   │   ├── books.js
│   │   ├── note.js
│   │   ├── type.js
│   │   ├── upload.js
│   │   └── user.js
│   ├── public/             # Static assets
│   └── router.js           # Route definitions
├── config/                # Configuration files
│   ├── config.default.js   # Main configuration
│   └── plugin.js           # Plugin configuration
├── test/                   # Test files
├── .autod.conf.js        # Autod configuration
├── .eslintrc              # ESLint configuration
├── .gitignore
├── Dockerfile              # Docker configuration
├── .travis.yml            # Travis CI configuration
├── appveyor.yml            # AppVeyor CI configuration
├── package.json
├── README.md
```

## 🚀 Quick Start

### Requirements

- Node.js >= 16.0.0
- MySQL 5.7+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file (optional) or configure environment variables:

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

# Application
APP_PORT=7001
```

### Initialize Database

```bash
npm run autod
```

### Start Development Server

```bash
npm run dev
```

The service runs on `http://localhost:7001` by default.

### Other Commands

```bash
npm start        # Start daemon process
npm stop         # Stop daemon process
npm debug        # Debug mode
npm test         # Run tests
npm run cov      # Test coverage
npm run lint      # Lint code
npm run ci        # CI mode (lint + test)
```

## 🔐 Configuration

Main configuration file is `config/config.default.js`, supports:

- JWT key configuration
- MySQL connection configuration
- Application port
- Log level
- CORS settings

## 📡 API Endpoints

The project provides RESTful APIs. All endpoints require JWT Token authentication (except public endpoints).

### User APIs

- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/info` - Get user information

### Bill APIs

- `GET /api/bill/list` - Get bill list (with pagination and filtering)
- `POST /api/bill/create` - Create bill
- `PUT /api/bill/update` - Update bill
- `DELETE /api/bill/delete` - Delete bill

### Book APIs

- `GETGET /api/books/list` - Get book list
- `POST /api/books/create` - Create book
- `PUT /api/books/update` - Update book
- `DELETE /api/books/delete` - Delete book

### Note APIs

- `GET /api/note/list` - Get note list
- `POST /api/note/create` - Create note
- `PUT /api/note/update` - Update note
- `DELETE /api/note/delete` - Delete note

### Type APIs

- `GET /api/type/list` - Get type list
- `POST /api/type/create` - Create type
- `PUT /api/type/update` - Update type
- `DELETE /api/type/delete` - Delete type

### File Upload APIs

- `POST /api/upload/image` - Upload image

## 🔒 Authentication

The project uses JWT (JSON Web Token) for authentication:

1. User login returns JWT Token
2. Subsequent requests must carry the Token in Header:
   ```
   Authorization: Bearer <token>
   ```
3. Token contains user ID, used to identify user identity

## 🧪 Testing

```bash
npm test              # Run tests
npm run cov          # Test coverage
npm run lint         # Lint code
```

## 🐳 Deployment

### Docker Deployment

```bash
# Build image
docker build -t kaikaio-booking-server .

# Run container
docker run -p 7001:7001 --name kaikaio-booking-server kaikaio-booking-server
```

### Environment Variables

Make sure to configure the following environment variables:

- JWT_PUBLIC_KEY
- JWT_SECRET_KEY
- MYSQL_HOST
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_DATABASE

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📄 Development Guidelines

- Use ESLint for code checking
- Follow Egg.js development conventions
- Controller layer handles request processing, validation, and response formatting
- Service layer handles business logic
- All API endpoints require JWT authentication (except login and registration)

## 📝 License

MIT License