import { createKey, HttpError, Middleware, RequestConsumer } from 'tumau';
import { findUserByToken, DatabaseConsumer } from './Database';

export type User = {
  username: string;
  token: string;
  firstName: string;
  lastName: string;
};

const AuthContext = createKey<User | null>({
  name: 'Auth',
  defaultValue: null,
});

export const AuthConsumer = AuthContext.Consumer;

export function AuthMiddleware(): Middleware {
  return async (ctx, next) => {
    const request = ctx.getOrFail(RequestConsumer);
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return next(ctx);
    }
    const [type, token, ...other] = authHeader.split(' ');
    if (type !== 'Bearer' || other.length > 0 || !token) {
      throw new HttpError.Unauthorized(`Invalid Authorization header`);
    }
    const db = ctx.getOrFail(DatabaseConsumer);
    const user = await findUserByToken(db, token);
    if (!user) {
      throw new HttpError.Unauthorized(`Invalid token`);
    }
    return next(ctx.with(AuthContext.Provider(user)));
  };
}

export function IsAuthenticatedMiddleware(): Middleware {
  return async (ctx, next) => {
    const user = ctx.getOrFail(AuthConsumer);
    if (user === null) {
      throw new HttpError.Unauthorized();
    }
    return next(ctx);
  };
}
