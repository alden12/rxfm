module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Unit tests live in src; e2e (Playwright) specs under e2e/ are run separately via `yarn test:e2e`.
  roots: ['<rootDir>/src'],
};
