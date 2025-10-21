# Excluded Tests

This directory contains tests that are excluded from the main test suite runs.

## Login Test (`login.spec.ts`)

**Why excluded:** The login test requires manual intervention (user must manually complete login) and has authentication issues specific to the staging environment setup.

**To run manually:**
```bash
# Since this directory is outside Playwright's testDir, you need to copy it back temporarily
cp tests-excluded/login.spec.ts tests/
npx playwright test tests/login.spec.ts
rm tests/login.spec.ts

# Or run it directly by updating Playwright config temporarily
```

**Alternative approach:**
```bash
# You can also create a separate Playwright config for excluded tests
npx playwright test tests-excluded/login.spec.ts --config=playwright.excluded.config.ts
```

**Note:** This test was moved here to prevent it from interfering with automated test runs while preserving it for manual authentication setup when needed. The import paths have been updated to work from this directory.