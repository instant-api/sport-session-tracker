import { ZodBodyValidator } from '../ZodValidator';
import * as z from 'zod';
import { compose, HttpError, JsonResponse, Middleware } from 'tumau';
import { AuthConsumer } from '../Authentication';
import { DatabaseConsumer, findUserByUsername, insertUser } from '../Database';
import { hash } from 'bcrypt';
import { uid } from 'uid/secure';

const Body = ZodBodyValidator(
  z.object({
    username: z
      .string()
      .min(3)
      .regex(
        /[a-z0-9_-]+/,
        'Must only contains lowercase letter, digit, "-" and "_"'
      ),
    password: z.string().min(6),
    firstName: z.string().nonempty('First name is required'),
    lastName: z.string().nonempty('Last name is required'),
    age: z.number().positive().max(120, "You're too old for this s**t !"),
    weight: z.number().min(1).max(500),
    height: z.number().min(10).max(300),
  })
);

export function SignupRoute(): Middleware {
  return compose(Body.validate, async (ctx) => {
    const user = ctx.getOrFail(AuthConsumer);
    if (user) {
      throw new HttpError.Forbidden(`You need to logout to be able to signup`);
    }
    const {
      username,
      password,
      age,
      firstName,
      height,
      lastName,
      weight,
    } = Body.getValue(ctx);
    const db = ctx.getOrFail(DatabaseConsumer);
    const alreadyExist = await findUserByUsername(db, { username });
    if (alreadyExist) {
      throw new HttpError.BadRequest(`Username is already taken`);
    }
    const hashed = await hash(password, 10);
    const token = uid(22);
    await insertUser(db, {
      username,
      password: hashed,
      age,
      token,
      firstName,
      height,
      lastName,
      weight,
    });
    return JsonResponse.withJson({ token });
  });
}
