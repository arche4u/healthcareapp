import { EventEmitter } from 'events';

// In Next.js dev, we need to ensure we don't create multiple instances of the emitter
// across HMR reloads.
declare global {
  var _eventEmitter: EventEmitter | undefined;
}

export const globalEmitter = global._eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  global._eventEmitter = globalEmitter;
}
