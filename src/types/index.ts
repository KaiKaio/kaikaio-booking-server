// 用户相关类型
export interface User {
  id?: number;
  username: string;
  password: string;
  signature?: string;
  avatar?: string;
  user_id?: string;
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

// 账单类型
export interface Bill {
  id?: number;
  user_id: number;
  type_id: number;
  type_name?: string;
  amount: number;
  date: string;
  pay_type: number; // 1: 支出, 2: 收入
  remark?: string;
  client_local_id?: string; // 客户端本地ID
  create_time?: number;
}

// 账单类型
export interface BillType {
  id?: number;
  name: string;
  type: number; // 1: 支出, 2: 收入
  icon?: string;
  user_id: string; // 所属用户ID，0或特定值表示系统预设模板
  is_system?: number; // 是否是系统初始化自带的
  is_delete?: number; // 软删除标识（未删除：0，已删除：1）
}

// 账本类型
export interface Book {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
}

// 笔记类型
export interface Note {
  id?: number;
  user_id: number;
  content: string;
  create_time?: number;
  update_time?: number;
}

// JWT 解码后的用户信息
export interface JwtPayload {
  id: number;
  username: string;
  userid?: number;
  iat?: number;
  exp?: number;
}

// MySQL 查询结果
export interface MysqlResult {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
}
