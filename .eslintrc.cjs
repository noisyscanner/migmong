module.exports = {
  env: {
    es2021: true,
    node: true,
    "jest/globals": true,
  },
  extends: ["airbnb-base", "prettier", "plugin:import/typescript"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
    project: "./tsconfig.json",
    extraFileExtensions: [".cjs"],
  },
  plugins: ["@typescript-eslint", "jest"],
  rules: {
    "import/prefer-default-export": 0,
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        ts: "never",
      },
    ],
    "no-underscore-dangle": [
      2,
      {
        allow: ["__migmong_log", "__migmong_options", "_id"],
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: __dirname,
      },
    },
  },
};
