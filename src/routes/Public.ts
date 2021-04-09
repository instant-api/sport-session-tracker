import { ROUTES } from '../routes';
import {
  compose,
  HttpError,
  Middleware,
  RouterConsumer,
  TumauResponse,
} from 'tumau';
import fse from 'fs-extra';
import * as path from 'path';

export function PublicRoute(publicPath: string): Middleware {
  return compose(async (ctx) => {
    const routerCtx = ctx.getOrFail(RouterConsumer);
    const params = routerCtx.getOrFail(ROUTES.public);
    const finalPath = path.resolve(publicPath, params.path.join('/'));
    if (!fse.existsSync(finalPath)) {
      throw new HttpError.NotFound();
    }
    const stats = await fse.stat(finalPath);
    if (stats.isDirectory()) {
      throw new HttpError.NotFound();
    }
    const stream = fse.createReadStream(finalPath);
    return new TumauResponse({ body: stream });
  });
}
