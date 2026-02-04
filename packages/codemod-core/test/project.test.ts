import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  aggregateResults,
  createInMemoryProject,
  shouldExcludeFile,
} from '../src/project.js';

describe('shouldExcludeFile', () => {
  it('should exclude files matching patterns', () => {
    expect(
      shouldExcludeFile('/path/to/node_modules/foo.ts', ['node_modules']),
      'to be true',
    );
  });

  it('should not exclude files not matching patterns', () => {
    expect(
      shouldExcludeFile('/path/to/src/foo.ts', ['node_modules']),
      'to be false',
    );
  });

  it('should handle multiple patterns', () => {
    expect(
      shouldExcludeFile('/path/to/dist/foo.js', ['node_modules', 'dist']),
      'to be true',
    );
  });

  it('should handle empty patterns', () => {
    expect(shouldExcludeFile('/path/to/foo.ts', []), 'to be false');
  });

  it('should handle glob-style patterns by stripping prefix', () => {
    expect(
      shouldExcludeFile('/path/to/node_modules/foo.ts', ['**/node_modules/**']),
      'to be true',
    );
  });
});

describe('createInMemoryProject', () => {
  it('should create a project with in-memory file system', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', 'const x = 1;');
    expect(sourceFile.getFullText(), 'to be', 'const x = 1;');
  });

  it('should use single quotes for manipulation', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', '');
    sourceFile.addImportDeclaration({
      moduleSpecifier: 'bupkis',
      namedImports: ['expect'],
    });
    expect(sourceFile.getFullText(), 'to contain', "'bupkis'");
  });
});

describe('aggregateResults', () => {
  it('should aggregate empty results', () => {
    const result = aggregateResults([]);
    expect(result, 'to satisfy', {
      modifiedFiles: 0,
      totalErrors: 0,
      totalFiles: 0,
      totalTransformations: 0,
      totalWarnings: 0,
    });
  });

  it('should aggregate single file result', () => {
    const result = aggregateResults([
      {
        errors: [{ message: 'error' }],
        filePath: '/path/to/file.ts',
        modified: true,
        transformCount: 5,
        warnings: [
          { column: 1, line: 1, message: 'warning', originalCode: 'foo' },
        ],
      },
    ]);
    expect(result, 'to satisfy', {
      modifiedFiles: 1,
      totalErrors: 1,
      totalFiles: 1,
      totalTransformations: 5,
      totalWarnings: 1,
    });
  });

  it('should aggregate multiple file results', () => {
    const result = aggregateResults([
      {
        errors: [],
        filePath: '/path/to/file1.ts',
        modified: true,
        transformCount: 3,
        warnings: [],
      },
      {
        errors: [{ message: 'error' }],
        filePath: '/path/to/file2.ts',
        modified: false,
        transformCount: 0,
        warnings: [
          { column: 1, line: 1, message: 'warning1', originalCode: 'foo' },
          { column: 1, line: 2, message: 'warning2', originalCode: 'bar' },
        ],
      },
      {
        errors: [],
        filePath: '/path/to/file3.ts',
        modified: true,
        transformCount: 2,
        warnings: [],
      },
    ]);
    expect(result, 'to satisfy', {
      modifiedFiles: 2,
      totalErrors: 1,
      totalFiles: 3,
      totalTransformations: 5,
      totalWarnings: 2,
    });
  });
});
