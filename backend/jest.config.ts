import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['<rootDir>/src/tests/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/types/**', '!src/scripts/**'],
  coverageDirectory: '<rootDir>/coverage',
  testMatch: ['**/*.spec.ts']
};

export default config;
