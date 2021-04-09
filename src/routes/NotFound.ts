import { HttpError, Middleware } from 'tumau';

export function NotFoundRoute(): Middleware {
  return () => {
    throw new HttpError.NotFound();
  };
}
