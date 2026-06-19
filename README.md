<p align="center">
  <a href="/"><img src="./assets/bupkis-logo-512.png" width="512px" align="center" alt="BUPKIS: The Glory of Certainty"/></a>
  <h1 align="center"><span class="bupkis">⁓ BUPKIS ⁓<span></h1>
  <p align="center">
    <em>“Uncommonly Extensible Assertions for The Beautiful People”</em>
    <br/>
    <small>by <a href="https://github.com/boneskull" title="@boneskull on GitHub">@boneskull</a></small>
  </p>
</p>

---

This is the monorepo for [**BUPKIS**][docs], the _uncommonly extensible assertion library._

## Packages

- **[bupkis](./packages/bupkis/)** - 🚨 The only _edible_ assertion library, **BUPKIS** 🚨

### Plugins

- **[@bupkis/events](./packages/events/)** - Event emitter assertions
- **[@bupkis/http](./packages/http/)** - HTTP response assertions
- **[@bupkis/msw](./packages/msw/)** - [MSW][] request verification assertions
- **[@bupkis/rxjs](./packages/rxjs/)** - [RxJS][] Observable assertions
- **[@bupkis/sinon](./packages/sinon/)** - [Sinon.JS][] spy/stub/mock assertions

### Migration Tools

- **[@bupkis/from-assert](./packages/from-assert/)** - Codemod to migrate [node:assert][] assertions to **BUPKIS**
- **[@bupkis/from-chai](./packages/from-chai/)** - Codemod to migrate [Chai][] assertions to **BUPKIS**
- **[@bupkis/from-jest](./packages/from-jest/)** - Codemod to migrate [Jest][]/[Vitest][] assertions to **BUPKIS**

### Testing Tools

- **[@bupkis/property-testing](./packages/property-testing/)** - Property-based testing harness for **BUPKIS** assertions

### Internal

- **[@bupkis/codemod-core](./packages/codemod-core/)** - Shared utilities for **BUPKIS** codemods

## Resources

- [Official Documentation][docs] (accept no substitutes)
- [**BUPKIS** on npm][npm]
- [**BUPKIS** on GitHub][GitHub]

## ~~Slop~~ AI Usage Disclosure

The `bupkis` package itself is very much the work of a human ([boneskull][])
with AI assistance. _However_, this human freely (though not _proudly_) admits
to vibe-coding most of the other packages. They were vibe-coded _carefully_, but
vibe-coded nonetheless.

| Package                    | Details                                                |
| -------------------------- | ------------------------------------------------------ |
| `bupkis`                   | API doc gen (docstrings), debugging, automating tedium |
| `@bupkis/property-testing` | Debugging, automating tedium                           |
| `@bupkis/sinon`            | Mostly slop                                            |
| `@bupkis/rxjs`             | Mostly slop                                            |
| `@bupkis/msw`              | Slop                                                   |
| `@bupkis/http`             | Slop                                                   |
| `@bupkis/events`           | Mostly slop                                            |
| `@bupkis/codemod-core`     | Slop                                                   |
| `@bupkis/from-assert`      | Slop                                                   |
| `@bupkis/from-chai`        | Slop                                                   |
| `@bupkis/from-jest`        | Slop                                                   |

## License

Copyright © 2025 [Christopher "boneskull" Hiller][boneskull]. Licensed under [BlueOak-1.0.0][].

[boneskull]: https://github.com/boneskull
[MSW]: https://mswjs.io
[RxJS]: https://rxjs.dev
[Sinon.JS]: https://sinonjs.org
[docs]: https://bupkis.zip
[npm]: https://www.npmjs.com/package/bupkis
[GitHub]: https://github.com/boneskull/bupkis
[BlueOak-1.0.0]: https://blueoakcouncil.org/license/1.0.0
[Jest]: https://jestjs.io
[Vitest]: https://vitest.dev
[Chai]: https://www.chaijs.com
[node:assert]: https://nodejs.org/api/assert.html
