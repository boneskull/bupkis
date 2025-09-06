# About Schemas

The schemas located in [schema.ts](./schema.ts) are used internally, but will be helpful for anyone implementing custom assertions.

These contain workarounds for where Zod's concepts and scope conflict with the aim of _BUPKIS_.

For example, we have a `FunctionSchema` which accepts any function, regardless of its signature. Zod v4's `z.function()` is no longer a `ZodType` and acts differently, but this schema allows us to validate "is a function" assertions and perform assertion matching.

Likewise, `z.promise()` does not parse a `Promise` instance, but rather the resolved value of a promise. This is not what we want for "is a Promise" assertions, so we have `PromiseSchema` to handle that.
