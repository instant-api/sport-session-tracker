import { AuthConsumer } from '../Authentication';
import { compose, JsonResponse, Middleware } from 'tumau';
import { notNil } from '../Utils';

export function MeRoute(): Middleware {
  return compose(async (ctx) => {
    const { username, token, firstName, lastName } = notNil(
      ctx.getOrFail(AuthConsumer)
    );
    return JsonResponse.withJson({
      username,
      token,
      firstName,
      lastName,
    });
  });
}
