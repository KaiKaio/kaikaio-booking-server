// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportApiLogger from '../../../src/middleware/apiLogger';
import ExportJwtErr from '../../../src/middleware/jwtErr';

declare module 'egg' {
  interface IMiddleware {
    apiLogger: typeof ExportApiLogger;
    jwtErr: typeof ExportJwtErr;
  }
}
