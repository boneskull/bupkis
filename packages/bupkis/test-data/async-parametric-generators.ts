import escapeStringRegexp from 'escape-string-regexp';
import fc from 'fast-check';

import * as assertions from '../src/assertion/impl/async-parametric.js';
import { type AnyAssertion } from '../src/types.js';
import { type GeneratorParams } from '../test/property/property-test-config.js';
import {
  extractPhrases,
  safeRegexStringFilter,
} from '../test/property/property-test-util.js';

export const AsyncParametricGenerators = new Map<AnyAssertion, GeneratorParams>(
  [
    [
      assertions.functionFulfillWithValueSatisfyingAssertion,
      fc
        .string({ maxLength: 9, minLength: 7 })
        .map(safeRegexStringFilter)
        .filter((message) => !!message.length)
        .chain((str) =>
          fc.tuple(
            fc.constant(async () => str),
            fc.constantFrom(
              ...extractPhrases(
                assertions.functionFulfillWithValueSatisfyingAssertion,
              ),
            ),
            fc.constant(str),
          ),
        ),
    ],
    [
      assertions.functionRejectAssertion,
      fc.string().chain((expected) =>
        fc.tuple(
          fc.constant(async () => {
            throw new Error(expected);
          }),
          fc.constantFrom(
            ...extractPhrases(assertions.functionRejectAssertion),
          ),
        ),
      ),
    ],
    [
      assertions.functionRejectWithErrorSatisfyingAssertion,
      fc
        .string({ maxLength: 5, minLength: 1 })
        .map(safeRegexStringFilter)
        .filter((actual) => !!actual.length)
        .chain((expected) =>
          fc.tuple(
            fc.constant(async () => {
              throw new Error(expected);
            }),
            fc.constantFrom(
              ...extractPhrases(
                assertions.functionRejectWithErrorSatisfyingAssertion,
              ),
            ),
            fc.oneof(
              fc.constant(expected),
              fc.constant(new RegExp(escapeStringRegexp(expected))),
              fc.constant({ message: expected }),
              fc.constant({
                message: new RegExp(escapeStringRegexp(expected)),
              }),
            ),
          ),
        ),
    ],
    [
      assertions.functionRejectWithTypeAssertion,
      fc
        .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
        .chain((ErrorCtor) =>
          fc.tuple(
            fc.constant(async () => {
              throw new ErrorCtor('error');
            }),
            fc.constantFrom(
              ...extractPhrases(assertions.functionRejectWithTypeAssertion),
            ),
            fc.constant(ErrorCtor),
          ),
        ),
    ],
    [
      assertions.functionResolveAssertion,
      [
        fc.constant(async () => 'success'),
        fc.constantFrom(...extractPhrases(assertions.functionResolveAssertion)),
      ],
    ],
    [
      assertions.promiseRejectAssertion,
      [
        fc.constant({
          then(_resolve: (value: any) => void, reject: (reason: any) => void) {
            reject(new Error('rejection'));
          },
        }),
        fc.constantFrom(...extractPhrases(assertions.promiseRejectAssertion)),
      ],
    ],
    [
      assertions.promiseRejectWithErrorSatisfyingAssertion,
      fc.string().chain((message) =>
        fc.tuple(
          fc.constant({
            then(
              _resolve: (value: any) => void,
              reject: (reason: any) => void,
            ) {
              reject(new Error(message));
            },
          }),
          fc.constantFrom(
            ...extractPhrases(
              assertions.promiseRejectWithErrorSatisfyingAssertion,
            ),
          ),
          fc.constant(message),
        ),
      ),
    ],
    [
      assertions.promiseRejectWithTypeAssertion,
      fc
        .constantFrom(TypeError, ReferenceError, RangeError, SyntaxError)
        .chain((ExpectedCtor) =>
          fc.tuple(
            fc.constant({
              then(
                _resolve: (value: any) => void,
                reject: (reason: any) => void,
              ) {
                reject(new ExpectedCtor('error'));
              },
            }),
            fc.constantFrom(
              ...extractPhrases(assertions.promiseRejectWithTypeAssertion),
            ),
            fc.constant(ExpectedCtor),
          ),
        ),
    ],
    [
      assertions.promiseResolveAssertion,
      [
        fc.constant(Promise.resolve('success')),
        fc.constantFrom(...extractPhrases(assertions.promiseResolveAssertion)),
      ],
    ],
    [
      assertions.promiseResolveAssertion,
      [
        fc.constant(Promise.resolve('success')),
        fc.constantFrom(...extractPhrases(assertions.promiseResolveAssertion)),
      ],
    ],
    [
      assertions.promiseResolveWithValueSatisfyingAssertion,
      fc
        .string({ maxLength: 20, minLength: 10 })
        .chain((expected) =>
          fc.tuple(
            fc.constant(Promise.resolve(expected)),
            fc.constantFrom(
              ...extractPhrases(
                assertions.promiseResolveWithValueSatisfyingAssertion,
              ),
            ),
            fc.oneof(
              fc.constant(expected),
              fc.constant(new RegExp(escapeStringRegexp(expected))),
            ),
          ),
        ),
    ],
  ],
);
