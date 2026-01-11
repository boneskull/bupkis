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
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeVisible' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeDisabled' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeEnabled' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveClass' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveAttribute' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveTextContent' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveValue' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveStyle' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toHaveFocus' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeChecked' /**
     * @function
     */,
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
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainElement' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toContainHTML' /**
     * @function
     */,
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
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeRequired' /**
     * @function
     */,
    transform: () => null,
  },
  {
    bupkisPhrase: '',
    jestMatcher: 'toBeValid' /**
     * @function
     */,
    transform: () => null,
  },
];
