import { ROUTES } from '../routes';
import {
  compose,
  HttpError,
  JsonResponse,
  Middleware,
  RouterConsumer,
} from 'tumau';
import { DatabaseConsumer, findPlaceBySlug } from '../Database';

export function PlaceRoute(): Middleware {
  return compose(async (ctx) => {
    const { slug } = ctx.getOrFail(RouterConsumer).getOrFail(ROUTES.place);
    const db = ctx.getOrFail(DatabaseConsumer);
    const place = await findPlaceBySlug(db, slug);
    if (!place) {
      throw new HttpError.NotFound();
    }
    return JsonResponse.withJson({
      ...place,
    });
  });
}
