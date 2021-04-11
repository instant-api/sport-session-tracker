import { Chemin, CheminParam } from 'tumau';

export const ROUTES = {
  home: Chemin.create(),
  me: Chemin.create('me'),
  workouts: Chemin.create('workouts'),
  places: Chemin.create('places'),
  place: Chemin.create('place', CheminParam.string('slug')),
  user: Chemin.create('user', CheminParam.string('username')),
  public: Chemin.create(
    'public',
    CheminParam.multiple(CheminParam.string('path'))
  ),
  // Actions
  signup: Chemin.create('action', 'signup'),
  login: Chemin.create('action', 'login'),
  createWorkout: Chemin.create('action', 'create-workout'),
  createPlace: Chemin.create('action', 'create-place'),
  updatePlaceImage: Chemin.create(
    'action',
    'update-place-image',
    CheminParam.string('slug')
  ),
};
