/** @type {import('next').NextConfig} */
const nextConfig = {
  // embedded-postgres (used by instrumentation.js to boot the local Cases
  // module database) does platform-conditional dynamic imports across every
  // OS/arch; only the current platform's optional-dependency binary package
  // is actually installed, so bundling it fails. Load it as a native Node
  // require instead of trying to statically bundle it.
  serverExternalPackages: ["embedded-postgres", "pg"],
};

module.exports = nextConfig;
