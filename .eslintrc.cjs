/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true }, // Enable browser, ES2020, and Node.js globals
  extends: [
    'eslint:recommended', // ESLint standard recommended rules
    'plugin:@typescript-eslint/recommended', // TypeScript recommended rules
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking', // Stricter rules requiring type info (can slow down linting)
    'plugin:react/recommended', // React specific linting rules
    'plugin:react/jsx-runtime', // Support for new JSX transform (React 17+)
    'plugin:react-hooks/recommended', // Enforces Rules of Hooks
    'plugin:jsx-a11y/recommended', // Accessibility rules for JSX (install eslint-plugin-jsx-a11y)
    'plugin:prettier/recommended', // Integrates Prettier with ESLint (must be last)
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'vite.config.ts',
    'postcss.config.js',
    'tailwind.config.js',
    'jest.config.cjs',
    'cypress.config.ts',
    'api/', // Ignore API routes for now (linted via tsconfig.node.json if needed)
    'node_modules/',
    'coverage/',
    '*.log',
    '.env*',
    'public/',
  ], // Files/folders to ignore
  parser: '@typescript-eslint/parser', // Use TypeScript parser
  parserOptions: {
    ecmaVersion: 'latest', // Use latest ECMAScript features
    sourceType: 'module', // Use ES modules
    project: ['./tsconfig.json', './tsconfig.node.json'], // Point to TSConfig files for type-aware rules
    tsconfigRootDir: __dirname, // Root directory for tsconfig resolution
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing
    },
  },
  plugins: [
    'react-refresh', // Vite specific plugin for Fast Refresh
    '@typescript-eslint',
    'react', // React plugin
    'react-hooks',
    'jsx-a11y', // Accessibility plugin
    'prettier', // Prettier plugin
  ],
  rules: {
    // Prettier Integration: Report Prettier violations as ESLint warnings
    'prettier/prettier': ['warn', { endOfLine: 'lf' }],

    // React Refresh: Ensure components are valid for Fast Refresh
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // TypeScript Specific: Adjust rule levels as needed
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn on unused vars (ignore args starting with _)
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on usage of 'any' type
    // '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow inferred return types for functions (can be 'warn' or 'error')

    // React Specific
    'react/prop-types': 'off', // Disable prop-types rule as we use TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform

    // General Rules
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }], // Warn on console.log
    // Add or override other rules as needed
  },
  settings: {
    react: {
      version: 'detect', // Automatically detect React version
    },
  },
};
