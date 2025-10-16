---
title: Object Assertions
category: Assertions
---

## Object Assertions

These assertions test objects, their properties, and object-specific behaviors.

### {unknown} to be an object

**Success**:

```js
expect({}, 'to be an object');
expect({ a: 1 }, 'to be an object');
expect([], 'to be an object'); // Arrays are objects
expect(new Date(), 'to be an object');
```

**Failure**:

```js
expect('hello', 'to be an object');
// AssertionError: Expected 'hello' to be an object
expect(null, 'to be an object');
```

**Negation**:

```js
expect('hello', 'not to be an object');
expect(null, 'not to be an object');
```

### {unknown} to be a record

> ✏️ Aliases:
>
>     {unknown} to be a record
>     {unknown} to be a plain object

**Success**:

```js
expect({}, 'to be a record');
expect({ a: 1, b: 2 }, 'to be a plain object');
```

**Failure**:

```js
expect([], 'to be a record');
// AssertionError: Expected [] to be a record
expect(new Date(), 'to be a record');
```

**Negation**:

```js
expect([], 'not to be a record');
```

### {object} to be empty

**Success**:

```js
expect({}, 'to be empty');
```

**Failure**:

```js
expect({ a: 1 }, 'to be empty');
// AssertionError: Expected { a: 1 } to be empty
```

**Negation**:

```js
expect({ a: 1 }, 'not to be empty');
```

### {object} to have keys {array}

> ✏️ Aliases:
>
>     {object} to have keys {array}
>     {object} to have properties {array}
>     {object} to have props {array}
>     {object} to include keys {array}
>     {object} to include properties {array}
>     {object} to include props {array}
>     {object} to contain keys {array}
>     {object} to contain properties {array}
>     {object} to contain props {array}

**Success**:

```js
expect({ a: 1, b: 2 }, 'to have keys', ['a', 'b']);
expect({ name: 'John', age: 30 }, 'to have properties', ['name', 'age']);
```

**Failure**:

```js
expect({ a: 1 }, 'to have keys', ['a', 'b']);
// AssertionError: Expected { a: 1 } to have keys ['a', 'b']
```

**Negation**:

```js
expect({ a: 1 }, 'not to have keys', ['a', 'b']);
```

### {object} to have key {keypath}

> ✏️ Aliases:
>
>     {object} to have key {keypath}
>     {object} to have property {keypath}
>     {object} to have prop {keypath}
>     {object} to include key {keypath}
>     {object} to include property {keypath}
>     {object} to include prop {keypath}
>     {object} to contain key {keypath}
>     {object} to contain property {keypath}
>     {object} to contain prop {keypath}

Tests whether an object has a property at the specified keypath using dot or bracket notation. This assertion supports complex _keypath_ traversal including nested properties, array indices, and quoted keys.

Supported keypath formats:

- Dot notation: `'prop.nested'`
- Bracket notation with numbers: `'arr[0]'`
- Bracket notation with quoted strings: `'obj["key"]'` or `"obj['key']"`
- Mixed notation: `'data.items[1].name'`

**Success**:

```js
const obj = {
  foo: { bar: [{ baz: 'value' }] },
  'kebab-case': 'works',
  items: [
    { id: 1, name: 'first' },
    { id: 2, name: 'second' },
  ],
};

expect(obj, 'to have key', 'foo.bar');
expect(obj, 'to have property', 'foo.bar[0].baz');
expect(obj, 'to have prop', 'kebab-case');
expect(obj, 'to have key', 'items[1].name');
expect(obj, 'to have property', 'foo["bar"][0]["baz"]');
```

**Failure**:

```js
expect(obj, 'to have key', 'nonexistent.path');
// AssertionError: Expected object to contain keypath nonexistent.path

expect(obj, 'to have property', 'foo.bar[5].missing');
// AssertionError: Expected object to contain keypath foo.bar[5].missing
```

**Negation**:

```js
expect(obj, 'not to have key', 'nonexistent.path');
expect(obj, 'not to have property', 'foo.bar[5].missing');
```

### {object} to have exact key {string | number | symbol}

> ✏️ Aliases:
>
>     {object} to have exact key {string | number | symbol}
>     {object} to have exact property {string | number | symbol}
>     {object} to have exact prop {string | number | symbol}

Tests whether an object has an exact property key without keypath traversal. This assertion checks for direct properties on the object and supports symbols and keys that would conflict with bracket/dot notation.

Unlike `to have key`, this assertion:

- Does not support keypath traversal (no dots or brackets are interpreted)
- Can check for symbol keys
- Can check for keys containing dots, brackets, or other special characters as literal property names
- Only checks direct properties (no nested access)

**Success**:

```js
const sym = Symbol('test');
const obj = {
  simple: 'value',
  'key.with.dots': 'direct property',
  'key[with]brackets': 'another direct property',
  [sym]: 'symbol value',
};

expect(obj, 'to have exact key', 'simple');
expect(obj, 'to have exact property', 'key.with.dots'); // literal key, not traversal
expect(obj, 'to have exact prop', 'key[with]brackets'); // literal key, not array access
expect(obj, 'to have exact key', sym); // symbol key
```

**Failure**:

```js
const obj = { nested: { prop: 'value' } };

expect(obj, 'to have exact key', 'nested.prop');
// AssertionError: Expected object to have exact key nested.prop
// (This fails because 'nested.prop' is not a direct property)

expect(obj, 'to have exact property', 'missing');
// AssertionError: Expected object to have exact key missing
```

**Negation**:

```js
expect(obj, 'not to have exact key', 'missing');
expect(obj, 'not to have exact property', 'nested.prop'); // no traversal
```

### {object} to have a null prototype

> ✏️ Aliases:
>
>     {object} to have a null prototype
>     {object} to be a dictionary

**Success**:

```js
const obj = Object.create(null);
expect(obj, 'to have a null prototype');
```

**Failure**:

```js
expect({}, 'to have a null prototype');
// AssertionError: Expected {} to have a null prototype
```

**Negation**:

```js
expect({}, 'not to have a null prototype');
```

### {string | number | symbol} to be an enumerable property of {non-null}

> ✏️ Aliases:
>
>     {string | number | symbol} to be an enumerable property of {non-null}
>     {non-null} to have enumerable property {string | number | symbol}

This accepts any non-`null`, non-`undefined` value as the second parameter.

**Success**:

```js
const obj = { a: 1, b: 2 };
expect('a', 'to be an enumerable property of', obj);
```

**Failure**:

```js
const obj = { a: 1 };
Object.defineProperty(obj, 'b', { value: 2, enumerable: false });
expect('b', 'to be an enumerable property of', obj);
// AssertionError: Expected 'b' to be an enumerable property of object
```

**Negation**:

```js
expect('b', 'not to be an enumerable property of', obj);
```

### {unknown} to be sealed

**Success**:

```js
const obj = { a: 1 };
Object.seal(obj);
expect(obj, 'to be sealed');
```

**Failure**:

```js
expect({}, 'to be sealed');
// AssertionError: Expected {} to be sealed
```

**Negation**:

```js
expect({}, 'not to be sealed');
```

### {unknown} to be frozen

**Success**:

```js
const obj = { a: 1 };
Object.freeze(obj);
expect(obj, 'to be frozen');
```

**Failure**:

```js
expect({}, 'to be frozen');
// AssertionError: Expected {} to be frozen
```

**Negation**:

```js
expect({}, 'not to be frozen');
```

### {unknown} to be extensible

**Success**:

```js
expect({}, 'to be extensible');
```

**Failure**:

```js
const obj = {};
Object.preventExtensions(obj);
expect(obj, 'to be extensible');
// AssertionError: Expected {} to be extensible
```

**Negation**:

```js
expect(obj, 'not to be extensible');
```

### {object} to satisfy {any}

> ✏️ Aliases:
>
>     {object} to satisfy {any}
>     {object} to be like {any}

"To satisfy" is a ~~wonky~~ _special_ loose "deep equal" assertion. It is similar to AVA's `t.like()` or Jest's `expect.objectContaining()`. It checks that the actual object contains _at least_ the properties and values specified in the expected object. It ignores any additional properties.

In addition, any _regular expression_ in a property value position will be used to match the corresponding actual value (which will be coerced into a string). This makes it easy to assert that a string property contains a substring, starts with a prefix, or matches some other pattern.

> Note: The parameter in this assertion and others supporting the "to satisfy" semantics are not strongly typed, even though regular expressions and `expect.it()` have special meaning. This is because the parameter can accept _literally any value_.

**Success**:

```js
expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, b: 2 });
expect({ name: 'John', age: 30 }, 'to be like', { name: 'John' });

// Using regular expressions in property values
expect(
  {
    email: 'user@example.com',
    phone: '+1-555-0123',
    id: 12345,
  },
  'to satisfy',
  {
    email: /^user@/,
    phone: /^\+1-555/,
    id: /123/,
  },
);
```

**Failure**:

```js
expect({ a: 1 }, 'to satisfy', { a: 1, b: 2 });
// AssertionError: Expected { a: 1 } to satisfy { a: 1, b: 2 }
```

**Negation**:

```js
expect({ a: 1 }, 'not to satisfy', { a: 1, b: 2 });
```
