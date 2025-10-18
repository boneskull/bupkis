# Claude Prompt: Task Implementation

**Purpose**: Execute implementation plans by breaking them into specific, actionable development tasks.

## Usage

Use this prompt when you have an implementation plan and need to execute it systematically.

## Instructions

### 1. Task Execution Framework

#### Task Types

- **Setup Tasks**: Project initialization, dependencies, configuration
- **Test Tasks**: Unit tests, property tests, integration tests
- **Core Tasks**: Implementation of main functionality
- **Integration Tasks**: Connecting components, plugin integration
- **Polish Tasks**: Documentation, performance optimization, cleanup

#### Execution Order

1. **Setup First**: Initialize environment and dependencies
2. **TDD Approach**: Write tests before implementation
3. **Core Development**: Implement main functionality
4. **Integration Work**: Connect components and systems
5. **Polish & Validation**: Optimize, document, and verify

### 2. Bupkis-Specific Task Patterns

#### Assertion Implementation Tasks

```markdown
### T001: Add Unit Tests for New Assertion

- File: `test/assertion/new-assertion.test.ts`
- Dependencies: None
- Parallel: Yes [P]

### T002: Implement Assertion Logic

- File: `src/assertion/impl/category.ts`
- Dependencies: T001
- Parallel: No (shared file)

### T003: Add Property Tests

- File: `test/property/category.test.ts`
- Dependencies: T002
- Parallel: Yes [P]

### T004: Update Type Definitions

- File: `src/types.ts`
- Dependencies: T002
- Parallel: No (shared file)
```

#### Performance Task Patterns

```markdown
### P001: Add Benchmark Suite

- File: `bench/new-feature-suite.ts`
- Dependencies: Implementation complete
- Parallel: Yes [P]

### P002: Performance Validation

- Command: `npm run bench -- --suite=new-feature`
- Dependencies: P001
- Parallel: No
```

### 3. Task Execution Rules

#### Dependency Management

- **Sequential Tasks**: Must complete in order (no [P] marker)
- **Parallel Tasks**: Can run simultaneously ([P] marker)
- **File Conflicts**: Tasks touching same files must be sequential
- **Test-First**: Write tests before implementation where possible

#### Quality Gates

- All tests must pass before moving to next phase
- Type checking must pass: `npm run lint:types`
- Linting must pass: `npm run lint:fix` then verify
- Performance benchmarks for critical paths

#### Error Handling

- Stop execution on test failures
- Report specific error context for debugging
- Suggest remediation steps for common issues
- Continue with parallel tasks if one fails

### 4. Implementation Process

#### Phase 1: Setup & Preparation

1. **Environment Setup**: Ensure all dependencies installed
2. **Branch Management**: Create feature branch if needed
3. **Test Infrastructure**: Set up test files and structure
4. **Baseline Validation**: Ensure existing tests pass

#### Phase 2: Test-First Development

1. **Unit Test Implementation**: Write comprehensive unit tests
2. **Property Test Setup**: Create property-based test configurations
3. **Integration Test Planning**: Define end-to-end test scenarios
4. **Test Validation**: Ensure tests fail appropriately before implementation

#### Phase 3: Core Implementation

1. **Interface Implementation**: Implement public APIs
2. **Internal Logic**: Develop core functionality
3. **Type System Integration**: Update type definitions and inference
4. **Error Handling**: Implement proper error messages and debugging

#### Phase 4: Integration & Validation

1. **Component Integration**: Connect new functionality to existing systems
2. **Plugin Integration**: Ensure compatibility with plugin system
3. **Performance Validation**: Run benchmarks and optimize if needed
4. **Regression Testing**: Ensure no existing functionality breaks

#### Phase 5: Polish & Documentation

1. **Code Quality**: Apply linting and style fixes
2. **Performance Optimization**: Address any performance issues
3. **Documentation Updates**: Update docs, examples, and comments
4. **Final Validation**: Complete test suite run and quality checks

### 5. Common Bupkis Workflows

#### New Assertion Implementation

1. Add unit tests for all assertion variants
2. Implement assertion logic in appropriate `impl/` file
3. Add property tests with coordinated generators
4. Update type definitions for inference
5. Add to benchmark suite if performance-critical

#### Performance Optimization

1. Add benchmark to measure current performance
2. Profile bottlenecks using appropriate tools
3. Implement optimizations incrementally
4. Validate improvements with benchmarks
5. Ensure no regressions in functionality

#### Bug Fix Implementation

1. Create failing test that reproduces the bug
2. Implement minimal fix to make test pass
3. Add additional edge case tests
4. Verify no regressions with full test suite
5. Update documentation if behavior changes

## Task Tracking

Use the todo system to track implementation progress:

```markdown
- [x] T001: Unit tests implemented
- [ ] T002: Core logic (in progress)
- [ ] T003: Property tests
- [ ] T004: Type definitions
```

## Example Usage

```bash
Please implement the custom error formatting feature using the task implementation prompt. Follow TDD approach and break work into specific, trackable tasks.
```

This will execute the implementation following the structured task-based approach above.
