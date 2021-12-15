const esModules = ["strip-ansi", "ansi-regex"].join("|");

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.?js$": "esbuild-jest",
  },
  transformIgnorePatterns: [`node_modules/(?!${esModules})`],
};

