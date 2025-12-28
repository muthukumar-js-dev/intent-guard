module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 74,
      functions: 89,
      lines: 92,
      statements: 92,
    },
  },
  // Allow Jest to transform ESM modules like chalk
  transformIgnorePatterns: ['node_modules/(?!(chalk)/)'],
};
