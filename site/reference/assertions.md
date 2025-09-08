---
title: Assertions
children:
  - assertions/primitives.md
  - assertions/numeric.md
  - assertions/other-types.md
  - assertions/strings.md
  - assertions/collections.md
  - assertions/objects.md
  - assertions/functions.md
  - assertions/equality.md
  - assertions/errors.md
  - assertions/dates.md
  - assertions/async.md
showGroups: true
---

# Assertions

_BUPKIS_ comes with a variety of built-in assertions representing the most common expectations you might want to make.

## Conventions

**This is important; read it.**

### Subjects, Phrases, & Parameters

#### Subjects

The first argument to `expect()` is called the _subject_. The subject is the value being tested. For example, in `expect(42, 'to be', 42)`, the subject is `42`.

#### Phrases

You may see the term _phrase_ referenced in the documentation. A _phrase_ is a string parameter to the `expect()` function that decides which assertion to execute. For example, in `expect(42, 'to be', 42)`, the phrase is `'to be'`.

Assertions may have multiple phrases that end up executing the same assertion.
We call these _aliases_. For example, the phrases `'to be'`, `'to equal'`, and
`'is'` all execute the same equality assertion.

An assertion has _at least one_ phrase, but may have more than one. For example, the following assertion has two phrases:

```js
expect(
  () => throw new TypeError('Oh no!'),
  'to throw a',
  TypeError,
  'satisfying',
  /Oh no/,
);
```

#### Parameters

A _parameter_ is considered anything else that's neither a phrase nor a value. This comes into play when an assertion is _parametric_; this means the assertion expects some extra value to use in some manner.

Typically, a parameter is used for some type of comparison operation, but this is not a requirement.

You will see assertions accepting parameters referred to as _parametric assertions_.

Assertions _without_ parameters are often called _non-parametric assertions_ or just _basic assertions_.

> Don't confuse parameters and phrases! Just because a `string` is expected does not mean that it is a _phrase_. For example, in the assertion:
>
> ```js
> expect('bruh', 'to be a', 'string');
> ```
>
> …the phrase is `'to be a'` and the parameter is `'string'`.

### Negation

_Any_ assertion can be negated by prepending the phrase with `not`. For example:

```js
expect(42, 'to be', 42);

// negated
expect(42, 'not to be', 42); // AssertionError; 42 is 42
```
