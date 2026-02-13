/**
 * ESLint configuration for backend (NestJS)
 * Extends shared @ambulink/eslint-config with Node.js-specific settings
 */

import ambulinkConfig from "@ambulink/eslint-config/node";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["eslint.config.mjs", "dist"] },
  ...ambulinkConfig
);
