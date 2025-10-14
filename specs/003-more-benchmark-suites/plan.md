# Implementation Plan: Enhanced Benchmark Suite Partitioning

**Branch**: `003-more-benchmark-suites` | **Date**: October 12, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-more-benchmark-suites/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

The feature enhances the existing Bupkis benchmark runner by partitioning the `sync-function` suite into two new suites: `sync-function-pure` (returns `AssertionFailure` or `boolean`) and `sync-function-schema` (returns Zod schema or `AssertionParseRequest`). This enables targeted performance analysis based on assertion return types while maintaining backward compatibility and implementing deduplication logic to prevent redundant execution when overlapping suites are selected.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js (existing project)  
**Primary Dependencies**: tinybench (benchmarking), fast-check (test data), Zod v4 (schemas)  
**Storage**: N/A (in-memory benchmarking)  
**Testing**: Node.js built-in test runner with tsx loader  
**Target Platform**: Node.js development environment  
**Project Type**: single (TypeScript library with CLI benchmark runner)  
**Performance Goals**: Maintain sub-5ms assertion execution times, differentiate pure vs schema-based performance  
**Constraints**: Must not break existing CLI interface, preserve backward compatibility  
**Scale/Scope**: 127 total assertions with ~73 sync-function assertions to be analyzed and partitioned

**User-Provided Context**: Four existing suites (async-function, async-schema, sync-function, sync-schema) with async-schema being empty. The sync-function suite needs partitioning based on return types: AssertionFailure/boolean (pure) vs Zod schema/AssertionParseRequest (schema-based). Two new suites will be created: sync-function-pure and sync-function-schema. Runner logic must handle overlap where selecting sync-function overrides its sub-suites to prevent duplication.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Initial Check (Pre-Phase 0)**:
**Code Quality Standards**: ✅ Existing ESLint/TypeScript setup will apply. Changes follow established patterns in bench/ directory.
**Test-Driven Development**: ✅ Will analyze existing assertions first, then create test cases for new suite logic. Property-based tests ensure coverage.
**User Experience Consistency**: ✅ CLI interface maintains existing `--suite` flag pattern. Error messages follow established format.
**Performance Requirements**: ✅ Benchmarking is the core feature - performance impact will be measured via the benchmark system itself.
**Continuous Integration**: ✅ Changes limited to bench/ directory. Existing CI pipeline will validate via npm test and lint commands.

**Post-Design Check (After Phase 1)**:
**Code Quality Standards**: ✅ PASS - Design follows existing TypeScript patterns, maintains ESLint compliance
**Test-Driven Development**: ✅ PASS - Quickstart.md defines test scenarios, contract validation ensures TDD approach
**User Experience Consistency**: ✅ PASS - CLI contracts maintain backward compatibility, error messages standardized
**Performance Requirements**: ✅ PASS - Feature enables performance analysis, benchmarks validate implementation
**Continuous Integration**: ✅ PASS - No new dependencies, leverages existing test infrastructure

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
bench/
├── runner.ts             # CLI runner - needs AVAILABLE_SUITES update
├── comprehensive-suites.ts # Suite creation functions
├── config.ts            # Configuration and thresholds
└── README.md            # Documentation updates

src/assertion/
├── assertion-sync.ts    # Source of sync-function assertions to analyze
└── impl/               # Implementation files containing assertions
    ├── sync-basic.ts
    ├── sync-collection.ts
    ├── sync-esoteric.ts
    └── sync-parametric.ts

test/
├── property/           # Property-based tests for validation
└── assertion/          # Unit tests for benchmark logic
```

**Structure Decision**: Single project structure with changes focused in the bench/ directory. The existing comprehensive-suites.ts contains suite creation logic that needs extension for new sub-suites. Analysis will examine src/assertion/ to categorize assertions by return type.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate assertion analysis tasks from research.md findings
- Create suite implementation tasks based on contracts/cli-interface.md
- Generate validation tasks from quickstart.md test scenarios
- Each contract interface → implementation task [P]
- Each CLI behavior → integration test task
- Each performance requirement → benchmark validation task

**Ordering Strategy**:

- TDD order: Analysis before implementation, tests before code changes
- Dependency order: Classification logic before suite functions before runner updates
- Mark [P] for parallel execution (independent analysis can run simultaneously)

**Specific Task Categories**:

1. **Analysis Tasks**: Examine sync-function assertions and classify by return type
2. **Implementation Tasks**: Create new suite functions in comprehensive-suites.ts
3. **Integration Tasks**: Update runner.ts with new suites and overlap logic
4. **Validation Tasks**: Test CLI behavior, performance characteristics, backward compatibility

**Estimated Output**: 12-15 numbered, ordered tasks covering analysis, implementation, and validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
