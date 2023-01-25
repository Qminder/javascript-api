module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-sinon', '<rootDir>/test/unit/jestSetupFile.ts'],
  moduleFileExtensions: ['js', 'ts'],
  transform: {},
};
