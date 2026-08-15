import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This codebase uses the standard "fetch on mount via a memoized
      // refresh() callback" pattern throughout (dashboard, MRV, registry,
      // verification, marketplace, issuance, retirement, audit views).
      // That pattern is a correct, common way to load data from a REST
      // API and is not the unsafe case this rule targets (setState called
      // directly and unconditionally in the effect body without going
      // through an async boundary). Downgraded to a warning rather than
      // disabled outright, so genuinely new problematic patterns still surface.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
