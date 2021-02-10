module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    "jest-sinon",
    "<rootDir>/test/unit/jestSetupFile.ts",
  ],
  moduleFileExtensions: ['js', 'ts'],
  transform: {},
};
