---
title: Equality & Comparison Assertions
category: Assertions
---

## Equality & Comparison Assertions

These assertions test equality, identity, and value comparisons.

### to be

> _Aliases: `to be`, `to equal`, `equals`, `is`, `is equal to`, `to strictly equal`_

**Success**:

```js
expect(42, 'to be', 42);
expect('hello', 'to equal', 'hello');
expect(true, 'is', true);
expect(null, 'is equal to', null);
```

**Failure**:

```js
expect(42, 'to be', '42');
// AssertionError: Expected 42 to be '42'
expect({}, 'to equal', {});
// AssertionError: Expected {} to equal {}
```

**Negation**:

```js
expect(42, 'not to be', '42');
expect({}, 'not to equal', {});
```

### to deep equal

> _Aliases: `to deep equal`, `to deeply equal`_

**Success**:

```js
expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 });
expect([1, 2, 3], 'to deeply equal', [1, 2, 3]);
expect({ nested: { value: 42 } }, 'to deep equal', { nested: { value: 42 } });
```

**Failure**:

```js
expect({ a: 1 }, 'to deep equal', { a: 1, b: 2 });
// AssertionError: Expected { a: 1 } to deep equal { a: 1, b: 2 }
```

**Negation**:

```js
expect({ a: 1 }, 'not to deep equal', { a: 1, b: 2 });
```

### to be one of &lt;array&gt;

**Success**:

```js
expect(2, 'to be one of', [1, 2, 3]);
expect('blue', 'to be one of', ['red', 'green', 'blue']);
```

**Failure**:

```js
expect(5, 'to be one of', [1, 2, 3]);
// AssertionError: Expected 5 to be one of [1, 2, 3]
```

**Negation**:

```js
expect(5, 'not to be one of', [1, 2, 3]);
```

### to be an instance of &lt;constructor&gt;

> _Aliases: `to be an instance of <constructor>`, `to be a <constructor>`_

**Success**:

```js
expect(new Date(), 'to be an instance of', Date);
expect([], 'to be a', Array);
expect('hello', 'to be an instance of', String); // Note: primitive strings work too
```

**Failure**:

```js
expect('hello', 'to be an instance of', Number);
// AssertionError: Expected 'hello' to be an instance of Number
```

**Negation**:

```js
expect('hello', 'not to be an instance of', Number);
```

### to be a &lt;constructor&gt; / to be an &lt;constructor&gt;

> _Aliases: `to be a <constructor>`, `to be an <constructor>`_

**Success**:

```js
expect(new Date(), 'to be a', Date);
expect(new Error(), 'to be an', Error);
expect([], 'to be an', Array);
```

**Failure**:

```js
expect('hello', 'to be a', Number);
// AssertionError: Expected 'hello' to be a Number
```

**Negation**:

```js
expect('hello', 'not to be a', Number);
```
