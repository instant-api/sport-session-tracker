import { DatabaseConsumer, findUserByUsername } from '../Database';
import { compose, HttpError, JsonResponse, Middleware } from 'tumau';
import * as z from 'zod';
import { ZodBodyValidator } from '../ZodValidator';
import { compare } from 'bcrypt';

const Body = ZodBodyValidator(
  z.object({ username: z.string(), password: z.string() })
);

export function LoginRoute(): Middleware {
  return compose(Body.validate, async (ctx) => {
    const { username, password } = Body.getValue(ctx);
    const data = ctx.getOrFail(DatabaseConsumer);
    const user = await findUserByUsername(data, { username });
    let valid = false;
    if (user) {
      valid = await compare(password, user.password);
    }
    if (!valid || !user) {
      throw new HttpError.Unauthorized(`Wrong username/password`);
    }
    return JsonResponse.withJson({ token: user.token });
  });
}
