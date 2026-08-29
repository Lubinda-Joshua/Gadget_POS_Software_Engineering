import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Strict TypeScript rules for critical paths
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prefer const over let where possible
      "prefer-const": "error",
      // No console.log left in production code (use console.error/warn for real errors)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // These effects hydrate browser-only state or load API data after mount.
      // The React 19 rule is too broad for these intentional boundary effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
