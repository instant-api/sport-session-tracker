import { compose, Middleware } from 'tumau';
import { ZodParamsValidator } from '../ZodValidator';
import * as z from 'zod';

const Params = ZodParamsValidator({}, z.object({}));

export function PlacesRoute(): Middleware {
  return compose(Params.validate, async () => {
    throw new Error('TODO');
  });
}
