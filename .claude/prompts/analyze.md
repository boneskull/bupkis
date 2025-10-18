# Claude Prompt: Code Analysis

**Purpose**: Perform comprehensive code analysis to identify issues, inconsistencies, and improvement opportunities.

## Usage

Reference this prompt when you need to analyze code quality, architecture, or implementation details.

## Instructions

### 1. Analysis Scope

- **Code Quality**: Review for clarity, maintainability, and best practices
- **Architecture**: Assess structure, separation of concerns, and design patterns
- **Performance**: Identify potential bottlenecks and optimization opportunities
- **Testing**: Evaluate test coverage, quality, and completeness
- **Documentation**: Check for adequate comments and documentation

### 2. Focus Areas for Bupkis

#### Type System Analysis

- Review recursive conditional types for complexity and maintainability
- Check TypeScript compilation performance impact
- Validate type inference accuracy across assertion patterns
- Assess branded type usage and effectiveness

#### Assertion Implementation Review

- Verify dual sync/async execution correctness
- Check Zod schema composition and validation logic
- Review natural language parsing accuracy
- Assess error message quality and debugging information

#### Performance Analysis

- Measure assertion matching loop efficiency
- Evaluate property test execution time
- Check for circular reference detection overhead
- Analyze build time and bundle size impact

#### Test Coverage Assessment

- Review unit test completeness for all assertions
- Validate property-based test configurations
- Check edge case coverage
- Assess integration test scenarios

### 3. Analysis Process

1. **Read and Understand**: Review the codebase section by section
2. **Identify Patterns**: Look for recurring patterns and anti-patterns
3. **Check Consistency**: Ensure consistent naming, structure, and conventions
4. **Assess Quality**: Evaluate code quality metrics and best practices
5. **Document Issues**: Create structured findings with severity levels

### 4. Output Format

#### Findings Table

| ID  | Category    | Severity | Location         | Issue                  | Recommendation     |
| --- | ----------- | -------- | ---------------- | ---------------------- | ------------------ |
| A1  | Performance | HIGH     | types.ts:120-135 | Complex recursive type | Simplify or cache  |
| B2  | Testing     | MEDIUM   | test/property/   | Missing edge cases     | Add boundary tests |

#### Severity Levels

- **CRITICAL**: Breaks functionality, security issues, major performance problems
- **HIGH**: Significant maintainability issues, important missing features
- **MEDIUM**: Code quality improvements, minor performance issues
- **LOW**: Style preferences, minor optimizations

### 5. Bupkis-Specific Checks

#### Common Issues

- **Object Parameter Matching**: Verify `valueToSchema()` configuration
- **Async Return Types**: Ensure functions return booleans, not schemas
- **Property Test Coordination**: Check generator coordination and ID mapping
- **Type Recursion Limits**: Monitor TypeScript compilation issues

#### Performance Hotspots

- Assertion matching loops
- Complex type operations
- Property test generators
- Zod validation overhead

#### Integration Points

- Node.js test framework compatibility
- Zod v4 usage patterns
- Fast-check integration
- Build system configuration

## Example Usage

```bash
Please analyze the assertion implementation in src/assertion/impl/sync-basic.ts using the code analysis prompt. Focus on type safety, performance, and maintainability.
```

This will trigger a comprehensive analysis following the structured approach above.
