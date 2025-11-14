# Implementation Plan: Migrate Bupkis Documentation to Starlight

**Project:** Bupkis Documentation Migration
**Goal:** Evaluate and implement Starlight-based documentation site wrapping existing TypeDoc API documentation
**Estimated Scope:** 15-20 tasks
**Created:** 2025-11-14

## Overview

This plan details the migration of Bupkis documentation from standalone TypeDoc to a Starlight (Astro-based) documentation site that integrates TypeDoc API documentation using the `starlight-typedoc` plugin.

### Current State

- **Current Documentation:** TypeDoc generates HTML documentation to `/docs` directory
- **TypeDoc Configuration:** Located at `.config/typedoc.js` with extensive customization
- **Entry Points:** 4 main TypeScript files (index, schema, util, guards)
- **Existing Content:** 21 markdown files in `/site` directory (guides, assertions, reference)
- **Custom Features:** Custom CSS, footer, plugins (redirect, mdn-links, zod, extras)
- **Build Command:** `npm run docs:build` (TypeDoc standalone)
- **Dev Command:** `npm run docs:dev` (TypeDoc watch + serve)
- **Current Domain:** bupkis.zip (CNAME configured)

### Target State

- **New Documentation:** Starlight site with integrated TypeDoc API documentation
- **Framework:** Astro + Starlight + starlight-typedoc plugin
- **Structure:**
  - Starlight handles overall site structure and navigation
  - TypeDoc generates API docs as part of Starlight content
  - Existing markdown content migrated to Starlight content structure
- **Output:** Single cohesive documentation site maintaining all current features

---

## Prerequisites & Dependencies

### Required npm Packages

**New Dependencies:**
- `@astrojs/starlight` - Core Starlight framework
- `astro` - Astro framework (peer dependency)
- `starlight-typedoc` - TypeDoc integration plugin
- `typedoc-plugin-markdown` - Markdown output for TypeDoc

**Existing Dependencies (Keep):**
- `typedoc` (v0.28.14) - Already installed
- `typedoc-plugin-mdn-links` (v5.0.10) - **Compatible with markdown output**
- `typedoc-plugin-zod` (v1.4.3) - **Possibly compatible, needs testing**

**Existing Dependencies (Remove/Replace):**

- `typedoc-plugin-redirect` (v1.2.1) - **Not compatible** - Use Astro redirects instead
- `typedoc-plugin-extras` (v4.0.1) - **Not compatible** - Replicate features in Starlight
- `.config/typedoc-plugin-bupkis.js` - **Not compatible** - Not needed for Starlight

### Compatibility Verification Needed

- Most TypeDoc plugins are incompatible with `typedoc-plugin-markdown` (HTML-only)
- **Compatible plugins:** `typedoc-plugin-mdn-links` (confirmed), possibly `typedoc-plugin-zod`
- **Incompatible plugins:** `typedoc-plugin-redirect`, `typedoc-plugin-extras`, custom Bupkis plugin
- Test if custom TypeDoc configuration translates to Starlight environment
- Validate custom CSS compatibility with Starlight theming

---

## Implementation Tasks

### Phase 1: Environment Setup & Initial Configuration

#### Task 1.1: Install Starlight and Dependencies

**Objective:** Set up Starlight framework in the existing project

**Steps:**
1. Install core Starlight packages:
   ```bash
   npm install astro @astrojs/starlight
   ```
2. Install TypeDoc integration:
   ```bash
   npm install starlight-typedoc typedoc-plugin-markdown
   ```
3. Verify no dependency conflicts with existing packages
4. Update `package.json` engines if Astro requires different Node version

**Files Modified:** `package.json`

**Verification:**
- Run `npm list astro @astrojs/starlight starlight-typedoc`
- Confirm no peer dependency warnings

---

#### Task 1.2: Create Astro Configuration File

**Objective:** Initialize Astro project configuration with Starlight

**Steps:**
1. Create `astro.config.mjs` in project root
2. Configure Starlight with basic settings:
   ```javascript
   import { defineConfig } from 'astro/config';
   import starlight from '@astrojs/starlight';

   export default defineConfig({
     integrations: [
       starlight({
         title: 'BUPKIS',
         // Initial configuration
       }),
     ],
   });
   ```
3. Set output directory to match current `/docs` or consider new location
4. Configure site URL (bupkis.zip)

**Files Created:** `astro.config.mjs`

**Verification:**
- Run `npx astro check` to validate configuration
- Start dev server: `npx astro dev` (should show Starlight welcome page)

---

#### Task 1.3: Configure starlight-typedoc Plugin

**Objective:** Integrate TypeDoc generation into Starlight build

**Steps:**
1. Import and add `starlight-typedoc` to Astro config:
   ```javascript
   import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

   plugins: [
     starlightTypeDoc({
       entryPoints: ['./src/index.ts', './src/schema.ts', './src/util.ts', './src/guards.ts'],
       tsconfig: './.config/tsconfig.typedoc.json',
       output: 'api',
       sidebar: {
         label: 'API Reference',
         collapsed: false,
       },
     }),
   ]
   ```
2. Add `typeDocSidebarGroup` to sidebar configuration
3. Configure TypeDoc overrides to preserve custom settings

**Files Modified:** `astro.config.mjs`

**Reference:**
- Existing config: `.config/typedoc.js`
- Existing entry points: Lines 27-32 in typedoc.js

**Verification:**
- Build Starlight: `npx astro build`
- Verify API docs generated in correct location
- Check sidebar includes TypeDoc documentation

---

### Phase 2: Content Migration

#### Task 2.1: Create Starlight Content Directory Structure

**Objective:** Set up proper Starlight content organization

**Steps:**
1. Create directory: `src/content/docs/`
2. Create subdirectories matching current structure:
   - `src/content/docs/guide/`
   - `src/content/docs/assertions/`
   - `src/content/docs/reference/`
   - `src/content/docs/about/`
3. Ensure `api/` directory will be generated by starlight-typedoc

**Files Created:**
- Directory structure under `src/content/docs/`

**Verification:**
- Confirm directories exist
- Validate Astro recognizes content collection

---

#### Task 2.2: Migrate Markdown Content from /site

**Objective:** Move and convert existing markdown files to Starlight format

**Steps:**
1. Copy all markdown files from `site/` to corresponding `src/content/docs/` locations:
   - `site/guide/*.md` → `src/content/docs/guide/`
   - `site/assertions/*.md` → `src/content/docs/assertions/`
   - `site/reference/*.md` → `src/content/docs/reference/`
   - `site/about/*.md` → `src/content/docs/about/`
2. Update frontmatter to Starlight format:
   - Convert `title` and `category` to Starlight schema
   - Example:
     ```yaml
     ---
     title: Basic Usage
     description: Getting started with Bupkis assertions
     ---
     ```
3. Remove TypeDoc-specific HTML if incompatible with Starlight
4. Update internal links to match new structure

**Files Modified:** All 21 markdown files in site/

**Reference:**
- Current files: Listed in Glob result (21 total)
- Example: `site/guide/usage.md`

**Verification:**
- Build site and verify all content renders
- Check navigation links work correctly
- Validate no broken internal references

---

#### Task 2.3: Create Index/Homepage

**Objective:** Design Starlight homepage to replace TypeDoc index

**Steps:**
1. Create `src/content/docs/index.mdx`
2. Design landing page with:
   - Project description
   - Quick start guide
   - Links to main sections (Guide, Assertions, API Reference)
   - Feature highlights
3. Consider using Starlight components (Cards, LinkButton)

**Files Created:** `src/content/docs/index.mdx`

**Reference:**
- Current homepage: Generated from TypeDoc
- Content inspiration: README.md, site/guide/usage.md

**Verification:**
- Homepage renders at site root
- Navigation flows to all major sections
- Matches Bupkis branding and tone

---

### Phase 3: TypeDoc Integration & Customization

#### Task 3.1: Configure TypeDoc Options for Markdown Output

**Objective:** Adapt TypeDoc configuration to work with markdown plugin

**Steps:**

1. In `astro.config.mjs`, add `typeDoc` configuration object with compatible plugins only:

   ```javascript
   typeDoc: {
     plugin: [
       'typedoc-plugin-mdn-links',  // Compatible
       'typedoc-plugin-zod',        // Test compatibility
     ],
     // Transfer relevant options from .config/typedoc.js
   }
   ```

2. Test if `typedoc-plugin-zod` works with markdown output (if not, remove)
3. Migrate essential configurations that work with markdown:
   - `blockTags` (custom tags) - **May not work, test**
   - `categoryOrder`
   - `externalSymbolLinkMappings`
   - `excludeExternals`, `excludeInternal`, `excludePrivate`
4. **Note:** The following HTML-only features cannot be migrated:
   - Custom CSS (`customCss`) - Apply at Starlight level instead
   - Custom footer HTML (`customFooterHtml`) - Implement in Starlight
   - Navigation links (`navigationLinks`) - Configure in Starlight
   - Syntax highlighting themes - Use Starlight theme config
   - `router: 'kind-dir'` - Handled by starlight-typedoc

**Files Modified:** `astro.config.mjs`

**Reference:** `.config/typedoc.js` (lines 15-106)

**Verification:**
- API documentation generates without errors
- MDN links resolve correctly
- Zod schemas documented properly (if plugin compatible)
- External symbol links work

---

#### Task 3.2: Test Compatible Plugin and Plan Replacements

**Objective:** Verify compatible plugins and document replacement strategies for others

**Plugin Status:**

✅ **Compatible (Keep):**

1. `typedoc-plugin-mdn-links` - Links to MDN documentation - **Works with markdown**

⚠️ **Test Compatibility:**

1. `typedoc-plugin-zod` - Zod schema documentation - **Needs testing**

❌ **Incompatible (Not Needed):**

1. `typedoc-plugin-redirect` - **Not needed** - Redirects can be added later if required
2. `typedoc-plugin-extras` - Features to reimplement in Starlight:
   - `footerLastModified: true` → Use Starlight's built-in lastUpdated feature
3. `.config/typedoc-plugin-bupkis.js` - **Not needed** - Handles redirects and file copying; Astro handles assets automatically

**Steps:**

1. Enable `typedoc-plugin-mdn-links` in typeDoc configuration
2. Test `typedoc-plugin-zod` - build and verify Zod schemas documented
3. Update package.json to remove unused plugins after migration complete

**Files Modified:** `astro.config.mjs`

**Verification:**

- MDN links work in generated documentation
- Zod plugin status confirmed (keep or remove)
- No errors from removed plugins

---

#### Task 3.3: ~~Implement Custom Redirects~~ (SKIP)

**Status:** ⏭️ **SKIPPED** - Redirects not needed for initial migration

**Rationale:**

- The custom Bupkis plugin's redirect system is not needed for the Starlight migration
- Redirects can be added later if needed after evaluating the new URL structure
- Focus on getting the core documentation working first

---

### Phase 4: Styling & Assets

#### Task 4.1: Migrate Custom CSS

**Objective:** Preserve Bupkis visual branding in Starlight theme

**Steps:**
1. Review existing custom CSS: `site/media/bupkis-theme.css`
2. Understand Starlight theming system (CSS custom properties)
3. Create Starlight theme override file:
   - Create `src/styles/custom.css`
   - Adapt Bupkis theme colors and typography
4. Configure in `astro.config.mjs`:
   ```javascript
   starlight({
     customCss: ['./src/styles/custom.css'],
   })
   ```
5. Handle `.bupkis` class references in markdown (e.g., usage.md line 6)

**Files Created:** `src/styles/custom.css`
**Files Modified:** `astro.config.mjs`

**Reference:**
- Current: `site/media/bupkis-theme.css`
- Starlight docs: Theming and customization

**Verification:**
- Site matches Bupkis branding
- Dark/light themes work correctly
- No style conflicts or broken layouts

---

#### Task 4.2: Migrate Media Assets

**Objective:** Transfer favicon, images, and other assets to Astro's public directory

**Steps:**

1. Copy assets from `site/media/` to `public/` directory:

   ```bash
   mkdir -p public
   cp site/media/favicon.svg public/
   cp -r site/media/* public/
   ```

2. Configure favicon in `astro.config.mjs`:
   ```javascript
   starlight({
     favicon: '/favicon.svg',
   })
   ```

3. Update asset references in markdown files if needed (Astro serves `public/` at root `/`)
4. **Note:** Astro automatically serves files from `public/` directory, no plugin needed for file copying

**Files Created:** Files in `public/` directory
**Files Modified:** `astro.config.mjs`, markdown files with asset references

**Reference:**

- Current assets: `site/media/` (17 files)
- Current favicon config: `.config/typedoc.js` line 59
- Custom plugin file copying: `.config/typedoc-plugin-bupkis.js` lines 131-140 (no longer needed)

**Verification:**

- Favicon displays correctly
- All images render in documentation
- No 404 errors for assets
- Assets accessible at root paths (e.g., `/media/image.png`)

---

#### Task 4.3: Implement Custom Footer

**Objective:** Preserve custom footer HTML with last modified date (replaces typedoc-plugin-extras)

**Steps:**

1. Review current footer: `site/media/footer.html`
2. Enable Starlight's built-in last modified feature:

   ```javascript
   starlight({
     lastUpdated: true,  // Replaces typedoc-plugin-extras footerLastModified
   })
   ```

3. If custom footer HTML needed beyond last modified date:
   - Create custom component override
   - Use Footer slot in layout
   - Create Astro component for custom content
4. Include any required links, copyright, etc. from `footer.html`

**Files Created:** Custom Starlight component override (if needed)

**Reference:**
- Current footer: `site/media/footer.html`
- TypeDoc config: `.config/typedoc.js` lines 8-11, 25, 61 (footerLastModified)
- Starlight docs: Built-in components and customization

**Verification:**
- Footer appears on all pages
- Last modified date displays correctly
- Any custom footer content preserved
- Styling matches Bupkis theme

---

### Phase 5: Navigation & Search

#### Task 5.1: Configure Starlight Sidebar

**Objective:** Create intuitive navigation structure

**Steps:**
1. Design sidebar structure in `astro.config.mjs`:
   ```javascript
   starlight({
     sidebar: [
       { label: 'Guide', items: [
         { label: 'Getting Started', link: '/guide/usage/' },
         { label: 'Testing', link: '/guide/testing/' },
         { label: 'Custom Assertions', link: '/guide/custom-assertion/' },
       ]},
       { label: 'Assertions', items: [
         { label: 'All Assertions', link: '/assertions/all/' },
         { label: 'Numeric', link: '/assertions/numeric/' },
         { label: 'String', link: '/assertions/string/' },
         // ... etc
       ]},
       { label: 'Reference', items: [
         { label: 'Glossary', link: '/reference/glossary/' },
         { label: 'Caveats', link: '/reference/caveats/' },
       ]},
       typeDocSidebarGroup, // API Reference from plugin
       { label: 'About', items: [
         { label: 'Release Notes', link: '/about/release-notes/' },
         { label: 'Roadmap', link: '/about/roadmap/' },
       ]},
     ],
   })
   ```
2. Match structure to TypeDoc's `categoryOrder`: Assertions, Guides, Reference, API, About
3. Configure collapsed/expanded defaults

**Files Modified:** `astro.config.mjs`

**Reference:**
- TypeDoc navigation config: `.config/typedoc.js` lines 74-82
- Current categories: Line 22 in typedoc.js

**Verification:**
- Sidebar displays all sections
- Navigation matches expected hierarchy
- API Reference integrates seamlessly

---

#### Task 5.2: Configure Navigation Links

**Objective:** Add external links (GitHub, npm) to site navigation

**Steps:**
1. Add social/navigation links in `astro.config.mjs`:
   ```javascript
   starlight({
     social: {
       github: 'https://github.com/boneskull/bupkis',
     },
     // Alternative: custom navigation links
   })
   ```
2. Replicate links from TypeDoc's `navigationLinks`:
   - API
   - Assertions
   - GitHub
   - npm

**Files Modified:** `astro.config.mjs`

**Reference:** `.config/typedoc.js` lines 77-82

**Verification:**
- External links appear in header/footer
- Links open in new tabs (if appropriate)
- Icons display correctly (GitHub, npm)

---

#### Task 5.3: Configure Search

**Objective:** Enable full-text search across all documentation

**Steps:**
1. Verify Starlight search is enabled (default: on)
2. Configure search scope:
   ```javascript
   starlight({
     // Search is automatic, but can customize
   })
   ```
3. Ensure API documentation is searchable
4. Test search performance with full documentation set
5. Verify search includes:
   - Content markdown
   - API documentation
   - Code examples

**Files Modified:** `astro.config.mjs`

**Reference:**
- TypeDoc search config: `.config/typedoc.js` lines 103-104

**Verification:**
- Search box appears in header
- Searching for API terms finds TypeDoc entries
- Searching for guide terms finds markdown content
- Search results rank appropriately

---

### Phase 6: Build Integration

#### Task 6.1: Update npm Scripts

**Objective:** Replace TypeDoc scripts with Starlight equivalents

**Steps:**
1. Update `package.json` scripts:
   ```json
   {
     "docs:build": "astro build",
     "docs:dev": "astro dev",
     "docs:preview": "astro preview"
   }
   ```
2. Consider keeping old TypeDoc scripts temporarily as `docs:build:legacy`
3. Update any CI/CD references to `docs:build`
4. Update documentation in README if it references build commands

**Files Modified:** `package.json`, potentially `README.md`

**Verification:**
- `npm run docs:build` builds Starlight site successfully
- `npm run docs:dev` starts dev server on expected port
- Output directory contains complete site

---

#### Task 6.2: Configure Build Output

**Objective:** Ensure Starlight outputs to correct directory for deployment

**Steps:**
1. Configure output in `astro.config.mjs`:
   ```javascript
   export default defineConfig({
     outDir: './docs', // Keep same as TypeDoc for GitHub Pages
     // OR
     outDir: './dist/docs',
   });
   ```
2. Ensure CNAME file is preserved (for bupkis.zip domain)
3. Update `.gitignore` if build directory changes
4. Test that deployment configuration still works

**Files Modified:** `astro.config.mjs`, possibly `.gitignore`

**Reference:**
- Current output: `docs/` (line 83 in typedoc.js)
- CNAME file: `docs/CNAME`

**Verification:**
- Build outputs to `/docs` directory
- CNAME file present in output
- Structure suitable for GitHub Pages or hosting platform

---

#### Task 6.3: Update Deployment Configuration

**Objective:** Ensure site deploys correctly to bupkis.zip

**Steps:**
1. Review current deployment process (GitHub Pages, Netlify, etc.)
2. Update configuration if needed:
   - GitHub Pages: Ensure Actions workflow uses new build command
   - Netlify: Update `netlify.toml` build command
   - Other: Update as appropriate
3. Test deployment to staging/preview environment first
4. Verify custom domain (bupkis.zip) resolves correctly

**Files Modified:** Deployment config (e.g., `.github/workflows/*.yml`, `netlify.toml`)

**Verification:**
- Site deploys without errors
- Custom domain works
- All pages accessible
- No 404 errors on production

---

### Phase 7: Testing & Validation

#### Task 7.1: Visual Regression Testing

**Objective:** Ensure new site matches design expectations

**Steps:**
1. Compare old TypeDoc site to new Starlight site:
   - Homepage layout
   - API documentation pages
   - Guide pages
   - Mobile responsiveness
2. Take screenshots of key pages for comparison
3. Test in multiple browsers (Chrome, Firefox, Safari)
4. Verify dark/light mode transitions
5. Check accessibility (color contrast, keyboard navigation)

**Files Modified:** None (testing only)

**Verification:**
- Document any visual differences
- Ensure critical elements maintained (branding, readability)
- No major layout breaks

---

#### Task 7.2: Functionality Testing

**Objective:** Verify all site features work correctly

**Test Cases:**
1. **Navigation**
   - Sidebar navigation opens correct pages
   - Breadcrumbs work correctly
   - Internal links resolve
   - External links open in new tabs
2. **Search**
   - API terms findable
   - Guide content findable
   - Results link correctly
3. **Code Examples**
   - Syntax highlighting works
   - Copy buttons function
4. **TypeDoc Integration**
   - API pages render correctly
   - Type information displays
   - Cross-references work
   - Inheritance hierarchies display
5. **Responsive Design**
   - Mobile menu functions
   - Tables scroll/adapt
   - Code blocks don't overflow

**Files Modified:** None (testing only)

**Verification:**
- Create test checklist
- Document any issues found
- Track fixes needed

---

#### Task 7.3: Content Validation

**Objective:** Ensure no content lost in migration

**Steps:**
1. Create content inventory from old site:
   - List all pages
   - Count API entries
   - Note special features
2. Verify new site has equivalent content:
   - All guide pages present
   - All assertion documentation included
   - All API references generated
3. Check for broken links using link checker tool
4. Verify code examples still accurate
5. Ensure all markdown formatting renders correctly

**Files Modified:** None (testing only)

**Verification:**
- Content parity documented
- No missing pages
- All links functional

---

### Phase 8: Documentation & Cleanup

#### Task 8.1: Update Project Documentation

**Objective:** Document new documentation system for contributors

**Steps:**
1. Update `README.md` with:
   - New documentation build commands
   - Link to Starlight documentation
   - Instructions for adding new content
2. Create `CONTRIBUTING.md` section on documentation:
   - How to add new pages
   - Frontmatter format
   - Where to place files
   - How to test locally
3. Document any quirks or limitations discovered

**Files Modified:** `README.md`, `CONTRIBUTING.md` (create if doesn't exist)

**Verification:**
- Documentation clear and accurate
- New contributors can follow instructions
- All commands tested and work

---

#### Task 8.2: Clean Up Old Configuration

**Objective:** Remove or archive old TypeDoc-specific files and unused plugins

**Steps:**

1. Decide what to do with:
   - `.config/typedoc.js` - **Archive or remove** (config moved to astro.config.mjs)
   - `.config/typedoc-plugin-bupkis.js` - **Remove** (not needed for Starlight)
   - `.config/tsconfig.typedoc.json` - **Keep** (still referenced by starlight-typedoc)
   - `site/` directory - **Archive or remove** after migration verified
2. Remove incompatible TypeDoc plugins from package.json:

   ```bash
   npm uninstall typedoc-plugin-redirect typedoc-plugin-extras
   ```

3. Update `knip` configuration if needed (lines 198-232 in package.json):
   - Remove `.config/typedoc-plugin-bupkis.js` from ignored dependencies
   - Add any new Astro/Starlight files to ignore patterns if needed
4. Remove old TypeDoc scripts if no longer needed (keep temporarily for rollback)
5. Update `.gitignore` if necessary

**Files Modified:**

- `package.json` (remove unused dependencies)
- `.config/` (remove old files)
- `.gitignore` (if needed)

**Verification:**
- Project builds without referencing removed files
- No broken references in configuration
- Unused plugins removed from node_modules
- Git history preserved if needed

---

#### Task 8.3: Performance Optimization

**Objective:** Ensure new site is fast and efficient

**Steps:**
1. Run Lighthouse audit on key pages
2. Check bundle sizes (JavaScript, CSS)
3. Optimize images if not already optimized
4. Configure Astro build optimizations:
   - Image optimization
   - CSS minification
   - JavaScript bundling
5. Test page load times
6. Consider static vs. SSR pages

**Files Modified:** `astro.config.mjs`, possibly image files

**Verification:**
- Lighthouse scores acceptable (90+ target)
- Page load times under 3 seconds
- No unnecessarily large assets

---

## Rollback Plan

If migration is unsuccessful:

1. Keep old TypeDoc configuration until migration verified
2. Maintain old build scripts as `docs:build:legacy`
3. Test new site in parallel (different output directory or branch)
4. Only remove old system after successful production deployment

## Success Criteria

- ✅ All existing documentation content migrated
- ✅ API documentation generates correctly from TypeDoc
- ✅ Custom styling and branding preserved
- ✅ Navigation intuitive and complete
- ✅ Search functionality works across all content
- ✅ Site deploys to bupkis.zip successfully
- ✅ Build times acceptable (comparable to current)
- ✅ No broken links or missing content
- ✅ Mobile responsive
- ✅ Accessibility maintained or improved

## Timeline Estimate

- **Phase 1 (Setup):** 2-3 hours
- **Phase 2 (Content):** 3-4 hours
- **Phase 3 (TypeDoc):** 2-3 hours (reduced by skipping redirects)
- **Phase 4 (Styling):** 3-4 hours
- **Phase 5 (Navigation):** 2-3 hours
- **Phase 6 (Build):** 2-3 hours
- **Phase 7 (Testing):** 3-4 hours
- **Phase 8 (Cleanup):** 2-3 hours

**Total Estimated Time:** 18-25 hours (reduced by skipping redirect implementation)

## Notes & Considerations

1. **TypeDoc Plugin Compatibility**: Most TypeDoc plugins are HTML-only and incompatible with `typedoc-plugin-markdown`:
   - ✅ **Works:** `typedoc-plugin-mdn-links`
   - ⚠️ **Maybe:** `typedoc-plugin-zod` (needs testing)
   - ❌ **Incompatible:** `typedoc-plugin-redirect`, `typedoc-plugin-extras`, custom Bupkis plugin
   - **Strategy:** Use Astro/Starlight native features to replace incompatible plugins

2. **Custom Bupkis Plugin**: The `.config/typedoc-plugin-bupkis.js` is incompatible with markdown output and will not be needed:
   - **File Copying**: The plugin copies `site/media/*` to output - Astro handles this automatically via `public/` directory
   - **Dynamic Redirects**: The plugin creates assertion redirects based on JSDoc tags - Not needed for initial migration
   - **Footer Link Icons**: GitHub/npm icon replacement - Can be handled with Starlight components if needed

3. **Redirects**: Not implementing redirects in initial migration. They can be added later if needed after evaluating the new URL structure.

4. **Footer Last Modified**: The `footerLastModified: true` feature from `typedoc-plugin-extras` can be replaced with Starlight's built-in `lastUpdated: true` configuration option.

5. **Static Assets**: Astro automatically serves files from the `public/` directory at the root path. No custom plugin needed to copy media files like the custom Bupkis plugin did.

6. **Build Performance**: Starlight/Astro may be slower or faster than TypeDoc. Monitor build times.

7. **Hosting Considerations**: Astro sites can be static or use SSR. For GitHub Pages, ensure static output.

8. **Version Control**: Consider doing migration in a feature branch with incremental commits per phase.

9. **Parallel Testing**: Run both documentation systems in parallel initially (different directories) to compare output.

10. **Community Feedback**: Consider beta testing new documentation with users before full switch.

11. **Dependency Cleanup**: After successful migration, uninstall `typedoc-plugin-redirect` and `typedoc-plugin-extras` to reduce dependency footprint.

## References

- [Starlight Documentation](https://starlight.astro.build/)
- [starlight-typedoc Documentation](https://starlight-typedoc.vercel.app/)
- [Astro Documentation](https://docs.astro.build/)
- [TypeDoc Documentation](https://typedoc.org/)
- Current Bupkis TypeDoc Config: `.config/typedoc.js`
