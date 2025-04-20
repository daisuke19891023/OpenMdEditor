import { defineConfig } from 'cypress';

export default defineConfig({
  // E2E Testing Configuration
  e2e: {
    // The base URL to visit during tests (Vite's default dev server port)
    baseUrl: 'http://localhost:5173',
    // Function to set up Node event listeners (e.g., for tasks, plugins)
    setupNodeEvents(on, config) {
      // Example: Log Cypress config being used
      // console.log('Cypress config:', config);
      // You can register tasks here:
      // on('task', { myTask: () => { ... return result; } });
      // Return the potentially modified config object
      return config;
    },
    // Path to the support file (for custom commands, global setup)
    supportFile: 'cypress/support/e2e.ts',
    // Pattern to find test spec files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // Disable video recording by default (enable in CI if needed)
    video: false,
    // Take screenshots when a test run fails
    screenshotOnRunFailure: true,
    // Default timeout for assertions retrying
    defaultCommandTimeout: 5000,
    // Default timeout for page loads
    pageLoadTimeout: 60000,
    // Default timeout for requests
    requestTimeout: 10000,
    // Control how tests are run in the runner (e.g., experimental features)
    // experimentalRunAllSpecs: true, // Example experimental flag
  },

  // Component Testing Configuration (if you plan to use Cypress for component tests)
  // component: {
  //   devServer: {
  //     framework: "react",
  //     bundler: "vite",
  //   },
  //   specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}', // Pattern for component tests
  //   supportFile: 'cypress/support/component.ts', // Separate support file
  // },

  // Global Configuration
  viewportWidth: 1280, // Default browser width
  viewportHeight: 720, // Default browser height
  retries: {
    // Configure test retries
    runMode: 1, // Number of retries in 'cypress run'
    openMode: 0, // Number of retries in 'cypress open'
  },
  // Environment variables for Cypress tests
  // env: {
  //   API_URL: 'http://localhost:3001/api',
  // },
});
