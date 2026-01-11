import type { MatcherTransform } from '../types.ts';

/**
 * @testing-library/jest-dom matchers.
 *
 * These are DOM-specific and may have limited bupkis equivalents.
 * Most will need TODO markers for manual migration.
 *
 * Reference: https://testing-library.com/docs/ecosystem-jest-dom/
 */
export const testingLibraryMatchers: MatcherTransform[] = [
  // These are DOM-specific - mark for manual migration
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeInTheDocument' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeVisible' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeDisabled' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeEnabled' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveClass' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveAttribute' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveTextContent' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveValue' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveStyle' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveFocus' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeChecked' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBePartiallyChecked',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveFormValues' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainElement' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainHTML' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveAccessibleDescription',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveAccessibleName',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveErrorMessage',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeEmptyDOMElement',
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeInvalid' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeRequired' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeValid' /**
     * @function
     */,
    /**
     * @function
     */
    transform: () => null,
  },
];
