/**
 * This mini-plugin copies media files from `site/media/` to the output
 * directory's `media/` folder at end of rendering.
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
    for (const file of fs.readdirSync(SOURCE_DIR)) {
      const sourceFile = path.join(SOURCE_DIR, file);
      const destFile = path.join(mediaDir, file);
      fs.cpSync(sourceFile, destFile);
      app.logger.info(
        `Copied ${path.relative(process.cwd(), sourceFile)} to ${path.relative(process.cwd(), destFile)}`,
      );
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
