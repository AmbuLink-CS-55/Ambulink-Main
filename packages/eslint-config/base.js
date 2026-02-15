/**
 * Base ESLint configuration for AmbuLink monorepo
 * This config includes standard TypeScript and JavaScript rules
 * All formatting rules are disabled - use Prettier for formatting
 */

const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow unused variables if they start with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Relaxed rules for common patterns
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "warn",
    },
  },
);
