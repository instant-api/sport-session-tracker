import * as z from 'zod';
import {
  Middleware,
  createKey,
  JsonParserConsumer,
  UrlParserConsumer,
  HttpError,
  Stack,
} from 'tumau';

export function ZodBodyValidator<T>(schema: z.Schema<T>) {
  const Ctx = createKey<T>({ name: 'ZodBody' });

  const validate: Middleware = async (ctx, next) => {
    const jsonBody = ctx.getOrFail(JsonParserConsumer);
    const parsed = schema.safeParse(jsonBody);
    if (parsed.success === false) {
      const message = parsed.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new HttpError.BadRequest(`Schema validation failed:\n${message}`);
    }
    return next(ctx.with(Ctx.Provider(parsed.data)));
  };

  return {
    validate,
    getValue: (ctx: Stack) => ctx.getOrFail(Ctx.Consumer),
  };
}

export type Validator<Out> = (key: string, val: unknown) => Out;

export function ZodParamsValidator<T>(
  validators: { [K in keyof T]: Validator<any> },
  schema: z.Schema<T>
) {
  const Ctx = createKey<T>({ name: 'ZodParams' });

  const validate: Middleware = async (ctx, next) => {
    const url = ctx.getOrFail(UrlParserConsumer);
    const query = url.query ?? {};
    const raw: any = {};
    const allKeys = new Set([
      ...Object.keys(query),
      ...Object.keys(validators),
    ]);
    allKeys.forEach((key) => {
      const value = query[key];
      const validator = (validators as any)[key];
      if (!validator) {
        throw new HttpError.BadRequest(`Invalid search params ${key}`);
      }
      raw[key] = validator(key, value);
    });
    const parsed = schema.safeParse(raw);
    if (parsed.success === false) {
      const message = parsed.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new HttpError.BadRequest(`Schema validation failed:\n${message}`);
    }
    return next(ctx.with(Ctx.Provider(parsed.data)));
  };

  return {
    validate,
    getValue: (ctx: Stack) => ctx.getOrFail(Ctx.Consumer),
  };
}

function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (key, val) => {
    if (val === undefined || val === null) {
      return undefined;
    }
    return validator(key, val);
  };
}

function arrayValidator<T>(validator: Validator<T>): Validator<Array<T>> {
  return (key, val) => {
    if (Array.isArray(val)) {
      return val.map((v) => validator(key, v));
    }
    try {
      const single = validator(key, val);
      return [single];
    } catch (error) {
      throw new HttpError.BadRequest(
        `Invalid ${key} search param: expecting array`
      );
    }
  };
}

const stringValidator: Validator<string> = (key, val) => {
  if (typeof val !== 'string') {
    throw new HttpError.BadRequest(
      `Invalid ${key} search param: expecting string`
    );
  }
  return val;
};

const intValidator: Validator<number> = (key, val) => {
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    const num = parseInt(val, 10);
    if (Number.isNaN(num)) {
      throw new HttpError.BadRequest(
        `Invalid ${key} search param: expecting number, got NaN`
      );
    }
    return num;
  }
  throw new HttpError.BadRequest(
    `Invalid ${key} search param: expecting number`
  );
};

export const Validators = {
  optional,
  string: stringValidator,
  int: intValidator,
  array: arrayValidator,
};
