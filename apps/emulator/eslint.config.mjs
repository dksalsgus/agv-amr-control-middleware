import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "eslint.config.mjs"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "func-style": ["error", "expression"],
      "@typescript-eslint/no-floating-promises": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclaration[kind='let']",
          message: "let 대신 const를 쓴다.",
        },
        {
          selector: "SpreadElement, RestElement",
          message: "스프레드·나머지 문법 대신 필드를 명시한다.",
        },
      ],
    },
  },
);
