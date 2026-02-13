/**
 * Shared Prettier configuration for AmbuLink monorepo
 * This configuration is used across all projects for consistent formatting
 */
module.exports = {
  // Use double quotes instead of single quotes
  singleQuote: false,
  
  // Add semicolons at the end of statements
  semi: true,
  
  // Use 2 spaces for indentation
  tabWidth: 2,
  
  // Use spaces instead of tabs
  useTabs: false,
  
  // Maximum line length
  printWidth: 100,
  
  // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: "es5",
  
  // Add spaces between brackets in object literals
  bracketSpacing: true,
  
  // Put the > of a multi-line JSX element at the end of the last line
  bracketSameLine: false,
  
  // Include parentheses around a sole arrow function parameter
  arrowParens: "always",
  
  // Use LF line endings
  endOfLine: "lf",
};
