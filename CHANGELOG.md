# Changelog

## [0.7.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.6.0...bupkis-v0.7.0) (2025-09-22)


### Features

* add proper errors, codes ([1f3b149](https://github.com/boneskull/bupkis/commit/1f3b149e1aa42f90469b96244224fe6736175c25))


### Bug Fixes

* **guards:** thenable.then must have at least one parameter ([41a987e](https://github.com/boneskull/bupkis/commit/41a987e5ec131b780124bf6459b900bf15643987))
* re-export schema namespace ([497bad7](https://github.com/boneskull/bupkis/commit/497bad7104b6ee5195f5c4d566837e8e34a1d744))

## [0.6.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.5.1...bupkis-v0.6.0) (2025-09-22)


### Features

* **assertions:** create expectAsync.it ([fb4db5a](https://github.com/boneskull/bupkis/commit/fb4db5afc4d2ab6e0affc073ab03c670264a3bbd))


### Bug Fixes

* **assertions:** "map/set to have size greater than" now expects nonnegative int size ([2355ba0](https://github.com/boneskull/bupkis/commit/2355ba0494baeb5050024e6fadd8a28a900f5dcc))
* **assertions:** narrow some schemas ([fc0b708](https://github.com/boneskull/bupkis/commit/fc0b7086ba898a43f3c9558aff6ede30723e38c6))

## [0.5.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.5.0...bupkis-v0.5.1) (2025-09-18)


### Bug Fixes

* **errors:** fix AssertionError output ([8fae815](https://github.com/boneskull/bupkis/commit/8fae81585121026b9869489f39ba8c5dfb834834))

## [0.5.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.4.0...bupkis-v0.5.0) (2025-09-18)


### Features

* **assertions:** implement "to have key" and "to have exact key" ([8bb53cc](https://github.com/boneskull/bupkis/commit/8bb53cc6c6457b52f16f9057b1287005bc9a80df))
* more set/map assertions ([ec9e0f4](https://github.com/boneskull/bupkis/commit/ec9e0f46cd2ec0d0d097b54b3d0d9400fbb79c9d)), closes [#27](https://github.com/boneskull/bupkis/issues/27)
* **util:** implement `get` and `has` functions (like lodash's) supporting keypaths ([8bb53cc](https://github.com/boneskull/bupkis/commit/8bb53cc6c6457b52f16f9057b1287005bc9a80df))


### Bug Fixes

* "to satisfy" now accepts any value for comparison ([ec9e0f4](https://github.com/boneskull/bupkis/commit/ec9e0f46cd2ec0d0d097b54b3d0d9400fbb79c9d))
* **assertions:** widen allowed subjects for "to have keys" assertion ([8bb53cc](https://github.com/boneskull/bupkis/commit/8bb53cc6c6457b52f16f9057b1287005bc9a80df))
* many edge cases ([ec9e0f4](https://github.com/boneskull/bupkis/commit/ec9e0f46cd2ec0d0d097b54b3d0d9400fbb79c9d))

## [0.4.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.3.0...bupkis-v0.4.0) (2025-09-15)


### Features

* implement embeddable assertions ([3050d1c](https://github.com/boneskull/bupkis/commit/3050d1c0d57048a840449935fd0dfead370b0f11)), closes [#46](https://github.com/boneskull/bupkis/issues/46)


### Bug Fixes

* **schema:** rename ClassSchema to ConstructibleSchema ([#47](https://github.com/boneskull/bupkis/issues/47)) ([c497a24](https://github.com/boneskull/bupkis/commit/c497a249ad6428a8a2082aadfd7796c1e7f8b82f))

## [0.3.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.2.0...bupkis-v0.3.0) (2025-09-14)


### Features

* **assertions:** add callback assertions ([a879213](https://github.com/boneskull/bupkis/commit/a87921398e63583fe75e8085ea20bb4406d0dbdb))
* **createAssertion:** allow ZodError return types from assertion implementation functions ([0dbd940](https://github.com/boneskull/bupkis/commit/0dbd94028da4761f6c4842fd6411782b20925b82))


### Bug Fixes

* **assertions:** fix all manner of issues w/r/t "to satisfies" and deep equality ([c0800a3](https://github.com/boneskull/bupkis/commit/c0800a3523876ac6b1b3083325f2bb3dafed8bdc))
* **assertions:** fix edge-cases in "to satisfy" and "deep equal" assertions ([a879213](https://github.com/boneskull/bupkis/commit/a87921398e63583fe75e8085ea20bb4406d0dbdb))
* restore caching for async schema assertions ([8b62d74](https://github.com/boneskull/bupkis/commit/8b62d74db596155a1cf10e2da55dfe251b082589))

## [0.2.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.1.2...bupkis-v0.2.0) (2025-09-10)


### Features

* add "assertions" subpath export ([692421b](https://github.com/boneskull/bupkis/commit/692421b5831a440fce0d0e9fe191a4aeba61a808))
* **assertion:** add alias "to be between" for "to be within" ([6e20646](https://github.com/boneskull/bupkis/commit/6e2064671b0b8e4ca35db55fd8ec90211956f303))


### Bug Fixes

* rename "to resolve to value satisfying" async assertions to "resolve with value satisfying" ([3a39a3e](https://github.com/boneskull/bupkis/commit/3a39a3e18ea2899f8c8ec8cbabdff9475dfbe41d))

## [0.1.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.1.1...bupkis-v0.1.2) (2025-09-09)


### Bug Fixes

* **util:** isConstructable handles Symbol and BigInt properly ([c13747a](https://github.com/boneskull/bupkis/commit/c13747aa57b5806c38389c1d8347a2966cb17f22))

## [0.1.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.1.0...bupkis-v0.1.1) (2025-09-09)


### Bug Fixes

* actually build before publish ([996c28e](https://github.com/boneskull/bupkis/commit/996c28e223ce488d07ea0b7633829ff25d510be3))

## [0.1.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.0.2...bupkis-v0.1.0) (2025-09-08)


### Features

* **use:** use() returns an object with a use() in it ([fb383d6](https://github.com/boneskull/bupkis/commit/fb383d6fb2f541085d2300664fe73b25c6249e42))


### Bug Fixes

* **package:** add description and homepage ([2ff82ea](https://github.com/boneskull/bupkis/commit/2ff82ea715280098f59612ba32da808308aced0e))

## [0.0.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.0.1...bupkis-v0.0.2) (2025-09-07)


### Bug Fixes

* add repository to package.json ([4d687a5](https://github.com/boneskull/bupkis/commit/4d687a54c4fb34331508011df14fcfd966bf7ad3))

## 0.0.1 (2025-09-07)


### Features

* "initial commit" ([04f234c](https://github.com/boneskull/bupkis/commit/04f234c8f8cea4cef5bae0dc7ccb692eb91d8748))


### Bug Fixes

* remove ref to distfile ([5de9a6b](https://github.com/boneskull/bupkis/commit/5de9a6b6f7bebe3f8898eecc3ae2212e183c3a16))
