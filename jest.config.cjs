// jest.config.cjs - Optional configuration for Jest (e.g., for API route testing)
// Vitest is the primary testing framework for the frontend.

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  // Specify the test environment (Node.js for API routes)
  testEnvironment: 'node',
  // Glob pattern(s) to find test files specifically for Jest (e.g., API tests)
  testMatch: ['**/api/**/*.test.ts'],
  // Module name mapper for resolving path aliases (like @/) used in src
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Add mappings if Jest has trouble resolving specific packages in Node env
    // Example for Vercel AI SDK (might be needed depending on imports in API tests)
    // '^ai$': '<rootDir>/node_modules/ai/dist/index.js',
    // '^openai$': '<rootDir>/node_modules/openai/index.js',
  },
  // Path to a setup file that runs before each test file (optional)
  setupFilesAfterEnv: ['./jest.setup.ts'], // Create this file if needed
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,
  // Specify the TypeScript configuration file for ts-jest to use
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.node.json', // Use the Node-specific tsconfig
      },
    ],
  },
  // File extensions Jest should recognize
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Coverage configuration (optional for Jest if Vitest handles frontend coverage)
  // collectCoverage: true,
  // coverageDirectory: "coverage-jest",
  // coverageProvider: "v8",
  // collectCoverageFrom: ["api/**/*.ts"],
};
