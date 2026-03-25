import 'egg';
import { VerifyOptions, VerifyCallback } from 'jsonwebtoken';
import { JwtPayload } from '../src/types';

declare module 'egg' {
  interface Application {
    jwt: {
      sign(
        payload: string | Buffer | object,
        secretOrPrivateKey: string,
        options?: import('jsonwebtoken').SignOptions,
        callback?: import('jsonwebtoken').SignCallback
      ): string;

      verify(
        token: string,
        secretOrPrivateKey: string,
        options?: VerifyOptions,
        callback?: VerifyCallback
      ): JwtPayload;

      decode(token: string): JwtPayload | null;
    };
  }
}
