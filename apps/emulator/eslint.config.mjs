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
      "max-classes-per-file": ["error", 1],
      "no-nested-ternary": "error",
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
        {
          selector:
            ":matches(IfStatement, WhileStatement, ConditionalExpression) > AwaitExpression.test, :matches(IfStatement, WhileStatement, ConditionalExpression) > *.test AwaitExpression",
          message: "await 결과는 조건식에 바로 쓰지 않고 이름 있는 변수로 받는다.",
        },
      ],
    },
  },
);
