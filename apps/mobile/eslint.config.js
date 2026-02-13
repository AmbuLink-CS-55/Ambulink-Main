/**
 * ESLint configuration for mobile (React Native/Expo)
 * Extends shared @ambulink/eslint-config with React Native-specific settings
 */

const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const ambulinkConfig = require("@ambulink/eslint-config/react-native");

module.exports = defineConfig([
  { ignores: ["dist/*", "*.config.js"] },
  ...ambulinkConfig,
  ...expoConfig,
  {
    files: ["*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
