import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable problematic rules for production
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      // Performance optimizations
      "react/jsx-no-bind": "warn",
      "react/jsx-no-literals": "off",
      // Modern React patterns
      "react/function-component-definition": [
        "error",
        {
          "namedComponents": "arrow-function",
          "unnamedComponents": "arrow-function"
        }
      ]
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];

export default eslintConfig;