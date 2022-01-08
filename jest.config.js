const esModules = ["strip-ansi", "ansi-regex", "chalk"].join("|");

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  // preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s$": "esbuild-jest",
  },
  transformIgnorePatterns: [`node_modules/(?!${esModules})`],
};
