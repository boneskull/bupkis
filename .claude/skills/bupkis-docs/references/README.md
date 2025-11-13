# Bupkis Documentation References

This directory contains detailed reference documentation for maintaining Bupkis project documentation.

## Purpose

Store detailed documentation that would make SKILL.md too long:

- Custom JSDoc tags reference
- Build process documentation
- TypeDoc configuration guidelines
- Documentation standards and conventions

## Usage

Claude will load these files into context when needed during documentation tasks.

## Available References

### `jsdoc-tags.md`

**Complete reference for custom JSDoc block tags**

**Contents:**

- `@bupkisAnchor` - Anchor ID specification
- `@bupkisAssertionCategory` - Category mapping with full list of valid categories
- `@bupkisRedirect` - Custom redirect paths
- Complete examples with generated redirects
- Validation checklist
- Plugin implementation details
- Troubleshooting guide

**Load when:**

- Adding new assertion implementations
- Fixing redirect issues
- Understanding tag syntax and validation
- Debugging category mapping errors

---

### `build-process.md`

**Comprehensive documentation build process guide**

**Contents:**

- Build commands (`docs:build`, `docs:dev`, `docs:serve`)
- TypeDoc configuration
- Custom plugin features (media copying, redirects, navigation icons)
- Complete build process flow with event timeline
- Directory structure (input/output)
- Build outputs and logs (success, warnings, failures)
- Strict mode (`--treatWarningsAsErrors`)
- Media file handling
- Troubleshooting common build issues

**Load when:**

- Running documentation builds
- Understanding build failures
- Debugging plugin behavior
- Setting up documentation workflow
- Optimizing build performance

---

### `testing-redirects.md`

**Guide for validating documentation redirects**

**Contents:**

- Validation script usage and options
- What the script validates (structure, format)
- Playwright MCP integration for e2e testing
- Common redirect issues and fixes
- Workflow integration (dev, release, CI/CD)
- Script architecture details
- Future enhancements (automated e2e, performance testing)

**Load when:**

- Testing documentation redirects
- Debugging broken redirects
- Setting up CI/CD validation
- Understanding redirect validation workflow

---

## Future Documentation

Consider adding these references as the project evolves:

1. **readme-structure.md** - Standard README sections and formatting conventions
2. **documentation-style.md** - Writing style guide, tone, and conventions
3. **badges.md** - Badge formats, URLs, and usage guidelines
4. **deployment.md** - Documentation deployment process (if applicable)
