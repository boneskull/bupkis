# Contributing to Bupkis

Thank you for your interest in contributing to Bupkis! We welcome contributions from everyone and are grateful for every contribution made.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that the problem has already been reported. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title** for the issue
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed** and **explain which behavior you expected to see**
- **Include code samples** that demonstrate the issue
- **Specify the version of Bupkis you're using**
- **Specify your Node.js version and operating system**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Provide examples of how the enhancement would be used**

### Pull Requests

- **Fill in the required template**
- **Include screenshots or animated GIFs in your pull request when appropriate**
- **Follow the TypeScript and JavaScript style guides**
- **Include thoughtfully-worded, well-structured tests**
- **Document new code with TSDoc comments**
- **End all files with a newline**

## Development Setup

### Prerequisites

- Node.js (see `engines` field in `package.json` for supported versions)
- npm (comes with Node.js)

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/bupkis.git
   cd bupkis
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a branch for your changes:

   ```bash
   git checkout -b your-feature-branch
   ```

### Building the Project

```bash
# Build for production
npm run build

# Build in watch mode for development
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run property-based tests only
npm run test:property

# Run property tests in watch mode
npm run test:property:dev
```

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Fix auto-fixable ESLint issues
npm run lint:fix

# Run TypeScript type checking
npm run lint:types

# Run type checking in watch mode
npm run lint:types:dev
```

## Project Structure

- `src/` - Main library source code
  - `assertion/` - Core assertion framework
    - `impl/` - Built-in assertion implementations
  - `expect.ts` - Main entry points (`expect`, `expectAsync`)
  - `types.ts` - TypeScript type definitions
- `test/` - Test suite
  - `property/` - Property-based tests using fast-check
  - `assertion/` - Unit tests for assertions
- `docs/` - Generated API documentation
- `site/` - Documentation source files

## Coding Guidelines

### TypeScript/JavaScript Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Use meaningful variable and function names
- Add TSDoc comments for public APIs
- Prefer explicit types over `any`

### Testing Guidelines

- Write tests for all new functionality
- Use property-based testing for assertion logic when appropriate
- Follow the existing test patterns
- Ensure tests are deterministic and don't rely on external dependencies

### Assertion Development

When creating new assertions:

1. Use `createAssertion()` or `createAsyncAssertion()` from the assertion creation utilities
2. Follow natural language patterns for assertion phrases
3. Provide comprehensive examples in TSDoc comments
4. Write both unit tests and property-based tests
5. Update documentation as needed

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Documentation

- Use TSDoc for inline code documentation
- Update relevant documentation when changing APIs
- Include examples in your documentation
- Follow the existing documentation patterns

## Debugging

- Set `DEBUG=bupkis*` environment variable for detailed logging
- Use Wallaby.js integration for real-time testing feedback
- Check the browser developer tools for client-side issues

## Release Process

Releases are managed by maintainers using automated tools. Contributors don't need to worry about versioning or publishing.

## Getting Help

- Check existing issues and discussions
- Create a new issue if you need help
- Be respectful and patient when asking for help

## Recognition

All contributors will be recognized in the project. We appreciate all forms of contribution, including but not limited to:

- Code contributions
- Bug reports
- Documentation improvements
- Feature suggestions
- Testing and feedback

Thank you for contributing to Bupkis! 🎉
