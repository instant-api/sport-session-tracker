import { compose, JsonResponse, Middleware } from 'tumau';
import { Validators, ZodParamsValidator } from '../ZodValidator';
import * as z from 'zod';
import { countWorkouts, DatabaseConsumer, getWorkouts } from '../Database';

const Params = ZodParamsValidator(
  {
    offset: Validators.optional(Validators.int),
    limit: Validators.optional(Validators.int),
    places: Validators.optional(Validators.array(Validators.string)),
    users: Validators.optional(Validators.array(Validators.string)),
    order: Validators.optional(Validators.string),
    sort: Validators.optional(Validators.string),
  },
  z.object({
    offset: z.number().min(0).optional(),
    limit: z.number().positive().min(1).max(100).optional(),
    places: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    sort: z
      .enum(['date', 'place', 'user', 'distance', 'duration', 'speed'])
      .optional(),
  })
);

export function WorkoutsRoute(): Middleware {
  return compose(Params.validate, async (ctx) => {
    const params = Params.getValue(ctx);
    const db = ctx.getOrFail(DatabaseConsumer);
    const [result, count] = await Promise.all([
      getWorkouts(db, {
        limit: params.limit,
        offset: params.offset,
        order: params.order,
        sort: params.sort,
        places: params.places,
        users: params.users,
      }),
      countWorkouts(db, {
        places: params.places,
        users: params.users,
      }),
    ]);
    return JsonResponse.withJson({
      results: result.map(
        ({
          id,
          date,
          place,
          distance,
          duration,
          user,
          firstName,
          lastName,
          placeName,
          speed,
        }) => {
          return {
            id,
            date,
            place,
            distance,
            duration,
            user,
            placeName,
            speed,
            userName: `${firstName} ${lastName}`,
          };
        }
      ),
      total: count,
    });
  });
}
