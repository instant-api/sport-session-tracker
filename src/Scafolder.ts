import { slug as createSlug } from 'cuid';
import { Place, User, Workout } from './Database';
import faker from '@faker-js/faker/locale/fr';
import random from 'random';
import { hash } from 'bcrypt';
import { uid } from 'uid/secure';
import {
  addDays,
  getDay,
  isAfter,
  isWeekend,
  subDays,
  set as dateSet,
} from 'date-fns';
import { Knex } from 'knex';

export async function generateInitialData(db: Knex): Promise<void> {
  const places: Array<Place> = [
    {
      name: 'Parc de la Feyssine',
      slug: 'parc-de-la-feyssine',
      lat: 45.788923,
      lng: 4.879732,
      image: '/places/parc-de-la-feyssine.jpg',
    },
    {
      name: 'Parc de Montjuzet',
      slug: 'parc-de-montjuzet',
      lat: 45.788811,
      lng: 3.073575,
      image: '/places/parc-de-montjuzet.jpg',
    },
    {
      name: "Parc de la Tête d'or",
      slug: 'parc-de-la-tete-dor',
      lat: 45.7806,
      lng: 4.85417,
      image: '/places/parc-de-la-tete-dor.jpg',
    },
    {
      name: 'Parc des Buttes-Chaumont',
      slug: 'parc-des-buttes-chaumont',
      lat: 48.88111,
      lng: 2.38306,
      image: '/places/parc-des-buttes-chaumont.jpg',
    },
    {
      name: 'Bois de Vincennes',
      slug: 'bois-de-vincennes',
      lat: 48.83,
      lng: 2.4333,
      image: '/places/bois-de-vincennes.jpg',
    },
    {
      name: 'Bois de Boulogne',
      slug: 'bois-de-boulogne',
      lat: 48.863472611,
      lng: 2.252197306,
      image: '/places/bois-de-boulogne.jpg',
    },
    {
      name: 'Parc Borély',
      slug: 'parc-borely',
      lat: 43.260394,
      lng: 5.382249,
      image: '/places/parc-borely.jpg',
    },
    {
      name: 'Parc de Belleville',
      slug: 'parc-de-belleville',
      lat: 48.870833,
      lng: 2.384722,
      image: '/places/parc-de-belleville.jpg',
    },
    {
      name: 'Champ-de-Mars (Paris)',
      slug: 'champ-de-mars-paris',
      lat: 48.856111,
      lng: 2.298333,
      image: '/places/champ-de-mars-paris.jpg',
    },
    {
      name: 'Parc de la Villette',
      slug: 'parc-de-la-villette',
      lat: 48.893056,
      lng: 2.390833,
      image: '/places/parc-de-la-villette.jpg',
    },
    {
      name: 'Parc de Bercy',
      slug: 'parc-de-bercy',
      lat: 48.833889,
      lng: 2.384167,
      image: '/places/parc-de-bercy.jpg',
    },
    {
      name: 'Parc bordelais',
      slug: 'parc-bordelais',
      lat: 44.852872,
      lng: -0.602381,
      image: '/places/parc-bordelais.jpg',
    },
    {
      name: 'Parc Barbieux',
      slug: 'parc-barbieux',
      lat: 50.67767778,
      lng: 3.163294444,
      image: '/places/parc-barbieux.jpg',
    },
    {
      name: 'Parc du Grand-Blottereau',
      slug: 'parc-du-grand-blottereau',
      lat: 47.2281,
      lng: -1.508549,
      image: '/places/parc-du-grand-blottereau.jpg',
    },
    {
      name: 'Parc de la Citadelle (Strasbourg)',
      slug: 'parc-de-la-citadelle-strasbourg',
      lat: 48.57556,
      lng: 7.77472,
      image: '/places/parc-de-la-citadelle-strasbourg.jpg',
    },
    {
      name: 'Jardin des Plantes (Toulouse)',
      slug: 'jardin-des-plantes-toulouse',
      lat: 43.5929,
      lng: 1.4511,
      image: '/places/jardin-des-plantes-toulouse.jpg',
    },
    {
      name: 'Parc de Majolan',
      slug: 'parc-de-majolan',
      lat: 44.9,
      lng: -0.644722,
      image: '/places/parc-de-majolan.jpg',
    },
  ];

  await db('places').insert(places);

  const usersArr = Array.from({ length: 100 })
    .fill(null)
    .map((_, i) => i);

  const users: Array<User> = [];

  for await (const _index of usersArr) {
    const user = await createUser();
    const exist = users.find((u) => u.username === user.username);
    if (!exist) {
      users.push(user);
      await db('users').insert(user);
      const userWorkouts = generateWorkouts(user, places);
      if (userWorkouts.length > 0) {
        await db('workouts').insert(userWorkouts);
      }
    }
  }
}

const randomAge = random.normal(30, 9);
const randomFemaleHeight = random.normal(145, 20);
const randomMaleHeight = random.normal(160, 20);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function createUser(): Promise<User> {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = faker.name.firstName(gender === 'male' ? 0 : 1);
  const lastName = faker.name.lastName();
  const age = clamp(Math.round(randomAge()), 14, 70);
  const randomHeight =
    gender === 'male' ? randomMaleHeight : randomFemaleHeight;
  const height = clamp(Math.round(randomHeight()), 140, 210);
  const randomWeight = random.normal(idealWeightFromHeight(height), 8);
  const weight = randomWeight();
  const password = faker.internet.password();
  const hashed = await hash(password, 10);
  const username = generateUsername(firstName, lastName);
  const user: User = {
    firstName,
    lastName,
    age,
    height,
    weight,
    password: hashed,
    token: uid(22),
    username,
  };

  return user;
}

function idealWeightFromHeight(height: number): number {
  const slope = 0.716666666;
  const offset = 57;
  return height * slope - offset;
}

function computeImc(user: User) {
  return user.weight * Math.pow(user.height / 100, -2);
}

// Return a num between 1 (++) and 0 (--)
function computePerf(user: User) {
  const imc = computeImc(user);
  const diff = Math.abs(imc - 20);
  const scale = 0.205;
  const score = 1 - scale * Math.pow(diff, 0.5);
  return score;
}

function generateUsername(firstName: string, lastName: string): string {
  if (chances(20)) {
    return slugify(firstName);
  }
  if (chances(20)) {
    return slugify(lastName);
  }
  if (chances(40)) {
    return slugify(firstName) + slugify(lastName).slice(0, 4);
  }
  return slugify(firstName) + '-' + slugify(lastName);
}

function slugify(str: string): string {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  const to = 'aaaaeeeeiiiioooouuuunc------';
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

function generateWorkouts(user: User, places: Array<Place>): Array<Workout> {
  if (chances(2)) {
    // 5% chance of no workout
    return [];
  }
  const imc = computeImc(user);
  const badImc = imc < 17 || imc > 27;
  if (badImc ? chances(85) : chances(15)) {
    return generateRandomWorkouts(user, places);
  }
  return generateRegularWorkouts(user, places);
}

function generateRandomWorkouts(
  user: User,
  places: Array<Place>
): Array<Workout> {
  const workouts: Array<Workout> = [];
  const now = new Date();
  const twoYearsInDays = 2 * 360;
  const daysSinceStart = Math.round(random.uniform(10, twoYearsInDays)());
  let place = randomPick(places);
  const start = subDays(now, daysSinceStart);
  let date = start;
  let proba = 0.8;
  while (true) {
    if (chances(2)) {
      place = randomPick(places);
    }
    // more likely to do it the weekend
    const finalProba = proba * (isWeekend(date) ? 1.5 : 1);
    if (chances(finalProba * 100)) {
      proba = 0.1;
      const workoutHour = chances(50) ? 'morning' : 'evening';
      const dateTime = generateWorkoutHour(date, workoutHour);
      workouts.push(generateWorkout(user, dateTime, place.slug));
    } else {
      proba = proba + (1 - proba) * 0.1;
    }
    date = addDays(date, 1);
    if (isAfter(date, now)) {
      break;
    }
  }
  return workouts;
}

function generateRegularWorkouts(
  user: User,
  places: Array<Place>
): Array<Workout> {
  const workouts: Array<Workout> = [];
  const now = new Date();
  const twoYearsInDays = 2 * 360;
  const daysSinceStart = Math.round(random.uniform(10, twoYearsInDays)());
  const start = subDays(now, daysSinceStart);
  const score = computePerf(user);
  const daysPerWeek = 1 + Math.floor(score * 4 * random.uniform(0.6, 1)());
  const workoutDays = pickMulti([0, 1, 2, 3, 4, 5, 6], daysPerWeek);
  const workoutHour = chances(50) ? 'morning' : 'evening';
  let place = randomPick(places);
  let date = start;
  while (true) {
    if (chances(2)) {
      place = randomPick(places);
    }
    const isWorkoutDay = workoutDays.includes(getDay(date));
    if (isWorkoutDay ? chances(95) : chances(2)) {
      const dateTime = generateWorkoutHour(date, workoutHour);
      workouts.push(generateWorkout(user, dateTime, place.slug));
    }
    date = addDays(date, 1);
    if (isAfter(date, now)) {
      break;
    }
  }
  return workouts;
}

function generateWorkoutHour(date: Date, time: 'morning' | 'evening'): Date {
  const [min, max] = time === 'morning' ? [5, 9] : [17, 21];
  const hours = Math.floor(random.uniform(min, max)());
  const minutes = Math.floor(Math.random() * 60);
  return dateSet(date, {
    hours,
    minutes,
  });
}

function pickMulti<T>(arr: Array<T>, count: number): Array<T> {
  const pool = [...arr];
  const result: Array<T> = [];
  while (result.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}

// Return true with num% chance
function chances(num: number): boolean {
  return Math.random() < num / 100;
}

function generateWorkout(user: User, date: Date, place: string): Workout {
  const score = computePerf(user);
  const averageSpeed = 3 + 9 * score;
  const randomSpeed = random.normal(averageSpeed, 0.3);
  const speed = Math.round(randomSpeed()); // km/h
  const averageDistance = 0.5 + 13 * score;
  const randomDistance = random.normal(averageDistance, 2.6);
  const distance = clamp(Math.round(randomDistance() * 1000), 226, Infinity); // meters
  const duration = Math.round((distance / 1000 / speed) * 60); // minutes
  const workout: Workout = {
    id: createSlug(),
    user: user.username,
    date: date.toISOString(),
    distance,
    duration,
    place,
  };
  return workout;
}

function randomPick<T>(arr: Array<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
