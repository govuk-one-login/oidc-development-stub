import eslint from "@eslint/js";
import { RulesConfig } from "@eslint/core";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import vitestEslint from "@vitest/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const defaultVitestRules: Partial<RulesConfig> = {
  "vitest/prefer-importing-vitest-globals": "off",
  "vitest/no-hooks": "off",
  "vitest/prefer-expect-assertions": "off",
  "vitest/require-mock-type-parameters": "off",
  "vitest/valid-title": "off",
  "vitest/prefer-describe-function-title": "off",
  "vitest/prefer-lowercase-title": "off",
  "no-undef": "off",
};
export default defineConfig(
  globalIgnores([".gitignore", "coverage", "public", "build", "scripts"]),
  {
    languageOptions: {
      ecmaVersion: "latest",
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    extends: [...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    plugins: {
      vitest: vitestEslint,
    },
    files: ["src/test/**/*.test.ts"],
    rules: {
      ...vitestEslint.configs.all.rules,
      ...defaultVitestRules,
    },
  },
  {
    plugins: {
      vitest: vitestEslint,
    },
    rules: {
      ...vitestEslint.configs.all.rules,
      ...defaultVitestRules,
    },
  },
  {
    ignores: ["eslint.config.ts", "vitest.config.ts"],
  }
);
