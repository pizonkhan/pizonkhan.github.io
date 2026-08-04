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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "workers/**",
    ],
  },
  {
    rules: {
      // next/image optimisation is off (images.unoptimized: true) because this is a static
      // export with no image server. Every image on the site is a plain <img> with explicit
      // width/height by design; see the Imagery section of docs/plans/foundation-and-design-language.md.
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
