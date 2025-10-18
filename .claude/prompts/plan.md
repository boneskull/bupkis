# Claude Prompt: Implementation Planning

**Purpose**: Create detailed implementation plans for new features or major changes to the Bupkis assertion library.

## Usage

Use this prompt when starting significant new development work that requires architectural planning.

## Instructions

### 1. Planning Scope

- **Feature Requirements**: Understand the complete feature specification
- **Technical Design**: Plan architecture, data structures, and interfaces
- **Implementation Strategy**: Break down work into phases and tasks
- **Integration Points**: Identify dependencies and integration requirements
- **Testing Strategy**: Plan comprehensive test coverage

### 2. Bupkis-Specific Planning

#### Architecture Considerations

- **Assertion Framework**: How does this fit into the existing assertion system?
- **Type System**: What type-level changes are needed?
- **Sync/Async**: Does this require both execution paths?
- **Plugin System**: How does this integrate with the `use()` system?

#### Performance Planning

- **Assertion Matching**: Impact on the assertion discovery loop
- **Type Compilation**: Effect on TypeScript compilation time
- **Runtime Performance**: Execution overhead considerations
- **Bundle Size**: Impact on library size

#### Testing Strategy

- **Unit Tests**: Individual assertion and utility testing
- **Property Tests**: Fast-check integration for comprehensive coverage
- **Integration Tests**: End-to-end assertion usage scenarios
- **Performance Tests**: Benchmark suite integration

### 3. Planning Process

#### Phase 1: Analysis & Design

1. **Requirements Review**: Understand the complete feature specification
2. **Current State Analysis**: Review existing codebase for relevant patterns
3. **Architecture Design**: Plan the technical implementation approach
4. **Interface Design**: Define public APIs and internal interfaces
5. **Risk Assessment**: Identify potential challenges and mitigation strategies

#### Phase 2: Implementation Planning

1. **Task Breakdown**: Create specific, actionable development tasks
2. **Dependency Mapping**: Identify task dependencies and prerequisites
3. **Parallel Work**: Identify tasks that can be done concurrently
4. **Testing Integration**: Plan test development alongside implementation
5. **Documentation Planning**: Plan updates to docs and examples

#### Phase 3: Validation Planning

1. **Quality Gates**: Define acceptance criteria for each phase
2. **Performance Benchmarks**: Plan performance validation approach
3. **Integration Validation**: Plan testing with existing features
4. **Documentation Review**: Plan documentation updates and validation

### 4. Output Structure

#### Implementation Plan Document

```markdown
# Feature Implementation Plan

## Overview

Brief description and goals

## Technical Design

### Architecture Changes

### New Components

### Modified Components

### Integration Points

## Implementation Phases

### Phase 1: Foundation

### Phase 2: Core Implementation

### Phase 3: Integration & Polish

## Testing Strategy

### Unit Tests

### Property Tests

### Integration Tests

### Performance Tests

## Risks & Mitigation

### Technical Risks

### Performance Risks

### Compatibility Risks

## Success Criteria

### Functional Requirements

### Performance Requirements

### Quality Requirements
```

### 5. Bupkis Integration Patterns

#### Assertion Implementation

- Follow existing patterns in `src/assertion/impl/`
- Use `createAssertion()` factory functions
- Implement both sync and async variants if needed
- Ensure proper type inference integration

#### Type System Integration

- Extend existing type inference system
- Add new assertion slots and parsing logic
- Maintain compatibility with existing type signatures
- Consider TypeScript compilation performance

#### Testing Integration

- Add unit tests following existing patterns
- Create property tests with coordinated generators
- Update benchmark suites if performance-critical
- Ensure integration with existing test utilities

## Example Usage

```bash
Please create an implementation plan for adding support for custom error message formatting in assertions. Use the implementation planning prompt to structure a comprehensive technical design.
```

This will generate a detailed plan following the structured approach above, tailored to the Bupkis architecture and patterns.
