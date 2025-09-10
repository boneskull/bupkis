/**
 * This mini-plugin copies media files from `site/media/` to the output
 * directory's `media/` folder at end of rendering.
 *
 * @packageDocumentation
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PageEvent, RendererEvent } from 'typedoc';

/**
 * @import {Application} from 'typedoc'
 */

const SOURCE_DIR = fileURLToPath(new URL('../site/media/', import.meta.url));
/**
 * @param {Application} app
 */
export const load = (app) => {
  const outputDir = app.options.getValue('out');
  const mediaDir = path.join(outputDir, 'media');

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
    if (!page.contents) return;
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
