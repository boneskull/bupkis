---
title: String & Pattern Assertions
group: Assertions
---

# String & Pattern Assertions

These assertions test strings, regular expressions, and pattern matching.

## to be a RegExp

> _Aliases: `to be a RegExp`, `to be a regex`, `to be a regexp`_

**Success**:

```js
expect(/hello/, 'to be a RegExp');
expect(new RegExp('world'), 'to be a regex');
expect(/[a-z]+/i, 'to be a regexp');
```

**Failure**:

```js
expect('hello', 'to be a RegExp');
// AssertionError: Expected 'hello' to be a RegExp
```

**Negation**:

```js
expect('hello', 'not to be a RegExp');
```

## to begin with

> _Aliases: `to begin with`, `to start with`_

**Success**:

```js
expect('hello world', 'to begin with', 'hello');
expect('JavaScript', 'to start with', 'Java');
```

**Failure**:

```js
expect('hello world', 'to begin with', 'world');
// AssertionError: Expected 'hello world' to begin with 'world'
```

**Negation**:

```js
expect('hello world', 'not to begin with', 'world');
```

## to end with

**Success**:

```js
expect('hello world', 'to end with', 'world');
expect('test.js', 'to end with', '.js');
```

**Failure**:

```js
expect('hello world', 'to end with', 'hello');
// AssertionError: Expected 'hello world' to end with 'hello'
```

**Negation**:

```js
expect('hello world', 'not to end with', 'hello');
```

## to match

**Success**:

```js
expect('hello123', 'to match', /\d+/);
expect('JavaScript', 'to match', /^Java/);
expect('test@example.com', 'to match', /@/);
```

**Failure**:

```js
expect('hello', 'to match', /\d+/);
// AssertionError: Expected 'hello' to match /\d+/
```

**Negation**:

```js
expect('hello', 'not to match', /\d+/);
```

## to be empty (string)

**Success**:

```js
expect('', 'to be empty');
```

**Failure**:

```js
expect('hello', 'to be empty');
// AssertionError: Expected 'hello' to be empty
```

**Negation**:

```js
expect('hello', 'not to be empty');
```

## to be non-empty (string)

**Success**:

```js
expect('hello', 'to be non-empty');
expect(' ', 'to be non-empty'); // Whitespace counts as non-empty
```

**Failure**:

```js
expect('', 'to be non-empty');
// AssertionError: Expected '' to be non-empty
```

**Negation**:

```js
expect('', 'not to be non-empty');
```

## includes / contains

> _Aliases: `includes`, `contains`, `to include`, `to contain`_

**Success**:

```js
expect('hello world', 'includes', 'world');
expect('JavaScript', 'contains', 'Script');
expect([1, 2, 3], 'to include', 2);
expect('test string', 'to contain', 'string');
```

**Failure**:

```js
expect('hello', 'includes', 'world');
// AssertionError: Expected 'hello' to include 'world'
```

**Negation**:

```js
expect('hello', 'not to include', 'world');
```
