import { compose, HttpError, JsonResponse, Middleware } from 'tumau';
import { ZodBodyValidator } from '../ZodValidator';
import { DatabaseConsumer, findPlaceBySlug, insertPlace } from '../Database';
import * as z from 'zod';

const Body = ZodBodyValidator(
  z.object({
    name: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    lng: z.number(),
    lat: z.number(),
  })
);

export function CreatePlaceRoute(): Middleware {
  return compose(Body.validate, async (ctx) => {
    const { name, slug, lat, lng } = Body.getValue(ctx);
    const db = ctx.getOrFail(DatabaseConsumer);
    const placeExist = await findPlaceBySlug(db, slug);
    console.log(placeExist);

    if (placeExist) {
      throw new HttpError.BadRequest(`Place slug already exist`);
    }
    await insertPlace(db, { name, slug, lat, lng });
    return JsonResponse.withJson({
      slug,
    });
  });
}
