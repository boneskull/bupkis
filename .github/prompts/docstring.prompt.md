---
mode: 'agent'
model: Claude Sonnet 4
tools: ['codebase', 'usages', 'think', 'problems', 'testFailure', 'openSimpleBrowser', 'findTestFiles', 'searchResults', 'githubRepo', 'runTests', 'editFiles', 'search', 'runTasks']
description: 'Generate a docstring for the selected code'
---

Your goal is to generate a comprehensive docstring for the selected code.

- If selected code is in a JavaScript file, use TypeScript-style docstring syntax (TSDoc). Similarly, in a TypeScript file, do the same but omit types as these are redundant with the source code.

- If selected code is in another language, use your best judgement on how to document according to common conventions.

The rest of these instructions will assume TypeScript or JavaScript sources and can be disregarded for other languages.

- Always use a multiline-style docstring, even for short descriptions.

- Add descriptions for all parameters, return values, and thrown exceptions. Use appropriate tags according to the TSDoc standard, including:
  - `@defaultValue` for default parameter values
  - `@example` for usage examples. Usage examples should be in the same language as the source code (JavaScript or TypeScript).
  - `@see` for references to related functions, classes, or documentation
  - Inline tag `{@link ...}` for cross-references within the docstring text
  - `@remarks` for additional notes or caveats about the function's behavior
  - `@privateRemarks` for implementation details that are not part of the public API
  - `@internal` for functions or classes that are exported but not obviously part of the public API
  - `@override` for methods that override a parent class method
  - `@deprecated` for deprecated functions or parameters, including a note on what to use instead. Unless there's a comment in the selected code hinting at deprecation, do not add this tag
  - `@param` for function parameters
  - `@returns` for return values
  - `@throws` for exceptions that the function may throw
  - `@typeParam` for describing generic type arguments
  - `@virtual` if the function is in a superclass and is overridden by a subclass

- You may fetch & navigate the TSDoc standard at https://tsdoc.org/pages/tags/alpha/ to ensure correct usage of tags.

- The first line of the docstring should be a _concise_ summary of the function's purpose; a single sentence that clearly describes what the function does.

- Add a double-linebreak after the summary line before any further details. Detailed description should then follow.

- Place all modifier tags after the detailed description, each on its own line.

- If the selected code is an entire module, create a docstring with a summary and detailed description (as explained above), and use the `@packageDocumentation` tag as the last line of the docstring body.

- Text referring to a linkable symbol should wrap the text using inline `{@link ...}` tag the _first_ time only; wrap in backticks thereafter.

- If a function has overloads, each overload _and_ the implementation should have its own docstring. Each docstring should be specific to the overload or implementation it describes.

- Any text _within a paragraph_ that refers to another symbol (such as a type, function, class, etc.) should use the inline `{@link ...}` tag (if the symbol is in scope) and wrap in backticks otherwise. Any filenames should also be linked using `file://` URLs.

- You cannot reference a symbol tagged `@internal` from the docstring of a non-`@internal` symbol _except_ within a `@privateRemarks` block tag.


