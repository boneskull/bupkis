import { expect } from 'bupkis';
import { describe, it } from 'node:test';

import {
  addBupkisImport,
  getBupkisImport,
  getImportsFrom,
  hasBupkisImport,
  hasCallUsage,
  hasImportFrom,
  removeNamedImport,
} from '../src/imports.js';
import { createInMemoryProject } from '../src/project.js';

describe('hasCallUsage', () => {
  it('should detect call usage of an identifier', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', 'expect(foo);');
    expect(hasCallUsage(sourceFile, 'expect'), 'to be true');
  });

  it('should not detect property access as call usage', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', 'obj.expect;');
    expect(hasCallUsage(sourceFile, 'expect'), 'to be false');
  });

  it('should return false if identifier not found', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', 'foo();');
    expect(hasCallUsage(sourceFile, 'expect'), 'to be false');
  });
});

describe('hasBupkisImport', () => {
  it('should detect existing bupkis import', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'bupkis';",
    );
    expect(hasBupkisImport(sourceFile, 'expect'), 'to be true');
  });

  it('should return false if import does not exist', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'chai';",
    );
    expect(hasBupkisImport(sourceFile, 'expect'), 'to be false');
  });

  it('should return false if named import does not exist', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { foo } from 'bupkis';",
    );
    expect(hasBupkisImport(sourceFile, 'expect'), 'to be false');
  });
});

describe('getBupkisImport', () => {
  it('should return bupkis import declaration', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'bupkis';",
    );
    const imp = getBupkisImport(sourceFile);
    expect(imp, 'not to be undefined');
    expect(imp?.getModuleSpecifierValue(), 'to be', 'bupkis');
  });

  it('should return undefined if no bupkis import', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'chai';",
    );
    expect(getBupkisImport(sourceFile), 'to be undefined');
  });
});

describe('addBupkisImport', () => {
  it('should add bupkis import if not exists', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', '');
    const modified = addBupkisImport(sourceFile, ['expect']);
    expect(modified, 'to be true');
    expect(sourceFile.getFullText(), 'to contain', "'bupkis'");
    expect(sourceFile.getFullText(), 'to contain', 'expect');
  });

  it('should add to existing bupkis import', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'bupkis';",
    );
    const modified = addBupkisImport(sourceFile, ['expectAsync']);
    expect(modified, 'to be true');
    expect(sourceFile.getFullText(), 'to contain', 'expectAsync');
  });

  it('should not duplicate existing imports', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'bupkis';",
    );
    const modified = addBupkisImport(sourceFile, ['expect']);
    expect(modified, 'to be false');
  });

  it('should return false for empty names', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', '');
    const modified = addBupkisImport(sourceFile, []);
    expect(modified, 'to be false');
  });
});

describe('removeNamedImport', () => {
  it('should remove named import', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect, foo } from 'bupkis';",
    );
    const modified = removeNamedImport(sourceFile, 'bupkis', 'expect');
    expect(modified, 'to be true');
    expect(sourceFile.getFullText(), 'not to contain', 'expect');
    expect(sourceFile.getFullText(), 'to contain', 'foo');
  });

  it('should remove entire import if last named import', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'bupkis';",
    );
    const modified = removeNamedImport(sourceFile, 'bupkis', 'expect');
    expect(modified, 'to be true');
    expect(sourceFile.getFullText().trim(), 'to be', '');
  });

  it('should return false if import not found', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { foo } from 'bupkis';",
    );
    const modified = removeNamedImport(sourceFile, 'bupkis', 'expect');
    expect(modified, 'to be false');
  });
});

describe('hasImportFrom', () => {
  it('should detect import from module', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'chai';",
    );
    expect(hasImportFrom(sourceFile, ['chai']), 'to be true');
  });

  it('should detect import from multiple modules', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'vitest';",
    );
    expect(hasImportFrom(sourceFile, ['jest', 'vitest']), 'to be true');
  });

  it('should return false if no matching import', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'bupkis';",
    );
    expect(hasImportFrom(sourceFile, ['chai', 'jest']), 'to be false');
  });
});

describe('getImportsFrom', () => {
  it('should return matching imports', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { expect } from 'chai';\nimport { foo } from 'bar';",
    );
    const imports = getImportsFrom(sourceFile, ['chai']);
    expect(imports, 'to have length', 1);
    expect(imports[0]?.getModuleSpecifierValue(), 'to be', 'chai');
  });

  it('should return empty array if no matches', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile(
      'test.ts',
      "import { foo } from 'bar';",
    );
    const imports = getImportsFrom(sourceFile, ['chai']);
    expect(imports, 'to be empty');
  });
});

describe('isCallExpression', () => {
  it('should return true for call expression', () => {
    const project = createInMemoryProject();
    const sourceFile = project.createSourceFile('test.ts', 'expect(foo);');
    // hasCallUsage uses isCallExpression internally, so we test it indirectly
    expect(hasCallUsage(sourceFile, 'expect'), 'to be true');
  });
});
