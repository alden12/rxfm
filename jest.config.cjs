// Two Jest projects so `yarn test` runs both suites:
//  - lib:  the framework unit tests (ts-jest + jsdom), scoped to src/.
//  - tsrx: the .tsrx transform fixture suite (plain CommonJS, node env), under
//          tsrx/fixtures/. No ts-jest — the transform and the fixture driver are
//          already CJS, so Jest runs them natively (no ESM/--experimental-vm-modules).
// e2e (Playwright) specs under e2e/ are run separately via `yarn test:e2e`.
module.exports = {
  projects: [
    {
      displayName: 'lib',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
    },
    {
      displayName: 'tsrx',
      testEnvironment: 'node',
      roots: ['<rootDir>/tsrx/fixtures'],
      testMatch: ['**/*.test.cjs'],
    },
  ],
};
