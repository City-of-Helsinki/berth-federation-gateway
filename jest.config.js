module.exports = {
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "/__mocks__/",
  ],
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(test).ts?(x)"]
};
