import { Middleware } from '@tumau/core';
import fse from 'fs-extra';
import { TumauResponse } from 'tumau';

export function HomeRoute(apiDocPath: string): Middleware {
  return () => {
    const docStream = fse.createReadStream(apiDocPath);
    return new TumauResponse({ body: docStream });
  };
}
