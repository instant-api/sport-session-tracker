import { AuthConsumer, IsAuthenticatedMiddleware } from '../Authentication';
import { compose, JsonResponse, Middleware } from 'tumau';
import { notNil } from '../Utils';

export function MeRoute(): Middleware {
  return compose(IsAuthenticatedMiddleware(), async (ctx) => {
    const { username, token } = notNil(ctx.getOrFail(AuthConsumer));
    return JsonResponse.withJson({
      username,
      token,
    });
  });
}
