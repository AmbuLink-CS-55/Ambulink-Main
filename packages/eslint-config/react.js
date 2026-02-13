/**
 * React ESLint configuration for AmbuLink monorepo
 * Use this for React web applications (e.g., client-dashboard)
 */

const tseslint = require("typescript-eslint");
const baseConfig = require("./base.js");

module.exports = tseslint.config(
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // React-specific rules can be added here if needed
      // For now, we rely on the React plugins configured in the project
    },
  }
);
