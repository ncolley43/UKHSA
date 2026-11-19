// The test environments the tests can run against.
// Pick one with the TEST_ENV environment variable - the npm scripts do this for you:
//   npm run test:sit   npm run test:e2e   npm run test:live
//
// This is an example framework, so all three point at the live GOV.UK site for now.
// In a real project, replace each baseURL with that environment's own address.

export type EnvironmentName = 'sit' | 'e2e' | 'live';

export type Environment = {
  /* Shown at the start of each run, so it's clear where the tests are pointing */
  label: string;
  /* The site address the tests run against - page.goto('/...') is relative to this */
  baseURL: string;
  /* true = only tests tagged @live-safe run here (read-only tests that change no data) */
  liveSafeOnly: boolean;
};

export const environments: Record<EnvironmentName, Environment> = {
  sit: {
    label: 'SIT (System Integration Testing)',
    baseURL: 'https://www.gov.uk',
    liveSafeOnly: false,
  },
  e2e: {
    label: 'E2E (End-to-End)',
    baseURL: 'https://www.gov.uk',
    liveSafeOnly: false,
  },
  live: {
    label: 'Live',
    baseURL: 'https://www.gov.uk',
    liveSafeOnly: true,
  },
};

// Reads TEST_ENV (sit, e2e or live - defaults to sit) and returns that environment's settings
export function currentEnvironment(): Environment & { name: EnvironmentName } {
  const name = (process.env.TEST_ENV ?? 'sit').toLowerCase();
  if (!(name in environments)) {
    throw new Error(`Unknown TEST_ENV "${process.env.TEST_ENV}" - use one of: ${Object.keys(environments).join(', ')}`);
  }
  return { name: name as EnvironmentName, ...environments[name as EnvironmentName] };
}
