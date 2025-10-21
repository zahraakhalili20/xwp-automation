/**
 * Test Tags for categorization and filtering
 * Compatible with Allure reporting and Playwright test filtering
 */
export const TestTags = {
  // ===== TEST TYPES =====
  SMOKE: '@smoke',
  REGRESSION: '@regression', 
  CORE: '@core',
  INTEGRATION: '@integration',
  E2E: '@e2e',
  UNIT: '@unit',
  API: '@api',
  
  // ===== TEST SCENARIOS =====
  POSITIVE: '@positive',
  NEGATIVE: '@negative',
  BOUNDARY: '@boundary',
  EDGE_CASE: '@edge-case',
  HAPPY_PATH: '@happy-path',
  ERROR_HANDLING: '@error-handling',
  
  // ===== TEST STATUS =====
  KNOWN_FAILURE: '@known-failure',
  FLAKY: '@flaky',
  SKIP: '@skip',
  QUARANTINE: '@quarantine',
  UNSTABLE: '@unstable',
  
  // ===== FEATURES =====
  LOGIN: '@login',
  DASHBOARD: '@dashboard',
  USER_MANAGEMENT: '@user-management',
  CONTENT: '@content',
  AUTHENTICATION: '@authentication',
  AUTHORIZATION: '@authorization',
  NAVIGATION: '@navigation',
  FORMS: '@forms',
  SEARCH: '@search',
  ADMIN: '@admin',
  
  // ===== PRIORITIES (Allure Compatible) =====
  CRITICAL: '@critical',
  HIGH: '@high', 
  MEDIUM: '@medium',
  LOW: '@low',
  TRIVIAL: '@trivial',
  
  // ===== ENVIRONMENTS =====
  PROD_SAFE: '@prod-safe',
  DEV_ONLY: '@dev-only',
  STAGING_ONLY: '@staging-only',
  LOCAL_ONLY: '@local-only',
  
  // ===== BROWSERS =====
  CHROME_ONLY: '@chrome-only',
  FIREFOX_ONLY: '@firefox-only',
  SAFARI_ONLY: '@safari-only',
  MOBILE_ONLY: '@mobile-only',
  DESKTOP_ONLY: '@desktop-only',
  
  // ===== EXECUTION TYPE =====
  PARALLEL_SAFE: '@parallel-safe',
  SERIAL_ONLY: '@serial-only',
  SLOW: '@slow',
  FAST: '@fast',
  
  // ===== DATA DEPENDENCIES =====
  NO_DATA_REQUIRED: '@no-data',
  REQUIRES_SETUP: '@requires-setup',
  REQUIRES_CLEANUP: '@requires-cleanup',
  DATABASE_DEPENDENT: '@db-dependent',
  
  // ===== CUSTOM XWP TAGS =====
  WORDPRESS: '@wordpress',
  MULTISITE: '@multisite',
  SINGLE_SITE: '@single-site',
  PLUGIN_DEPENDENT: '@plugin-dependent',
  THEME_DEPENDENT: '@theme-dependent'
} as const;

/**
 * Allure Severity Levels mapping
 */
export const AllureSeverity = {
  BLOCKER: 'blocker',
  CRITICAL: 'critical', 
  NORMAL: 'normal',
  MINOR: 'minor',
  TRIVIAL: 'trivial'
} as const;

/**
 * Common tag combinations for quick usage
 */
export const TagCombinations = {
  // Smoke test combinations
  SMOKE_LOGIN: [TestTags.SMOKE, TestTags.LOGIN, TestTags.CRITICAL, TestTags.PROD_SAFE],
  SMOKE_DASHBOARD: [TestTags.SMOKE, TestTags.DASHBOARD, TestTags.HIGH, TestTags.PROD_SAFE],
  
  // Regression test combinations  
  REGRESSION_CORE: [TestTags.REGRESSION, TestTags.CORE, TestTags.HIGH],
  REGRESSION_INTEGRATION: [TestTags.REGRESSION, TestTags.INTEGRATION, TestTags.MEDIUM],
  
  // Feature-specific combinations
  AUTH_POSITIVE: [TestTags.AUTHENTICATION, TestTags.POSITIVE, TestTags.CORE],
  AUTH_NEGATIVE: [TestTags.AUTHENTICATION, TestTags.NEGATIVE, TestTags.ERROR_HANDLING],
  
  // Environment combinations
  PROD_CRITICAL: [TestTags.PROD_SAFE, TestTags.CRITICAL, TestTags.SMOKE],
  DEV_EXPERIMENTAL: [TestTags.DEV_ONLY, TestTags.LOW, TestTags.EDGE_CASE]
} as const;

/**
 * Helper function to create test tags
 * @param primary - Primary tag (feature/type)
 * @param secondary - Secondary tags array
 * @returns Combined tag array
 */
export function createTestTags(primary: string, secondary: string[] = []): string[] {
  return [primary, ...secondary];
}

/**
 * Tag validation helper
 * @param tags - Array of tags to validate
 * @returns boolean indicating if all tags are valid
 */
export function validateTags(tags: string[]): boolean {
  const allTags = Object.values(TestTags);
  return tags.every(tag => allTags.includes(tag as any));
}