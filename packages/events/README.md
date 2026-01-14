# @bupkis/events

EventEmitter and EventTarget assertions for [bupkis](https://github.com/boneskull/bupkis).

## Installation

```bash
npm install @bupkis/events
```

## Usage

```ts
import { expect, expectAsync } from 'bupkis';
import { eventAssertions } from '@bupkis/events';
import { EventEmitter } from 'node:events';

// Register the assertions
const { expect: e, expectAsync: ea } = expect.use(eventAssertions);

// Sync assertions for listener state
const emitter = new EventEmitter();
emitter.on('data', () => {});
expect(emitter, 'to have listener for', 'data');

// Async assertions for event emission
await expectAsync(
  () => emitter.emit('ready'),
  'to emit from',
  emitter,
  'ready',
);
```

## Assertions

### Synchronous Assertions (EventEmitter)

#### to have listener for {event}

Asserts that an emitter has at least one listener for the specified event.

```ts
const emitter = new EventEmitter();
emitter.on('data', () => {});

expect(emitter, 'to have listener for', 'data'); // passes
expect(emitter, 'not to have listener for', 'other'); // passes (negation)
```

#### to have listeners for {events}

Asserts that an emitter has listeners for all specified events.

```ts
const emitter = new EventEmitter();
emitter.on('data', () => {});
emitter.on('end', () => {});

expect(emitter, 'to have listeners for', ['data', 'end']); // passes
```

#### to have listener count {event} {count}

Asserts that an emitter has exactly the specified number of listeners for an event.

```ts
const emitter = new EventEmitter();
emitter.on('data', () => {});
emitter.on('data', () => {}); // second listener

expect(emitter, 'to have listener count', 'data', 2); // passes
```

#### to have listeners

Asserts that an emitter has at least one listener registered (for any event).

```ts
const emitter = new EventEmitter();
emitter.on('anything', () => {});

expect(emitter, 'to have listeners'); // passes
expect(new EventEmitter(), 'not to have listeners'); // passes (fresh emitter)
```

#### to have max listeners {count}

Asserts that an emitter's maxListeners is set to the specified value.

```ts
const emitter = new EventEmitter();
emitter.setMaxListeners(20);

expect(emitter, 'to have max listeners', 20); // passes
```

### Asynchronous Assertions (EventEmitter)

Async assertions use a trigger-based API where the first argument is a function or Promise that causes the event to be emitted.

#### to emit from {emitter} {event}

Asserts that a trigger causes an emitter to emit the specified event.

```ts
const emitter = new EventEmitter();

// Function trigger
await expectAsync(
  () => emitter.emit('ready'),
  'to emit from',
  emitter,
  'ready',
);

// Async trigger
await expectAsync(
  () => setTimeout(() => emitter.emit('ready'), 10),
  'to emit from',
  emitter,
  'ready',
);
```

#### to emit from {emitter} {event} with args {args}

Asserts that a trigger causes an emitter to emit an event with specific arguments. Uses `'to satisfy'` semantics, allowing partial matching for objects and `expect.it()` for custom assertions.

```ts
const emitter = new EventEmitter();

await expectAsync(
  () => emitter.emit('data', 'hello', 42),
  'to emit from',
  emitter,
  'data',
  'with args',
  ['hello', 42],
);
```

With custom assertions:

```ts
await expectAsync(
  () => emitter.emit('data', { count: 42, extra: 'ignored' }),
  'to emit from',
  emitter,
  'data',
  'with args',
  [expect.it('to satisfy', { count: expect.it('to be greater than', 0) })],
);
```

#### to emit error from {emitter}

Asserts that a trigger causes an emitter to emit the 'error' event.

```ts
const emitter = new EventEmitter();
emitter.on('error', () => {}); // Prevent unhandled error

await expectAsync(
  () => emitter.emit('error', new Error('oops')),
  'to emit error from',
  emitter,
);
```

#### to emit events from {emitter} {events}

Asserts that a trigger causes an emitter to emit events in the specified order.

```ts
const emitter = new EventEmitter();

await expectAsync(
  () => {
    emitter.emit('start');
    emitter.emit('data');
    emitter.emit('end');
  },
  'to emit events from',
  emitter,
  ['start', 'data', 'end'],
);
```

### Asynchronous Assertions (EventTarget)

#### to dispatch from {target} {eventType}

Asserts that a trigger causes an EventTarget to dispatch the specified event.

```ts
const target = new EventTarget();

await expectAsync(
  () => target.dispatchEvent(new Event('click')),
  'to dispatch from',
  target,
  'click',
);
```

#### to dispatch from {target} {eventType} with detail {detail}

Asserts that a trigger causes an EventTarget to dispatch a CustomEvent with specific detail. Uses `'to satisfy'` semantics for objects, allowing partial matching and `expect.it()` for custom assertions.

```ts
const target = new EventTarget();

await expectAsync(
  () =>
    target.dispatchEvent(new CustomEvent('custom', { detail: { foo: 'bar' } })),
  'to dispatch from',
  target,
  'custom',
  'with detail',
  { foo: 'bar' },
);
```

Partial matching (extra properties allowed):

```ts
await expectAsync(
  () =>
    target.dispatchEvent(
      new CustomEvent('custom', { detail: { foo: 'bar', extra: 'ignored' } }),
    ),
  'to dispatch from',
  target,
  'custom',
  'with detail',
  { foo: 'bar' },
);
```

With custom assertions:

```ts
await expectAsync(
  () =>
    target.dispatchEvent(new CustomEvent('data', { detail: { count: 42 } })),
  'to dispatch from',
  target,
  'data',
  'with detail',
  expect.it('to satisfy', { count: expect.it('to be greater than', 0) }),
);
```

### Timeout Options

All async assertions accept an optional timeout configuration:

```ts
// Wait up to 100ms for the event
await expectAsync(
  () => setTimeout(() => emitter.emit('slow'), 50),
  'to emit from',
  emitter,
  'slow',
  { within: 100 },
);
```

The default timeout is 2000ms.

## Duck-Typed EventEmitter Support

This package uses duck-typing to detect EventEmitter-like objects, making it compatible with:

- Node.js `EventEmitter`
- `eventemitter3`
- Custom implementations that match the interface

```ts
import EventEmitter3 from 'eventemitter3';

const emitter = new EventEmitter3();
emitter.on('data', () => {});

expect(emitter, 'to have listener for', 'data'); // works!
```

## Symbol Events

Both sync and async assertions support symbol event names:

```ts
const sym = Symbol('myEvent');
emitter.on(sym, () => {});

expect(emitter, 'to have listener for', sym);

await expectAsync(() => emitter.emit(sym), 'to emit from', emitter, sym);
```

## License

[BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0)
