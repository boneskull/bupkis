---
title: Object Assertions
category: Assertions
---

## Object Assertions

These assertions test objects, their properties, and object-specific behaviors.

### to be an object

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

### to be a record

> _Aliases: `to be a record`, `to be a plain object`_

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

### &lt;object&gt; to be empty

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

### to have keys &lt;array&gt;

> _Aliases: `to have keys <array>`, `to have properties <array>`, `to have props <array>`_

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

### to have a null prototype

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

### to be an enumerable property of &lt;object&gt;

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

### to be sealed

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

### to be frozen

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

### to be extensible

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

### to satisfy &lt;any&gt;

> _Aliases: `to satisfy <any>`, `to be like <any>`_

"To satisfy" is a ~~wonky~~ _special_ loose "deep equal" assertion. It is similar to AVA's `t.like()` or Jest's `expect.objectContaining()`. It checks that the actual object contains _at least_ the properties and values specified in the expected object. It ignores any additional properties.

In addition, any _regular expression_ in a property value position will be used to match the corresponding actual value (which will be coerced into a string). This makes it easy to assert that a string property contains a substring, starts with a prefix, or matches some other pattern.

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
