/**
 * React Native ESLint configuration for AmbuLink monorepo
 * Use this for React Native / Expo applications (e.g., mobile)
 */

const tseslint = require("typescript-eslint");
const baseConfig = require("./base.js");

module.exports = tseslint.config(
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // React Native-specific rules can be added here if needed
      // For now, we rely on expo's eslint-config-expo for React Native specifics
    },
  }
);
