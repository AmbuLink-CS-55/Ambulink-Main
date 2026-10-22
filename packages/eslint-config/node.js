/**
 * Node.js ESLint configuration for AmbuLink monorepo
 * Use this for Node.js applications (e.g., backend, NestJS)
 */

const globals = require("globals");
const baseConfig = require("./base.js");

module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // Node.js-specific rules can be added here if needed
    },
  },
];
