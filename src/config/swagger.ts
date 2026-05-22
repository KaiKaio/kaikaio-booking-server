// import { Application } from 'egg';

export interface SwaggerOptions {
  definition: {
    openapi: string;
    info: {
      title: string;
      version: string;
      description?: string;
    };
    servers?: Array<{
      url: string;
      description?: string;
    }>;
    components?: {
      securitySchemes?: {
        [key: string]: any;
      };
      schemas?: {
        [key: string]: any;
      };
    };
  };
  apis: string[];
}

// export default (app: Application): SwaggerOptions => {
export default (): SwaggerOptions => {
  const config: SwaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Kaikaio Booking API',
        version: '1.1.0',
        description: 'Kaikaio-Booking 服务端 API 文档',
      },
      servers: [
        {
          url: 'http://localhost:7009',
          description: '开发环境',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          ApiResponse: {
            type: 'object',
            properties: {
              code: { type: 'integer', example: 200 },
              msg: { type: 'string', example: 'success' },
              data: { type: 'object' },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              signature: { type: 'string' },
              avatar: { type: 'string' },
              user_id: { type: 'string' },
            },
          },
          Bill: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              user_id: { type: 'integer' },
              type_id: { type: 'integer' },
              type_name: { type: 'string' },
              amount: { type: 'number' },
              date: { type: 'string', format: 'date-time' },
              pay_type: { type: 'integer', enum: [ 1, 2 ], description: '1: 支出, 2: 收入' },
              remark: { type: 'string' },
            },
          },
          BillType: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              type: { type: 'integer', enum: [ 1, 2 ] },
              icon: { type: 'string' },
              user_id: { type: 'string' },
            },
          },
        },
      },
    },
    apis: [
      './src/controller/*.ts',
      './app/controller/*.js',
    ],
  };

  return config;
};
