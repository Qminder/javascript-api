module.exports = {
  preset: 'ts-jest/presets/default-esm',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-sinon'],
  moduleFileExtensions: ['js', 'ts'],
  transform: {},
};
