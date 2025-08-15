import { Infer, z } from 'zod/v4';

type AssertionContinuation = <R>(
  cont: <
    Strings extends TemplateStringsArray,
    Slots extends Record<string, z.ZodType>,
  >(
    assertion: Assertion<Strings, Slots>,
  ) => R,
) => R;

function makeAssertionContinuation<
  Strings extends TemplateStringsArray,
  Slots extends Record<string, z.ZodType>,
>(assertion: Assertion<Strings, Slots>): AssertionContinuation {
  return <R>(
    cont: <
      Strings extends TemplateStringsArray,
      Slots extends Record<string, z.ZodType>,
    >(
      assertion_: Assertion<Strings, Slots>,
    ) => R,
  ) => cont(assertion);
}

type AssertionStringsContinuation = <R>(
  cont: <Strings extends TemplateStringsArray>(strings: Strings) => R,
) => R;

function makeAssertionStringsContinuation<Strings extends TemplateStringsArray>(
  strings: Strings,
): AssertionStringsContinuation {
  return <R>(
    cont: <Strings extends TemplateStringsArray>(strings_: Strings) => R,
  ) => cont(strings);
}

type AssertionSlots = [z.ZodType, ...z.ZodType[]];

type InferredSlots<Slots extends AssertionSlots> = {
  [K in keyof Slots]: Slots[K] extends z.ZodType ? z.infer<Slots[K]> : never;
};

type AssertionImpl<Slots extends AssertionSlots> = (
  expect: Expect,
  ...values: InferredSlots<Slots>
) => Awaited<void>;

class Assertion<
  const Strings extends AssertionStrings,
  Slots extends AssertionSlots,
> {
  #strings: Strings;

  #slots: Slots;
  constructor(strings: Strings, slots: Slots) {
    this.#strings = strings;
    this.#slots = slots;
  }

  parse(...values: unknown[]): boolean {
    while (values.length) {
      const value = values.shift();
      for (const zodType of this.#slots) {
        if (zodType.safeParse(value).success) {
          return true;
        }
      }
    }
    return false;
  }

  get strings(): Strings {
    return this.#strings;
  }
}

type AssertionStrings = TemplateStringsArray | [...string[]];

const assertionMap: Map<string, Set<Assertion<any, any>>> = new Map();

// export function assertion<
//   Actual extends z.ZodType,
//   const Strings extends AssertionStrings,
// >(strings: Strings, actual: Actual): Assertion<Strings, [Actual]>;

// export function assertion<
//   Actual extends z.ZodType,
//   const Strings extends AssertionStrings,
//   Expected extends z.ZodType = Actual,
// >(strings: Strings, actual: Actual, expected: Expected): Assertion<Strings, [Actual, Expected]>;

export function assertion<
  Slots extends AssertionSlots,
  const Strings extends AssertionStrings,
>(strings: Strings, ...slots: Slots) {
  return new Assertion(strings, slots);
}

let impls: WeakMap<Assertion<any, any>, AssertionImpl<any>> = new WeakMap();

export function addAssertion<
  const Strings extends AssertionStrings,
  const Slots extends AssertionSlots,
>(assertion: Assertion<Strings, Slots>, impl: AssertionImpl<Slots>): void {
  impls.set(assertion, impl);
  const stringified = JSON.stringify(assertion.strings);
  const existing = assertionMap.get(stringified) ?? new Set();
  existing.add(assertion);
  assertionMap.set(stringified, existing);
}

class Expectation<const Subject, const Strings extends AssertionStrings> {
  #subject: Subject;
  #strings: Strings;

  #assertions: Set<Assertion<Strings, any>>;

  constructor(subject: Subject, strings: Strings) {
    this.#strings = strings;
    this.#subject = subject;

    const stringified = JSON.stringify(strings);
    if (!assertionMap.has(stringified)) {
      throw new Error(`No assertion found for strings: ${stringified}`);
    }
    this.#assertions = assertionMap.get(stringified)!;
    for (const assertion of this.#assertions) {
      if (assertion.parse(this.#subject)) {
      }
    }
  }

  get strings(): Strings {
    return this.#strings;
  }

  get subject(): Subject {
    return this.#subject;
  }

  static create<Subject, const Strings extends AssertionStrings>(
    subject: Subject,
    strings: Strings,
  ): Expectation<Subject, Strings> {
    return new Expectation(subject, strings);
  }
}

addAssertion(
  assertion`${z.string()} to be a ${z.enum(['string', 'number', 'boolean'])}`,
  (expect, subject, type) => {
    switch (type) {
      case 'string': {
        if (typeof subject !== 'string') {
          throw new Error(`Expected ${subject} to be a string`);
        }
        break;
      }
      case 'number': {
        if (typeof subject !== 'number') {
          throw new Error(`Expected ${subject} to be a number`);
        }
        break;
      }
      case 'boolean': {
        if (typeof subject !== 'boolean') {
          throw new Error(`Expected ${subject} to be a boolean`);
        }
        break;
      }
    }
  },
);
addAssertion(
  assertion`${z.string()} to be a canonical name`,
  (expect, actual) => {
    expect(actual, 'to be a', 'string');

  },
);
type Expect = typeof expect;
function expect<Subject, const strings extends TemplateStringsArray>(
  subject: Subject,
  strings: strings,
) {
  return new Expectation(subject, strings);
}

// class Bupkis<const T extends TemplateStringsArray | [...string[]]> {
//   constructor(private readonly strings: T) {}
//   addAssertion<
//     const Strings extends TemplateStringsArray | [...string[]],
//     Slots extends Record<string, z.ZodType>,
//   >(assertion: Assertion<Strings, Slots>): Bupkis<[...T, ...Strings]> {
//     return new Bupkis([...this.strings, ...assertion.strings]);
//   }
// }

// let bupkis = new Bupkis([]);
// let bupkis2 = bupkis.addAssertion(
//   assertion`This is a test of ${z.string()} to be a canonical name`,
// );

//   const stringsCont = makeAssertionStringsContinuation(assertion.strings);
//   if (!assertions.has(stringsCont)) {
//     assertions.set(stringsCont, new Set());
//   }
//   const assertionSet = assertions.get(stringsCont)!;
//   if (assertionSet.has(makeAssertionContinuation(assertion))) {
//     return; // already added
//   }
//   assertionSet.add(makeAssertionContinuation(assertion));
//   assertions.set(stringsCont, assertionSet);
// }
// }

// const assertions = new Map<
//   AssertionStringsContinuation,
//   Set<AssertionContinuation>
// >();
// export function addAssertion<
//   Strings extends TemplateStringsArray,
//   Slots extends Record<string, z.ZodType>,
// >(assertion: Assertion<Strings, Slots>): void {
//   const stringsCont = makeAssertionStringsContinuation(assertion.strings);
//   if (!assertions.has(stringsCont)) {
//     assertions.set(stringsCont, new Set());
//   }
//   const assertionSet = assertions.get(stringsCont)!;
//   if (assertionSet.has(makeAssertionContinuation(assertion))) {
//     return; // already added
//   }
//   assertionSet.add(makeAssertionContinuation(assertion));
//   assertions.set(stringsCont, assertionSet);
// }

// addAssertion(assertion`${z.string()} to be a canonical name`);

// export function expect<T>(slot: T, strings: )

const person = 'Mike';
const age = 28;

function myTag(strings, personExp, ageExp) {
  const str0 = strings[0]; // "That "
  const str1 = strings[1]; // " is a "
  const str2 = strings[2]; // "."

  const ageStr = ageExp < 100 ? 'youngster' : 'centenarian';

  // We can even return a string built using a template literal
  return `${str0}${personExp}${str1}${ageStr}${str2}`;
}

const output = myTag`That ${person} is a ${age}.`;

console.log(output);
