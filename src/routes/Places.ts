import { compose, JsonResponse, Middleware } from 'tumau';
import { Validators, ZodParamsValidator } from '../ZodValidator';
import { countPlaces, DatabaseConsumer, getPlaces } from '../Database';
import * as z from 'zod';

const Params = ZodParamsValidator(
  {
    offset: Validators.optional(Validators.int),
    limit: Validators.optional(Validators.int),
  },
  z.object({
    offset: z.number().min(0).optional(),
    limit: z.number().positive().min(1).max(100).optional(),
  })
);

export function PlacesRoute(): Middleware {
  return compose(Params.validate, async (ctx) => {
    const params = Params.getValue(ctx);
    const db = ctx.getOrFail(DatabaseConsumer);
    const [result, count] = await Promise.all([
      getPlaces(db, { limit: params.limit, offset: params.offset }),
      countPlaces(db, null),
    ]);

    return JsonResponse.withJson({
      results: result.map(({ image, name, slug, workoutCount }) => {
        return {
          image,
          name,
          slug,
          workoutCount,
        };
      }),
      total: count,
    });
  });
}
