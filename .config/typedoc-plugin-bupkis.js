/**
 * This mini-plugin:
 *
 * 1. Copies media files from `site/media/` to the output directory's `media/`
 *    folder
 * 2. Registers dynamic redirects for assertion anchors
 * 3. Replaces GitHub/npm links with icons
 * 4. Generates llms.txt for LLM consumption
 *
 * @packageDocumentation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Converter, PageEvent, ReflectionKind, RendererEvent } from 'typedoc';

const { freeze, fromEntries } = Object;

/**
 * @import {Application} from "typedoc"
 */

const SOURCE_DIR = fileURLToPath(new URL('../site/media/', import.meta.url));
const SITE_DIR = fileURLToPath(new URL('../site/', import.meta.url));

/**
 * Base URL for the hosted documentation
 */
const BASE_URL = 'https://bupkis.zip';

/**
 * Mapping of category names to doc filenames
 */
const CATEGORY_DOC_MAP = freeze(
  /** @type {const} */ ({
    async: 'Promise_Assertions',
    collections: 'Collections_Assertions',
    date: 'Date___Time_Assertions',
    equality: 'Equality___Comparison_Assertions',
    error: 'Error_Assertions',
    function: 'Function_Assertions',
    iterable: 'Iterable_Assertions',
    numeric: 'Numeric_Assertions',
    object: 'Object_Assertions',
    other: 'Other_Assertions',
    primitives: 'Primitive_Assertions',
    promise: 'Promise_Assertions',
    snapshot: 'Snapshot_Assertions',
    strings: 'String___Pattern_Assertions',
  }),
);

/**
 * Extracts YAML frontmatter from markdown content
 *
 * @param {string} content - Markdown file content
 * @returns {{ title?: string; category?: string } | null}
 */
const extractFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = match?.[1];
  if (!frontmatter) {
    return null;
  }

  const result = /** @type {{ title?: string; category?: string }} */ ({});

  const title = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  if (title) {
    result.title = title;
  }

  const category = frontmatter.match(/^category:\s*(.+)$/m)?.[1]?.trim();
  if (category) {
    result.category = category;
  }

  return result;
};

/**
 * Converts a title to TypeDoc document path format
 *
 * TypeDoc converts document titles to paths by:
 *
 * - Replacing `&` with `___`
 * - Replacing remaining spaces with underscores
 * - Keeping other characters as-is
 *
 * @param {string} title - The document title from frontmatter
 * @returns {string}
 */
const titleToDocPath = (title) => {
  return title.replace(/ & /g, '___').replace(/ /g, '_');
};

/**
 * Converts a markdown file's metadata to TypeDoc document URL path
 *
 * @param {string} title - The document title from frontmatter
 * @returns {string}
 */
const toDocPath = (title) => {
  return `documents/${titleToDocPath(title)}/`;
};

/**
 * Generates llms.txt content from site markdown files
 *
 * @returns {string}
 */
const generateLlmsTxt = () => {
  /** @type {Map<
  string,
  { title: string; path: string; description?: string }[]
>} */
  const sections = new Map();

  // Define section order and their display names
  const sectionConfig = /** @type {const} */ ({
    About: 'Optional',
    Assertions: 'Assertions',
    Guides: 'Docs',
    Reference: 'Reference',
  });

  // Walk the site directory
  const walkDir = (
    /** @type {string} */ dir,
    /** @type {string} */ base = '',
  ) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(base, entry.name);

      if (entry.isDirectory() && entry.name !== 'media') {
        walkDir(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const frontmatter = extractFrontmatter(content);

        if (frontmatter?.title && frontmatter?.category) {
          // Skip the "all" aggregation file, we'll link individual assertion docs
          if (relativePath === 'assertions/all.md') {
            continue;
          }

          const category = frontmatter.category;
          if (!sections.has(category)) {
            sections.set(category, []);
          }

          sections.get(category)?.push({
            path: toDocPath(frontmatter.title),
            title: frontmatter.title,
          });
        }
      }
    }
  };

  walkDir(SITE_DIR);

  // Build the llms.txt content
  const lines = [
    '# Bupkis',
    '',
    "> A TypeScript assertion library using natural language function calls instead of chainable methods. Write `expect(value, 'to be a string')` instead of `expect(value).toBeString()`.",
    '',
    'Bupkis uses Zod v4 for validation and type inference. Key features:',
    "- Natural language phrases: `expect(user, 'to satisfy', { name: expect.it('to be a string') })`",
    "- Automatic negation: `expect(42, 'not to be a string')`",
    "- Concatenation: `expect(n, 'to be a number', 'and', 'to be greater than', 0)`",
    '- Embeddable assertions: `expect.it()` for nested validation',
    "- Custom assertions: `createAssertion(['to be even'], (n) => n % 2 === 0)`",
    '',
  ];

  // Add sections in order
  for (const [category, displayName] of Object.entries(sectionConfig)) {
    const items = sections.get(category);
    if (items && items.length > 0) {
      lines.push(`## ${displayName}`);

      // Sort items alphabetically by title
      items.sort((a, b) => a.title.localeCompare(b.title));

      for (const item of items) {
        const url = `${BASE_URL}/${item.path}`;
        lines.push(`- [${item.title}](${url})`);
      }

      lines.push('');
    }
  }

  // Add API reference section
  lines.push('## API');
  lines.push(
    `- [API Reference](${BASE_URL}/api/): Full TypeScript API documentation`,
  );
  lines.push(
    `- [expect()](${BASE_URL}/functions/bupkis.expect/): Main assertion function`,
  );
  lines.push(
    `- [expectAsync()](${BASE_URL}/functions/bupkis.expectAsync/): Async assertion function`,
  );
  lines.push(
    `- [createAssertion()](${BASE_URL}/functions/bupkis.createAssertion/): Create custom assertions`,
  );
  lines.push(
    `- [use()](${BASE_URL}/functions/bupkis.use/): Register custom assertions`,
  );
  lines.push('');

  // Add quick reference for common patterns
  lines.push('## Quick Reference');
  lines.push('');
  lines.push('Common assertion patterns:');
  lines.push('```javascript');
  lines.push('// Type assertions');
  lines.push("expect(value, 'to be a string');");
  lines.push("expect(value, 'to be a number');");
  lines.push("expect(value, 'to be an array');");
  lines.push('');
  lines.push('// Equality');
  lines.push("expect(actual, 'to equal', expected);");
  lines.push("expect(obj, 'to deep equal', expected);");
  lines.push("expect(obj, 'to satisfy', { name: 'Alice' });");
  lines.push('');
  lines.push('// Negation');
  lines.push("expect(42, 'not to be a string');");
  lines.push('');
  lines.push('// Concatenation');
  lines.push("expect(n, 'to be a number', 'and', 'to be greater than', 0);");
  lines.push('');
  lines.push('// Embeddable assertions');
  lines.push("expect(user, 'to satisfy', {");
  lines.push("  name: expect.it('to be a string'),");
  lines.push("  age: expect.it('to be greater than', 18)");
  lines.push('});');
  lines.push('```');

  return lines.join('\n');
};

/**
 * @function
 * @param {Application} app
 */
export const load = (app) => {
  const outputDir = app.options.getValue('out');
  const mediaDir = path.join(outputDir, 'media');

  /** @type {[name: string, target: string][]} */
  const dynamicRedirects = [];

  // Listen for declaration creation to inspect JSDoc block tags
  app.converter.on(
    Converter.EVENT_CREATE_DECLARATION,
    (_context, reflection) => {
      // Check if this is a variable declaration with assertion types
      if (
        reflection.kind == ReflectionKind.Variable &&
        !!reflection.type &&
        !!reflection.comment
      ) {
        // Check if the type matches assertion types
        const typeString = reflection.type.toString();
        const isAssertionType =
          typeString.includes('AssertionSchemaSync') ||
          typeString.includes('AssertionFunctionSync') ||
          typeString.includes('AssertionSchemaAsync') ||
          typeString.includes('AssertionFunctionAsync');

        if (isAssertionType && reflection.comment.blockTags) {
          let anchor = '';
          let category = '';
          let redirect = '';

          // Extract metadata from block tags
          for (const tag of reflection.comment.blockTags) {
            if (tag.tag === '@bupkisAnchor' && tag.content) {
              anchor = tag.content
                .map((part) => part.text || '')
                .join('')
                .trim();
            } else if (tag.tag === '@bupkisAssertionCategory' && tag.content) {
              category = tag.content
                .map((part) => part.text || '')
                .join('')
                .trim();
            } else if (tag.tag === '@bupkisRedirect' && tag.content) {
              redirect = tag.content
                .map((part) => part.text || '')
                .join('')
                .trim();
            }
          }

          // If we have anchor and category, register the redirect
          if (anchor && category) {
            if (category in CATEGORY_DOC_MAP) {
              const redirectName = redirect || anchor;
              const document = `documents/${CATEGORY_DOC_MAP[/** @type {keyof typeof CATEGORY_DOC_MAP} */ (category)]}#${anchor}`;
              const redirectPath = `assertions/${redirectName}/`;
              dynamicRedirects.push([redirectPath, document]);
              app.logger.info(
                `Registered redirect for ${reflection.name}: ${redirectPath} ➡️ ${document}`,
              );
            } else {
              app.logger.warn(
                `Unknown category "${category}" for assertion ${reflection.name}`,
              );
            }
          }
        }
      }
    },
  );

  app.converter.on(Converter.EVENT_END, () => {
    // Apply all collected redirects at the end
    const redirects = /** @type {Record<string, string> | undefined} */ (
      app.options.getValue('redirects')
    );
    app.options.setValue('redirects', {
      ...redirects,
      ...fromEntries(dynamicRedirects),
    });
  });

  app.logger.info(
    `Will copy all files in ${path.relative(process.cwd(), SOURCE_DIR)} to ${path.relative(process.cwd(), mediaDir)}`,
  );

  app.renderer.on(RendererEvent.END, () => {
    // Copy media files
    for (const file of fs.readdirSync(SOURCE_DIR)) {
      const sourceFile = path.join(SOURCE_DIR, file);
      const destFile = path.join(mediaDir, file);
      fs.cpSync(sourceFile, destFile);
      app.logger.info(
        `Copied ${path.relative(process.cwd(), sourceFile)} to ${path.relative(process.cwd(), destFile)}`,
      );
    }

    // Generate llms.txt
    try {
      const llmsTxtContent = generateLlmsTxt();
      const llmsTxtPath = path.join(outputDir, 'llms.txt');
      fs.writeFileSync(llmsTxtPath, llmsTxtContent, 'utf8');
      app.logger.info(`Generated ${path.relative(process.cwd(), llmsTxtPath)}`);
    } catch (err) {
      app.logger.error(`Failed to generate llms.txt: ${err}`);
    }
  });

  app.renderer.on(PageEvent.END, (page) => {
    if (!page.contents) {
      return;
    }
    const navigationLinks = app.options.getValue('navigationLinks');
    if (!navigationLinks) {
      return;
    }

    if ('GitHub' in navigationLinks) {
      // Replace the GitHub link in the footer with one that includes the icon
      page.contents = page.contents.replace(
        `<a href="${navigationLinks.GitHub}">GitHub</a>`,
        `<a href="${navigationLinks.GitHub}" title="bupkis on GitHub"><span class="icon-github" aria-label="GitHub"></span></a>`,
      );
    }
    if ('npm' in navigationLinks) {
      // Replace the npm link in the footer with one that includes the icon
      page.contents = page.contents.replace(
        `<a href="${navigationLinks.npm}">npm</a>`,
        `<a href="${navigationLinks.npm}" title="bupkis on npm"><span class="icon-npm" aria-label="npm"></span></a>`,
      );
    }
  });
};
