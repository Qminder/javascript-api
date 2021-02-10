module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    "jest-sinon",
    "<rootDir>/test/unit/jestSetupFile.ts",
  ],
  moduleFileExtensions: ['js', 'ts'],
  transform: {},
};
