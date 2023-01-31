module.exports = {
  preset: 'ts-jest/presets/default-esm',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-sinon', '<rootDir>/test/unit/jestSetupFile.ts'],
  moduleFileExtensions: ['js', 'ts'],
  transform: {},
};
