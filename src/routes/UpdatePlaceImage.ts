import {
  compose,
  HttpError,
  Middleware,
  RequestConsumer,
  RouterConsumer,
  TumauResponse,
} from 'tumau';
import { ROUTES } from '../routes';
import Busboy from 'busboy';

const NOT_IMPLEMENTED = true;

export function UpdatePlaceImageRoute(): Middleware {
  return compose(async (ctx) => {
    if (NOT_IMPLEMENTED) {
      throw new HttpError.Internal(`Not Implemented yet`);
    }

    return new Promise((resolve, _reject) => {
      const { slug } = ctx
        .getOrFail(RouterConsumer)
        .getOrFail(ROUTES.updatePlaceImage);

      console.log({ slug });

      const request = ctx.get(RequestConsumer);
      const busboy = new Busboy({ headers: request.headers });

      busboy.on(
        'file',
        function (fieldname, file, _filename, _encoding, _mimetype) {
          if (fieldname !== 'image') {
            file.resume();
          }
          // console.log({
          //   fieldname,
          //   file,
          //   filename,
          //   encoding,
          //   mimetype,
          // });
          file.resume();
        }
      );
      busboy.on('finish', function () {
        resolve(TumauResponse.noContent());
      });
      request.req.pipe(busboy);
    });
  });
}
