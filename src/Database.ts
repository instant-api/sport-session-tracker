import { createContext, Middleware } from 'tumau';
import { knex, Knex } from 'knex';
import { generateInitialData } from './Scafolder';
import * as z from 'zod';

const DatabaseContext = createContext<Knex>({ name: 'Database' });

export const DatabaseConsumer = DatabaseContext.Consumer;

export function DatabaseMiddleware(db: Knex): Middleware {
  return async (ctx, next) => {
    return await next(ctx.with(DatabaseContext.Provider(db)));
  };
}

export function connect(dbFile: string) {
  return knex({
    client: 'sqlite3',
    connection: {
      filename: dbFile,
    },
    useNullAsDefault: true,
    // debug: true,
  });
}

export async function createDatabase(dbFile: string) {
  const db = connect(dbFile);

  await db.schema.createTable('users', (t: Knex.CreateTableBuilder) => {
    t.text('username').primary();
    t.text('token').notNullable();
    t.text('password').notNullable();
    t.text('firstName').notNullable();
    t.text('lastName').notNullable();
    t.integer('age').notNullable();
    t.integer('weight').notNullable();
    t.integer('height').notNullable();
  });

  await db.schema.createTable('places', (t: Knex.CreateTableBuilder) => {
    t.text('slug').primary();
    t.text('name').notNullable();
    t.float('lng').notNullable();
    t.float('lat').notNullable();
    t.text('image');
  });

  await db.schema.createTable('workouts', (t: Knex.CreateTableBuilder) => {
    t.text('id').primary();
    t.text('date').notNullable();
    t.integer('duration').notNullable();
    t.integer('distance').notNullable();
    t.text('user').notNullable();
    t.text('place').notNullable();
  });

  await db.schema.alterTable('workouts', (t: Knex.CreateTableBuilder) => {
    t.foreign('user').references('users.username');
    t.foreign('place').references('places.slug');
  });

  await generateInitialData(db);

  await db.destroy();
}

export interface User {
  username: string;
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  weight: number;
  height: number;
}

export interface Place {
  slug: string;
  name: string;
  lng: number;
  lat: number;
  image: string;
}

export interface Workout {
  id: string;
  date: string;
  duration: number;
  distance: number;
  // links
  user: string;
  place: string;
}

type SafeQuery<Params, Result> = (db: Knex, params: Params) => Promise<Result>;

function createSafeQuery<Params, Result, Out = Result>(
  createQuery: (db: Knex, params: Params) => Promise<any>,
  schema: z.Schema<Result>,
  transform?: (res: Result, params: Params) => Out
): SafeQuery<Params, Out> {
  return async (db, params) => {
    const result = await createQuery(db, params);
    const parsed = schema.parse(result);
    if (transform) {
      return transform(parsed, params);
    }
    return parsed as any;
  };
}

export const findUserByToken = createSafeQuery(
  (db, token: string) => db('users').where('token', token).first(),
  z
    .object({
      username: z.string(),
      token: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .or(z.undefined()),
  (res) => res ?? null
);

export const findUserByUsername = createSafeQuery(
  (db, params: { username: string }) => {
    return db('users')
      .where({
        username: params.username,
      })
      .first('username', 'token', 'password');
  },
  z
    .object({
      username: z.string(),
      token: z.string(),
      password: z.string(),
    })
    .or(z.undefined())
);

export const findPlaceBySlug = createSafeQuery(
  (db, slug: string) => {
    return db('places')
      .where({ slug })
      .first('slug', 'name', 'lng', 'lat', 'image');
  },
  z
    .object({
      slug: z.string(),
      name: z.string(),
      lng: z.number(),
      lat: z.number(),
      image: z.string(),
    })
    .or(z.undefined())
);

// @ts-ignore
function logReturn<T>(val: T): T {
  console.log(val);
  return val;
}

type InsertUserParams = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  weight: number;
  token: string;
  height: number;
};

export const insertUser = createSafeQuery(
  (db, params: InsertUserParams) => {
    return db('users').insert(params);
  },
  z.any(),
  (): void => {}
);

type InsertWorkoutParams = {
  id: string;
  date: string;
  duration: number;
  distance: number;
  user: string;
  place: string;
};

export const insertWorkout = createSafeQuery(
  (db, params: InsertWorkoutParams) => {
    return db('workouts').insert(params);
  },
  z.any(),
  (): void => {}
);

type WorkoutFilters = {
  places?: Array<string> | null;
  users?: Array<string> | null;
};

type GetWorkoutsOptions = WorkoutFilters & {
  order?: 'asc' | 'desc' | null;
  offset?: number | null;
  limit?: number | null;
  sort?: null | 'date' | 'place' | 'user' | 'distance' | 'duration' | 'speed';
};

export const getWorkouts = createSafeQuery(
  (db, params: GetWorkoutsOptions) => {
    let query = db.select(
      'workouts.*',
      'users.firstName',
      'users.lastName',
      db.ref('places.name').as('placeName'),
      db.raw('(?? / ??) * 0.06 as ??', [
        'workouts.distance',
        'workouts.duration',
        'speed',
      ])
    );
    const places = params.places;
    if (places && places.length > 0) {
      query = query.whereIn('workouts.place', places);
    }
    const users = params.users;
    if (users && users.length > 0) {
      query = query.whereIn('workouts.user', users);
    }
    const sort = params.sort ?? 'date';
    let order = params.order ?? 'asc';
    if (sort === 'date') {
      order = order === 'asc' ? 'desc' : 'asc';
    }
    query = query.orderBy(
      sort === 'speed' ? 'speed' : `workouts.${sort}`,
      order
    );
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 10;
    query = query.offset(offset).limit(limit);
    query.from('workouts');
    query = query.leftJoin('users', 'workouts.user', 'users.username');
    query = query.leftJoin('places', 'workouts.place', 'places.slug');
    return query;
  },
  z.array(
    z
      .object({
        id: z.string(),
        date: z.string(),
        duration: z.number(),
        distance: z.number(),
        user: z.string(),
        place: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        placeName: z.string(),
        speed: z.number(),
      })
      .strict()
  )
  // logReturn
);

export const countWorkouts = createSafeQuery(
  async (db, params: WorkoutFilters) => {
    let query = db('workouts');
    const places = params.places;
    if (places && places.length > 0) {
      query = query.whereIn('workouts.place', places);
    }
    const users = params.users;
    if (users && users.length > 0) {
      query = query.whereIn('workouts.user', users);
    }
    const res = await query.count().first();
    if (!res) {
      return 0;
    }
    return res['count(*)'];
  },
  z.number()
);
