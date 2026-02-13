/**
 * ESLint configuration for client-dashboard
 * Extends shared @ambulink/eslint-config with React-specific settings
 */

import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import ambulinkConfig from "@ambulink/eslint-config/react";

export default tseslint.config({ ignores: ["dist"] }, ...ambulinkConfig, {
  files: ["**/*.{ts,tsx}"],
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
});
