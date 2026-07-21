import * as migration_20260721_134200 from './20260721_134200';

export const migrations = [
  {
    up: migration_20260721_134200.up,
    down: migration_20260721_134200.down,
    name: '20260721_134200'
  },
];
