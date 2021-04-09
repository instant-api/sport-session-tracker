import * as z from 'zod';
import { parseISO, isValid, isPast } from 'date-fns';
import { Route } from '@tumau/router';
import { Middleware, Routes } from 'tumau';

export function routeGroup(
  middleware: Middleware | Array<Middleware> | null,
  children?: Routes
): Route {
  return Route.create({ exact: false }, middleware, children);
}

export function notNil<T>(val: T | null | undefined): T {
  if (val === null || val === undefined) {
    throw new Error('Unexpected nil value');
  }
  return val;
}

export function wait(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function waitRandom(min: number, max: number) {
  const duration = min + Math.floor(Math.random() * (max - min));
  return wait(duration);
}

export const ZodDateISOString = z.string().refine((val) => {
  const parsed = parseISO(val);
  return isValid(parsed);
});

export const ZodDateISOStringPast = ZodDateISOString.refine((val) => {
  const parsed = parseISO(val);
  return isPast(parsed);
}, 'Date must be in the past !');
