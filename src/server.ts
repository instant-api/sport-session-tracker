import { Knex } from 'knex';
import {
  createServer as createTumauServer,
  compose,
  Router,
  Route,
  UrlParser,
  InvalidResponseToHttpError,
  TumauServer,
  ErrorToHttpError,
  JsonParser,
  Middleware,
  HttpErrorToJsonResponse,
  CorsPreflight,
  CorsActual,
  StringBodyParser,
  HttpErrorToTextResponse,
  HttpError,
} from 'tumau';
import { DatabaseMiddleware } from './Database';
import { AuthMiddleware, IsAuthenticatedMiddleware } from './Authentication';
import { ROUTES } from './routes';
import { waitRandom } from './Utils';
import { HomeRoute } from './routes/Home';
import { MeRoute } from './routes/Me';
import { SignupRoute } from './routes/Signup';
import { LoginRoute } from './routes/Login';
import { WorkoutsRoute } from './routes/Workouts';
import { CreateWorkoutRoute } from './routes/CreateWorkout';
import { PublicRoute } from './routes/Public';
import { NotFoundRoute } from './routes/NotFound';
import { PlacesRoute } from './routes/Places';
import { PlaceRoute } from './routes/Place';
import { CreatePlaceRoute } from './routes/CreatePlace';
import { UpdatePlaceImageRoute } from './routes/UpdatePlaceImage';

export type Options = {
  db: Knex;
  apiDocPath: string;
  publicPath: string;
  slowMode: boolean;
};

export function createServer({
  db,
  apiDocPath,
  publicPath,
  slowMode,
}: Options): TumauServer {
  const WaitMiddleware: Middleware = async (ctx, next) => {
    if (slowMode) {
      await waitRandom(1000, 2000);
      return next(ctx);
    }
    return next(ctx);
  };

  const LogErrors: Middleware = async (ctx, next) => {
    try {
      const res = await next(ctx);
      return res;
    } catch (error) {
      if (error instanceof HttpError.NotFound) {
        // dont log 404
      } else {
        console.error(error);
      }
      throw error;
    }
  };

  const server = createTumauServer({
    mainMiddleware: compose(
      CorsPreflight(),
      CorsActual(),
      HttpErrorToTextResponse,
      ErrorToHttpError({ logOnError: false }),
      LogErrors,
      UrlParser(),
      InvalidResponseToHttpError,
      DatabaseMiddleware(db),
      WaitMiddleware,
      AuthMiddleware(),
      Router([
        Route.GET(ROUTES.public, PublicRoute(publicPath)),
        Route.GET(ROUTES.home, HomeRoute(apiDocPath)),
        ...Route.group(
          compose(
            HttpErrorToJsonResponse,
            ErrorToHttpError({ logOnError: false }),
            LogErrors,
            InvalidResponseToHttpError,
            StringBodyParser(),
            JsonParser()
          ),
          [
            Route.GET(ROUTES.workouts, WorkoutsRoute()),
            Route.GET(ROUTES.places, PlacesRoute()),
            Route.GET(ROUTES.place, PlaceRoute()),
            Route.POST(ROUTES.signup, SignupRoute()),
            Route.POST(ROUTES.login, LoginRoute()),
            ...Route.group(IsAuthenticatedMiddleware(), [
              Route.GET(ROUTES.me, MeRoute()),
              Route.POST(ROUTES.createWorkout, CreateWorkoutRoute()),
              Route.POST(ROUTES.createPlace, CreatePlaceRoute()),
              Route.POST(ROUTES.updatePlaceImage, UpdatePlaceImageRoute()),
            ]),
            Route.fallback(NotFoundRoute()),
          ]
        ),
      ])
    ),
  });

  return server;
}
