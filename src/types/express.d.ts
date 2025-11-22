import 'express';

declare module 'express' {
  export interface Request {
    userId?: string;
    cookies?: {
      refresh_token?: string;
      [key: string]: string | undefined;
    };
  }
}
