import {
  createServer as createTumauServer,
  compose,
  RouterPackage,
  Route,
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
} from 'tumau';
import { DatabaseMiddleware } from './Database';
import { AuthMiddleware } from './Authentication';
import { ROUTES } from './routes';
import { routeGroup, waitRandom } from './Utils';
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
import { Knex } from 'knex';

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
      console.error(error);
      throw error;
    }
  };

  const server = createTumauServer({
    mainMiddleware: compose(
      CorsPreflight(),
      CorsActual(),
      HttpErrorToTextResponse,
      ErrorToHttpError,
      LogErrors,
      InvalidResponseToHttpError,
      DatabaseMiddleware(db),
      WaitMiddleware,
      AuthMiddleware(),
      RouterPackage([
        Route.GET(ROUTES.public, PublicRoute(publicPath)),
        Route.GET(ROUTES.home, HomeRoute(apiDocPath)),
        routeGroup(
          compose(
            HttpErrorToJsonResponse,
            ErrorToHttpError,
            LogErrors,
            InvalidResponseToHttpError,
            StringBodyParser(),
            JsonParser()
          ),
          [
            routeGroup(null, [
              Route.GET(ROUTES.me, MeRoute()),
              Route.POST(ROUTES.signup, SignupRoute()),
              Route.POST(ROUTES.login, LoginRoute()),
              Route.GET(ROUTES.workouts, WorkoutsRoute()),
              Route.POST(ROUTES.createWorkout, CreateWorkoutRoute()),
              Route.GET(ROUTES.places, PlacesRoute()),
              Route.GET(ROUTES.place, PlaceRoute()),
            ]),
            Route.fallback(NotFoundRoute()),
          ]
        ),
      ])
    ),
  });

  return server;
}
