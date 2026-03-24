// 修复 egg-mock/bootstrap.d.ts 中 assert 类型问题
// 原文件使用 import * as assert from 'assert' 导致命名空间导入不可调用

declare module 'egg-mock/bootstrap' {
  import { MockApplication, EggMock } from 'egg-mock';

  // 使用 power-assert 的函数签名
  function assert(value: unknown, message?: string): void;
  namespace assert {
    class AssertionError implements Error {
      name: string;
      message: string;
      actual: unknown;
      expected: unknown;
      operator: string;
      generatedMessage: boolean;
      constructor(options?: {
        message?: string | undefined;
        actual?: unknown;
        expected?: unknown;
        operator?: string | undefined;
        stackStartFunction?: () => void | undefined;
      });
    }
    function fail(actual?: unknown, expected?: unknown, message?: string, operator?: string): never;
    function ok(value: unknown, message?: string): void;
    function equal(actual: unknown, expected: unknown, message?: string): void;
    function notEqual(actual: unknown, expected: unknown, message?: string): void;
    function deepEqual(actual: unknown, expected: unknown, message?: string): void;
    function notDeepEqual(actual: unknown, expected: unknown, message?: string): void;
    function strictEqual(actual: unknown, expected: unknown, message?: string): void;
    function notStrictEqual(actual: unknown, expected: unknown, message?: string): void;
    function deepStrictEqual(actual: unknown, expected: unknown, message?: string): void;
    function notDeepStrictEqual(actual: unknown, expected: unknown, message?: string): void;
    const throws: {
      (block: () => unknown, message?: string): void;
      (block: () => unknown, error: (new() => object) | RegExp | ((err: unknown) => boolean), message?: string): void;
    };
    const doesNotThrow: {
      (block: () => unknown, message?: string): void;
      (block: () => unknown, error: (new() => object) | RegExp | ((err: any) => boolean), message?: string): void;
    };
    function ifError(value: unknown): void | undefined;
    const strict: typeof assert;
  }

  export { assert };
  export const app: MockApplication;
  export const mock: EggMock;
  export const mm: EggMock;
}
