<!--
Sync Impact Report:
- Version change: template → 1.0.0 (initial constitution)
- Added principles: Code Quality Standards, Test-Driven Development, User Experience Consistency, Performance Requirements, Continuous Integration
- Added sections: Development Standards, Quality Assurance Workflow
- Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md, ✅ agent-file-template.md
- Follow-up TODOs: None
-->

# Bupkis Constitution

## Core Principles

### I. Code Quality Standards

Every codebase MUST maintain consistent quality through automated tooling and clear standards.
Static analysis tools (linters, formatters, type checkers) are mandatory for all supported languages.
Code MUST be self-documenting with clear naming conventions, comprehensive documentation for
public APIs, and inline comments only for complex business logic. No code merges without
passing quality gates. Rationale: Consistency reduces cognitive load and prevents defects.

### II. Test-Driven Development (NON-NEGOTIABLE)

TDD is mandatory: Tests written → Specification approved → Tests fail → Implementation →
Tests pass → Refactor. Red-Green-Refactor cycle MUST be strictly enforced. All features
require unit tests achieving minimum 90% coverage and integration tests for external
interfaces. Test failures block all releases. Rationale: TDD ensures correctness,
enables safe refactoring, and serves as living documentation.

### III. User Experience Consistency

All user-facing interfaces MUST follow consistent patterns for input validation, error
messages, response formats, and interaction flows. CLI tools MUST support both human-readable
and machine-readable output formats (JSON). Error messages MUST be actionable with clear
next steps. All features MUST include usage examples and help documentation.
Rationale: Consistent UX reduces learning curve and support burden.

### IV. Performance Requirements

All features MUST include performance benchmarks with defined acceptance criteria before
implementation begins. Performance regressions require explicit justification and approval.
Critical paths MUST be optimized for the specified scale (users, data volume, request rate).
All features MUST implement appropriate caching, pagination, and resource cleanup patterns.
Rationale: Performance is a feature, not an afterthought.

### V. Continuous Integration

All code changes MUST pass automated quality gates including tests, static analysis,
security scans, and performance benchmarks. CI pipelines MUST be fast (<10 minutes) and
reliable (>99% success rate for valid changes). Failed builds block all downstream processes.
Deployment automation MUST include rollback capabilities and health checks.
Rationale: Automation ensures consistency and reduces human error.

## Development Standards

All projects MUST use the structured development workflow: Specification → Plan → Tasks →
Implementation. Feature specifications MUST be business-focused (WHAT/WHY) without
implementation details (HOW). Implementation plans MUST include constitution compliance
checks before and after design phases. All features MUST be implemented as independently
testable components with clear contracts and minimal dependencies.

## Quality Assurance Workflow

Code reviews MUST verify compliance with all constitutional principles before approval.
Performance benchmarks MUST be executed for all changes affecting critical paths.
Security reviews are required for features handling user data, external integrations,
or authentication. All releases MUST include automated smoke tests in production-like
environments. Quality gate failures require root cause analysis and process improvements.

## Governance

This constitution supersedes all other development practices and guidelines. Amendments
require documented justification, impact analysis, and migration plan for affected
codebases. All pull requests and code reviews MUST verify constitutional compliance.
Constitutional violations MUST be justified with business rationale or result in
rejection. Complex implementations that cannot meet constitutional requirements MUST
be simplified before approval.

**Version**: 1.0.0 | **Ratified**: 2025-10-06 | **Last Amended**: 2025-10-06
