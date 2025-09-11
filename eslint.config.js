import jsPlugin from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// TODO: setup eslint-plugin-n
export default defineConfig(
  jsPlugin.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  perfectionist.configs['recommended-natural'],
  {
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.json5', '.jsonc'],
        project: './.config/tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      '@perfectionist': perfectionist,
      '@stylistic': stylistic,
    },
    rules: {
      '@perfectionist/sort-classes': ['error', { partitionByNewLine: true }],
      '@stylistic/lines-around-comment': [
        'warn',
        {
          afterBlockComment: false, // conflicts with perfectionist if enabled
          allowArrayStart: true,
          allowBlockStart: true, // conflicts with prettier if disabled
          allowClassStart: true,
          allowInterfaceStart: true,
          allowObjectStart: true, // conflicts with prettier if disabled
          beforeBlockComment: false, // conflicts with perfectionist if enabled
        },
      ],

      '@stylistic/lines-between-class-members': ['error', 'always'],

      '@stylistic/semi': 'error',

      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: true,
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],

      // and sometimes you gotta use any
      '@typescript-eslint/no-explicit-any': 'off',

      // this rule seems broken
      '@typescript-eslint/no-invalid-void-type': 'off',

      // unfortunately required when using Sets and Maps
      '@typescript-eslint/no-non-null-assertion': 'off',

      '@typescript-eslint/no-unnecessary-boolean-literal-compare': [
        'error',
        {
          allowComparingNullableBooleansToFalse: true,
          allowComparingNullableBooleansToTrue: true,
        },
      ],

      // too many false positives
      '@typescript-eslint/no-unnecessary-condition': 'off',

      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],

      // these 6 bytes add up
      '@typescript-eslint/require-await': 'off',

      // I like my template expressions, tyvm
      '@typescript-eslint/restrict-template-expressions': 'off',

      '@typescript-eslint/unified-signatures': [
        'error',
        {
          ignoreDifferentlyNamedParameters: true,
        },
      ],

      'no-empty': ['error', { allowEmptyCatch: true }],

      'no-restricted-syntax': [
        'error',
        {
          message:
            '.readonly() is banned on Zod schemas because safeParse() will freeze values that pass through ZodReadonly schemas, which could cause unexpected mutations in our assertion library.',
          selector:
            'CallExpression[callee.type="MemberExpression"][callee.property.name="readonly"]',
        },
      ],
    },
  },
  {
    files: ['test/**/*.test.ts', 'test/**/*.macro.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['.config/*.js', '/*.js', '/.*.js', 'scripts/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintPluginJsonc.configs['flat/prettier'][0],
  {
    ...eslintPluginJsonc.configs['flat/prettier'][1],
    extends: [tseslint.configs.disableTypeChecked],
  },
  eslintPluginJsonc.configs['flat/prettier'][2],
  {
    ignores: [
      'docs',
      'dist',
      'coverage',
      '*.snapshot',
      '.tshy/**/*',
      '.tmp/**/*',
    ],
  },
);
