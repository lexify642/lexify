// ESLint 9 flat config — eslint-config-next now ships as a flat-config
// array directly, so this replaces the old .eslintrc.json (which ESLint 9
// no longer reads). `next lint`/`next build` pick this up automatically.
const nextConfig = require("eslint-config-next");

module.exports = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "legacy-html-backup/**"],
  },
];
