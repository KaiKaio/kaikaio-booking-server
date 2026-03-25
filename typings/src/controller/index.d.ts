// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportBill from '../../../src/controller/bill';
import ExportBooks from '../../../src/controller/books';
import ExportNote from '../../../src/controller/note';
import ExportType from '../../../src/controller/type';
import ExportUpload from '../../../src/controller/upload';
import ExportUser from '../../../src/controller/user';

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
