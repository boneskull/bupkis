/**
 * This mini-plugin copies media files from `site/media/` to the output
 * directory's `media/` folder at end of rendering.
 *
 * @packageDocumentation
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  app.renderer.on('endRender', () => {
    for (const file of fs.readdirSync(SOURCE_DIR)) {
      const sourceFile = path.join(SOURCE_DIR, file);
      const destFile = path.join(mediaDir, file);
      fs.cpSync(sourceFile, destFile);
      app.logger.info(
        `Copied ${path.relative(process.cwd(), sourceFile)} to ${path.relative(process.cwd(), destFile)}`,
      );
    }
  });
};
