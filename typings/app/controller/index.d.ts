// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportBill from '../../../app/controller/bill';
import ExportBooks from '../../../app/controller/books';
import ExportNote from '../../../app/controller/note';
import ExportType from '../../../app/controller/type';
import ExportUpload from '../../../app/controller/upload';
import ExportUser from '../../../app/controller/user';

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
