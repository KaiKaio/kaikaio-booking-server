// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportBill = require('../../../app/controller/bill');
import ExportBooks = require('../../../app/controller/books');
import ExportNote = require('../../../app/controller/note');
import ExportType = require('../../../app/controller/type');
import ExportUpload = require('../../../app/controller/upload');
import ExportUser = require('../../../app/controller/user');

declare module 'egg' {
  interface IController {
    bill: ExportBill;
    books: ExportBooks;
    note: ExportNote;
    type: ExportType;
    upload: ExportUpload;
    user: ExportUser;
  }
}
