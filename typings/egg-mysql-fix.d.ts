import 'egg';
import { UpdateResult } from '@eggjs/rds';

declare module 'egg' {
  interface Application {
    mysql: {
      update(
        table: string,
        row: object,
        option?: {
          where?: object;
          columns?: string[];
          id?: number;
          user_id?: number;
          [key: string]: any;
        }
      ): Promise<UpdateResult>;
    } & import('@eggjs/rds').RDSClient;
  }
}
