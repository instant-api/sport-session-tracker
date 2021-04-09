import { IsAuthenticatedMiddleware, AuthConsumer } from '../Authentication';
import { DatabaseConsumer, findPlaceBySlug, insertWorkout } from '../Database';
import { compose, HttpError, JsonResponse, Middleware } from 'tumau';
import { notNil, ZodDateISOStringPast } from '../Utils';
import { ZodBodyValidator } from '../ZodValidator';
import * as z from 'zod';
import { slug as createSlug } from 'cuid';

const Body = ZodBodyValidator(
  z.object({
    date: ZodDateISOStringPast,
    duration: z.number().int().positive(),
    distance: z.number().int().positive(),
    // links
    place: z.string(),
  })
);

export function CreateWorkoutRoute(): Middleware {
  return compose(IsAuthenticatedMiddleware(), Body.validate, async (ctx) => {
    const { place, date, distance, duration } = Body.getValue(ctx);
    const user = notNil(ctx.getOrFail(AuthConsumer));
    const db = ctx.getOrFail(DatabaseConsumer);
    const placeExist = findPlaceBySlug(db, place);
    if (!placeExist) {
      throw new HttpError.BadRequest(`Place does not exist`);
    }

    const id = createSlug();

    await insertWorkout(db, {
      id,
      user: user.username,
      place,
      distance,
      duration,
      date,
    });
    return JsonResponse.withJson({
      id,
    });
  });
}
