// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportJwtErr = require('../../../app/middleware/jwtErr');

declare module 'egg' {
  interface IMiddleware {
    jwtErr: typeof ExportJwtErr;
  }
}
