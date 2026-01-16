# Changelog

## [0.18.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.17.0...bupkis-v0.18.0) (2026-01-16)


### Features

* **bupkis:** consolidate satisfy and deep equal assertions ([#338](https://github.com/boneskull/bupkis/issues/338)) ([edf0aa0](https://github.com/boneskull/bupkis/commit/edf0aa05d8563ba54252ab46f52c2b26ad1f640f))


### Bug Fixes

* **bupkis:** fix ArrayLike detection ([2a98011](https://github.com/boneskull/bupkis/commit/2a9801130f37ad85985c1bc2e8f2deabd3ad7897))
* **bupkis:** validate phrase position in assertion parts ([49e6cac](https://github.com/boneskull/bupkis/commit/49e6cacacac79091b1107ab1786ce80398627d32))


### Performance Improvements

* **bupkis:** add phrase-keyed index for assertion dispatch ([#335](https://github.com/boneskull/bupkis/issues/335)) ([1a67238](https://github.com/boneskull/bupkis/commit/1a672388c637bff883825c8721425fcf354d2a7a))

## [0.17.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.16.0...bupkis-v0.17.0) (2026-01-14)


### Features

* **bupkis:** support objects with own __proto__ property in valueToSchema ([6e3bb1d](https://github.com/boneskull/bupkis/commit/6e3bb1d1a6ebc2534044e8d1222e2a6e0045dfc3))


### Bug Fixes

* **deps:** fix deps, RP, versioning, etc. ([970529b](https://github.com/boneskull/bupkis/commit/970529b498f2bd61055181ac9e4c0ddaac9511fb))

## [0.16.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.15.0...bupkis-v0.16.0) (2026-01-14)


### Features

* **bupkis:** add iterable and async iterable assertions ([#326](https://github.com/boneskull/bupkis/issues/326)) ([cb33787](https://github.com/boneskull/bupkis/commit/cb337872d5b57ff9c5dc6ef779fb9e6910efef92))
* **bupkis:** add target filtering to fuzzer ([3cc8c2c](https://github.com/boneskull/bupkis/commit/3cc8c2cda209011054c14af0a67e0a213b9d41ff))
* **property-testing:** create @bupkis/property-testing ([#319](https://github.com/boneskull/bupkis/issues/319)) ([fbb378f](https://github.com/boneskull/bupkis/commit/fbb378f709e806c6d455bf77cafe55219302e2bb))


### Bug Fixes

* **bupkis:** expose NegatedAssertionError ([eb0754e](https://github.com/boneskull/bupkis/commit/eb0754e9932b9ae6d73506f893a781e84445985f))
* **bupkis:** recycle fuzzer workers to prevent OOM ([2e0ab31](https://github.com/boneskull/bupkis/commit/2e0ab317ef2f80621505786a85886e324fd35638))
* **bupkis:** use Symbol.for() for cross-module symbol identity ([daf94f4](https://github.com/boneskull/bupkis/commit/daf94f4f6ef44065caf88075719f7a0e80092cdf))
* **snapshot:** require Node.js v22+ for node:test snapshot testing ([25f92c3](https://github.com/boneskull/bupkis/commit/25f92c3fdbbaa3f9f823aa8cc61876577734388a))

## [0.15.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.14.0...bupkis-v0.15.0) (2026-01-11)


### Features

* **assertions:** add arrayItemSatisfiesAssertion ([220497b](https://github.com/boneskull/bupkis/commit/220497bbf65608d56fd6d12a3f321e5de5c71b6d))
* **assertions:** add stringLengthAssertion ([68e481f](https://github.com/boneskull/bupkis/commit/68e481fe5e70ac41116b781cf75c725813a4eace))
* custom diff support ([#308](https://github.com/boneskull/bupkis/issues/308)) ([5f07964](https://github.com/boneskull/bupkis/commit/5f079647503804129a49a4f1525bdd146d45b653))


### Bug Fixes

* **test:** filter Set generator to ensure minimum size after deduping ([93298e5](https://github.com/boneskull/bupkis/commit/93298e5e96474e73ac99fbd04713d9d379d128f1))

## [0.14.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.13.0...bupkis-v0.14.0) (2025-12-10)


### Features

* **assertions:** add "deep equal" for Map and Set ([#262](https://github.com/boneskull/bupkis/issues/262)) ([8a6b959](https://github.com/boneskull/bupkis/commit/8a6b95995b0eb37f28aa8afdbf42bcf2234f9d28))

## [0.13.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.12.2...bupkis-v0.13.0) (2025-11-13)


### Features

* **assertions:** implement snapshot testing ([fc3ebff](https://github.com/boneskull/bupkis/commit/fc3ebff8c03e190fcd293ba0859a38fde2a2343e))

## [0.12.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.12.1...bupkis-v0.12.2) (2025-10-31)


### Bug Fixes

* fix type declarations ([341fd21](https://github.com/boneskull/bupkis/commit/341fd2122acdd07bb90535cdf5bf60254a4c5357))

## [0.12.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.12.0...bupkis-v0.12.1) (2025-10-26)


### Bug Fixes

* **assertions:** function bodies of std. schema assertions now correctly infer arg types ([97a239e](https://github.com/boneskull/bupkis/commit/97a239e692a5dce73ae7282c5b68a911541223fe))

## [0.12.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.11.1...bupkis-v0.12.0) (2025-10-24)


### Features

* add Standard Schema V1 support for validation library interoperability ([d537cf2](https://github.com/boneskull/bupkis/commit/d537cf299e46aa53203bd6890bafbdbdb98cb825))


### Bug Fixes

* **diff:** fix diff output for incomparable types ([7ccc041](https://github.com/boneskull/bupkis/commit/7ccc0412a4e5c30a922fddd4b9a20368c3a8f077))
* **test:** update snapshots ([b5005c1](https://github.com/boneskull/bupkis/commit/b5005c13358dd5ae91fd0b6d09a99b842dfdbc79))

## [0.11.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.11.0...bupkis-v0.11.1) (2025-10-10)

### Bug Fixes

- **assertions:** remove non-deterministic date assertions ([e1569c3](https://github.com/boneskull/bupkis/commit/e1569c3c85572782e2bfe0bb9ecac89b9f2b4f49)), closes [#146](https://github.com/boneskull/bupkis/issues/146)

## [0.11.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.6...bupkis-v0.11.0) (2025-10-06)

### Features

- **assertions:** add some more aliases; cleanup ([a751cdb](https://github.com/boneskull/bupkis/commit/a751cdb1462ec77a8e17fc52c4d5434ca3197535))
- **schema:** add more schemas ([0b0c292](https://github.com/boneskull/bupkis/commit/0b0c2928a29c4615433e537d34637bdb1cd44af9))

### Bug Fixes

- **deps:** unpin type-fest ([e621d19](https://github.com/boneskull/bupkis/commit/e621d1982c371581206d49ec979b45eefddec125))

## [0.10.6](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.5...bupkis-v0.10.6) (2025-10-06)

### Bug Fixes

- **deps:** move type-fest to dependencies ([7db2b81](https://github.com/boneskull/bupkis/commit/7db2b81fa14d2cefdcc57835706e694fa0794830))

## [0.10.5](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.4...bupkis-v0.10.5) (2025-10-05)

### Bug Fixes

- **assertions:** better assertion error messages for regexes ([956c985](https://github.com/boneskull/bupkis/commit/956c9858b4a7c3c004fbe665cff2f1be1492b9c8))

## [0.10.4](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.3...bupkis-v0.10.4) (2025-10-05)

### Bug Fixes

- **ci:** re-enable token-based publishing ([f2183ee](https://github.com/boneskull/bupkis/commit/f2183eeb71068929e6794add5a763625d62a8717))

## [0.10.3](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.2...bupkis-v0.10.3) (2025-10-05)

### Bug Fixes

- **assertion:** remove metadata parameter from createAssertion/createAsyncAssertion ([3fb6681](https://github.com/boneskull/bupkis/commit/3fb6681cccc3e9af17e2f6f4071fb0b608ed85a2))
- **assertions:** error-reporting fixes for date assertions ([a9bcb4d](https://github.com/boneskull/bupkis/commit/a9bcb4d36abafa3a4dec4b5e9a1ba45c64bd7f4c))
- **assertions:** update weekend/weekday assertions to use UTC ([7e18155](https://github.com/boneskull/bupkis/commit/7e18155b08ffe4319081822ee6f6d9b9dd038443))
- **schema:** expose datetime-related schemas ([a9bcb4d](https://github.com/boneskull/bupkis/commit/a9bcb4d36abafa3a4dec4b5e9a1ba45c64bd7f4c))

## [0.10.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.1...bupkis-v0.10.2) (2025-10-04)

### Bug Fixes

- force release ([775efb1](https://github.com/boneskull/bupkis/commit/775efb1e539def520a8a22140f88d0098a426265))

## [0.10.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.10.0...bupkis-v0.10.1) (2025-10-04)

### Bug Fixes

- **assertions:** another fix for handling of conjuncted assertions w/ bare "and" phrases ([fb79b8b](https://github.com/boneskull/bupkis/commit/fb79b8bd0969f3ab71d93fe6ddfcc9b3fab93ff0))

## [0.10.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.9.0...bupkis-v0.10.0) (2025-10-03)

### Features

- **assertions:** add more date assertions ([ab8365c](https://github.com/boneskull/bupkis/commit/ab8365cbcf09c9c56fb88d174880c5e72d608f03))

### Bug Fixes

- **assertions:** more accurate string representations of assertions ([b78c36a](https://github.com/boneskull/bupkis/commit/b78c36a103f07bb3a06b327231186ef5f34fed82))
- **deps:** update dependency jest-diff to v30.2.0 ([#103](https://github.com/boneskull/bupkis/issues/103)) ([dba6f6f](https://github.com/boneskull/bupkis/commit/dba6f6ff3858c5e5d4351bcaaef7c991145a5252))
- **error:** AssertionErrorOptions fix for @types/node ([7aef073](https://github.com/boneskull/bupkis/commit/7aef0737ac5e2960d63aeacb3e2f7851e23c79ff))
- **expect:** proper handling of assertions containing bare "and" phrases ([0ad9eee](https://github.com/boneskull/bupkis/commit/0ad9eeeac73173cb3fc5c05173a22b8baed51efe))

## [0.9.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.8.0...bupkis-v0.9.0) (2025-09-29)

### Features

- **assertion:** allow chaining assertions with "and" ([e76e772](https://github.com/boneskull/bupkis/commit/e76e772395afeb613b0936b2ac0fb3ed9792aa0e))
- **assertions:** assertions can return Assertion Parse Request objects ([43fa2d1](https://github.com/boneskull/bupkis/commit/43fa2d14aed32caff7f665845b7471b014a6c266))

## [0.8.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.7.2...bupkis-v0.8.0) (2025-09-25)

### Features

- proper diffs ([ef29531](https://github.com/boneskull/bupkis/commit/ef295313cf5e8b5b0b0357098f4f7ee22414403d))

## [0.7.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.7.1...bupkis-v0.7.2) (2025-09-22)

### Bug Fixes

- **release:** revert change to publish action ([5342626](https://github.com/boneskull/bupkis/commit/5342626daa65b75994bd9681f356f24fef7a25ba))

## [0.7.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.7.0...bupkis-v0.7.1) (2025-09-22)

### Bug Fixes

- **release:** release 0.7.0 ([488f0dc](https://github.com/boneskull/bupkis/commit/488f0dc6f74a8c83fd97ec6ea1bd937bf2df0032))
- **release:** release 0.7.1 ([7505fb8](https://github.com/boneskull/bupkis/commit/7505fb810a22d0f433af6403c9ff3fa492279884))

## [0.7.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.7.0...bupkis-v0.7.0) (2025-09-22)

### Bug Fixes

- **release:** release 0.7.0 ([488f0dc](https://github.com/boneskull/bupkis/commit/488f0dc6f74a8c83fd97ec6ea1bd937bf2df0032))

## [0.7.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.6.0...bupkis-v0.7.0) (2025-09-22)

### Features

- add proper errors, codes ([1f3b149](https://github.com/boneskull/bupkis/commit/1f3b149e1aa42f90469b96244224fe6736175c25))

### Bug Fixes

- **guards:** thenable.then must have at least one parameter ([41a987e](https://github.com/boneskull/bupkis/commit/41a987e5ec131b780124bf6459b900bf15643987))
- re-export schema namespace ([497bad7](https://github.com/boneskull/bupkis/commit/497bad7104b6ee5195f5c4d566837e8e34a1d744))

## [0.6.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.5.1...bupkis-v0.6.0) (2025-09-22)

### Features

- **assertions:** create expectAsync.it ([fb4db5a](https://github.com/boneskull/bupkis/commit/fb4db5afc4d2ab6e0affc073ab03c670264a3bbd))

### Bug Fixes

- **assertions:** "map/set to have size greater than" now expects nonnegative int size ([2355ba0](https://github.com/boneskull/bupkis/commit/2355ba0494baeb5050024e6fadd8a28a900f5dcc))
- **assertions:** narrow some schemas ([fc0b708](https://github.com/boneskull/bupkis/commit/fc0b7086ba898a43f3c9558aff6ede30723e38c6))

## [0.5.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.5.0...bupkis-v0.5.1) (2025-09-18)

### Bug Fixes

- **errors:** fix AssertionError output ([8fae815](https://github.com/boneskull/bupkis/commit/8fae81585121026b9869489f39ba8c5dfb834834))

## [0.5.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.4.0...bupkis-v0.5.0) (2025-09-18)

### Features

- **assertions:** implement "to have key" and "to have exact key" ([8bb53cc](https://github.com/boneskull/bupkis/commit/8bb53cc6c6457b52f16f9057b1287005bc9a80df))
- more set/map assertions ([ec9e0f4](https://github.com/boneskull/bupkis/commit/ec9e0f46cd2ec0d0d097b54b3d0d9400fbb79c9d)), closes [#27](https://github.com/boneskull/bupkis/issues/27)
- **util:** implement `get` and `has` functions (like lodash's) supporting keypaths ([8bb53cc](https://github.com/boneskull/bupkis/commit/8bb53cc6c6457b52f16f9057b1287005bc9a80df))

### Bug Fixes

- "to satisfy" now accepts any value for comparison ([ec9e0f4](https://github.com/boneskull/bupkis/commit/ec9e0f46cd2ec0d0d097b54b3d0d9400fbb79c9d))
- **assertions:** widen allowed subjects for "to have keys" assertion ([8bb53cc](https://github.com/boneskull/bupkis/commit/8bb53cc6c6457b52f16f9057b1287005bc9a80df))
- many edge cases ([ec9e0f4](https://github.com/boneskull/bupkis/commit/ec9e0f46cd2ec0d0d097b54b3d0d9400fbb79c9d))

## [0.4.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.3.0...bupkis-v0.4.0) (2025-09-15)

### Features

- implement embeddable assertions ([3050d1c](https://github.com/boneskull/bupkis/commit/3050d1c0d57048a840449935fd0dfead370b0f11)), closes [#46](https://github.com/boneskull/bupkis/issues/46)

### Bug Fixes

- **schema:** rename ClassSchema to ConstructibleSchema ([#47](https://github.com/boneskull/bupkis/issues/47)) ([c497a24](https://github.com/boneskull/bupkis/commit/c497a249ad6428a8a2082aadfd7796c1e7f8b82f))

## [0.3.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.2.0...bupkis-v0.3.0) (2025-09-14)

### Features

- **assertions:** add callback assertions ([a879213](https://github.com/boneskull/bupkis/commit/a87921398e63583fe75e8085ea20bb4406d0dbdb))
- **createAssertion:** allow ZodError return types from assertion implementation functions ([0dbd940](https://github.com/boneskull/bupkis/commit/0dbd94028da4761f6c4842fd6411782b20925b82))

### Bug Fixes

- **assertions:** fix all manner of issues w/r/t "to satisfies" and deep equality ([c0800a3](https://github.com/boneskull/bupkis/commit/c0800a3523876ac6b1b3083325f2bb3dafed8bdc))
- **assertions:** fix edge-cases in "to satisfy" and "deep equal" assertions ([a879213](https://github.com/boneskull/bupkis/commit/a87921398e63583fe75e8085ea20bb4406d0dbdb))
- restore caching for async schema assertions ([8b62d74](https://github.com/boneskull/bupkis/commit/8b62d74db596155a1cf10e2da55dfe251b082589))

## [0.2.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.1.2...bupkis-v0.2.0) (2025-09-10)

### Features

- add "assertions" subpath export ([692421b](https://github.com/boneskull/bupkis/commit/692421b5831a440fce0d0e9fe191a4aeba61a808))
- **assertion:** add alias "to be between" for "to be within" ([6e20646](https://github.com/boneskull/bupkis/commit/6e2064671b0b8e4ca35db55fd8ec90211956f303))

### Bug Fixes

- rename "to resolve to value satisfying" async assertions to "resolve with value satisfying" ([3a39a3e](https://github.com/boneskull/bupkis/commit/3a39a3e18ea2899f8c8ec8cbabdff9475dfbe41d))

## [0.1.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.1.1...bupkis-v0.1.2) (2025-09-09)

### Bug Fixes

- **util:** isConstructable handles Symbol and BigInt properly ([c13747a](https://github.com/boneskull/bupkis/commit/c13747aa57b5806c38389c1d8347a2966cb17f22))

## [0.1.1](https://github.com/boneskull/bupkis/compare/bupkis-v0.1.0...bupkis-v0.1.1) (2025-09-09)

### Bug Fixes

- actually build before publish ([996c28e](https://github.com/boneskull/bupkis/commit/996c28e223ce488d07ea0b7633829ff25d510be3))

## [0.1.0](https://github.com/boneskull/bupkis/compare/bupkis-v0.0.2...bupkis-v0.1.0) (2025-09-08)

### Features

- **use:** use() returns an object with a use() in it ([fb383d6](https://github.com/boneskull/bupkis/commit/fb383d6fb2f541085d2300664fe73b25c6249e42))

### Bug Fixes

- **package:** add description and homepage ([2ff82ea](https://github.com/boneskull/bupkis/commit/2ff82ea715280098f59612ba32da808308aced0e))

## [0.0.2](https://github.com/boneskull/bupkis/compare/bupkis-v0.0.1...bupkis-v0.0.2) (2025-09-07)

### Bug Fixes

- add repository to package.json ([4d687a5](https://github.com/boneskull/bupkis/commit/4d687a54c4fb34331508011df14fcfd966bf7ad3))

## 0.0.1 (2025-09-07)

### Features

- "initial commit" ([04f234c](https://github.com/boneskull/bupkis/commit/04f234c8f8cea4cef5bae0dc7ccb692eb91d8748))

### Bug Fixes

- remove ref to distfile ([5de9a6b](https://github.com/boneskull/bupkis/commit/5de9a6b6f7bebe3f8898eecc3ae2212e183c3a16))
