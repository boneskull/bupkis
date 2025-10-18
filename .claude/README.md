# Claude Configuration for Bupkis

This directory contains Claude-specific configuration files for the Bupkis assertion library project.

## Files

### Core Configuration

- **`.cursorrules`** - Main Cursor AI configuration (automatically used by Cursor)
- **`instructions.md`** - Detailed Claude instructions for complex development tasks

### Prompt Templates

- **`prompts/analyze.md`** - Code analysis and quality review workflow
- **`prompts/plan.md`** - Implementation planning for new features
- **`prompts/implement.md`** - Task-based implementation execution

## Usage

### Automatic (Cursor)

The `.cursorrules` file is automatically loaded by Cursor and provides baseline context for all AI interactions.

### Manual (Claude)

Reference specific instruction files or prompts for complex tasks:

```bash
Please follow the instructions in .claude/instructions.md for this development task.
```

```bash
Use the analysis prompt from .claude/prompts/analyze.md to review the assertion implementation.
```

### Prompt-Driven Development

1. **Planning Phase**: Use `prompts/plan.md` for feature design
2. **Implementation Phase**: Use `prompts/implement.md` for systematic development
3. **Review Phase**: Use `prompts/analyze.md` for quality assessment

## Differences from GitHub Copilot

### GitHub Copilot (.github/)

- Automatically loaded and used by GitHub Copilot
- Integrated with `.specify/` workflow system
- Uses structured templates with script integration

### Claude Configuration (.claude/)

- Manually referenced when needed
- Self-contained, no external dependencies
- Adapted for Claude's capabilities and interaction model

## Migration Notes

The Claude configuration is designed to provide equivalent functionality to the GitHub Copilot setup while working within Claude's interaction model. Key adaptations:

1. **Removed Dependencies**: No reliance on `.specify/` scripts or external templates
2. **Simplified Structure**: Direct markdown prompts instead of complex template system
3. **Manual Activation**: Explicit reference required instead of automatic loading
4. **Enhanced Context**: More detailed explanations suitable for Claude's reasoning

## Maintaining Consistency

When updating instructions:

1. Update both `.github/` and `.claude/` configurations
2. Ensure core development patterns remain consistent
3. Adapt workflow differences to each AI system's strengths
4. Test changes with both GitHub Copilot and Claude/Cursor
