# Test Structure & Organization

## 🗂️ **File Organization Standards**

### **Directory Structure**
```
tests/
├── *.spec.ts           # Test files
├── fixtures/           # Test data files
│   ├── test-tags.fixture.ts
│   ├── [feature]-data.fixture.ts
│   └── shared-data.fixture.ts
└── utils/
    ├── test.utils.ts
    └── test-steps.utils.ts

pages/
├── base.page.ts        # Base page class
├── [feature].page.ts   # Feature page objects
└── page.factory.ts     # Page factory

utils/
├── element.helper.ts   # Element interaction utilities
├── smart-logger.utils.ts
└── [feature].utils.ts  # Feature-specific utilities
```

### **File Naming Conventions**
- **Test files**: `[feature-name].spec.ts` → `post-creation.spec.ts`
- **Page objects**: `[feature].page.ts` → `post.page.ts` 
- **Fixtures**: `[feature]-data.fixture.ts` → `post-data.fixture.ts`
- **Utilities**: `[feature].utils.ts` → `post.utils.ts`

## 📝 **Test File Structure**

### **Required File Header**
```typescript
/**
 * [Feature Name] Tests for staging.go.ione.nyc
 * Tests [detailed description] functionality using saved session
 * Following AI_AGENT_INSTRUCTIONS patterns with PageFactory and page objects
 * 
 * Tests cover: [list main scenarios]
 * 
 * Note: Uses saved session from .auth/staging-ione.json - login handled separately
 * @author XWP Platform Team
 */
```

## 🔍 **CRITICAL: Site Inspection Before New Tests**

### **⚠️ MANDATORY: Always Inspect Live Site First**

**Before creating ANY new test case, you MUST:**

1. **🌐 Launch the Live Site**
   ```bash
   # Open the staging site in browser
   open "https://staging.go.ione.nyc/wp-admin/"
   ```

2. **🔍 Crawl & Inspect Elements**
   - Navigate through the UI manually
   - Use browser DevTools (F12) to inspect all interactive elements
   - Document ALL selectors, IDs, classes, and text content
   - Test user flows step-by-step
   - Note any dynamic elements, loading states, or animations

3. **📋 Document Discovered Elements**
   ```typescript
   // Example: Document what you find during inspection
   const selectors = {
     // Found during live site inspection:
     submitButton: '[data-testid="submit-btn"]',        // Primary selector
     submitButtonAlt: '.wp-core-ui .button-primary',    // Backup selector
     loadingSpinner: '.spinner.is-active',              // Loading state
     successMessage: '.notice.notice-success',          // Success indicator
     errorMessage: '.notice.notice-error'               // Error indicator
   };
   ```

4. **🎯 Test Multiple Scenarios**
   - Success path (happy path)
   - Error conditions
   - Edge cases (empty fields, special characters)
   - Loading states and timeouts
   - Different user roles/permissions

5. **📊 Create Comprehensive Locator Strategy**
   ```typescript
   // Always provide multiple selector options based on inspection
   private readonly submitButton = {
     primary: '[data-testid="submit"]',               // Most reliable
     secondary: '#submit',                            // ID fallback  
     tertiary: '.button-primary[type="submit"]',      // Class + attribute
     text: 'button:has-text("Submit")'               // Text-based fallback
   };
   ```

### **🚫 NEVER Create Tests Without Live Inspection**
- ❌ Don't guess selectors or element behavior
- ❌ Don't assume UI elements exist without verification
- ❌ Don't create tests based only on documentation
- ❌ Don't skip testing error conditions and edge cases

### **✅ Always Validate Your Findings**
```typescript
// After inspection, validate elements exist and behave as expected
test('should verify element discovery from live site inspection', async ({ page }) => {
  // Navigate to the inspected page
  await pageFactory.targetPage.navigate();
  
  // Verify all discovered elements exist
  await expect(page.locator(selectors.submitButton)).toBeVisible();
  await expect(page.locator(selectors.loadingSpinner)).toBeHidden();
  
  // Test discovered interactions
  await pageFactory.targetPage.clickSubmitButton();
  await expect(page.locator(selectors.successMessage)).toBeVisible();
});
```

### **Standard Test Structure**
```typescript
test.describe('[Feature Name] Tests', {
  tag: [TestTags.STAGING_ONLY, TestTags.CORE]
}, () => {
  let pageFactory: PageFactory;
  let featurePage: FeaturePage;

  test.beforeEach(async ({ page }, testInfo) => {
    // Standard setup for all tests
    pageFactory = new PageFactory(page);
    featurePage = pageFactory.featurePage;
    page.setDefaultTimeout(30000);
    
    // Initialize SmartLogger
    SmartLogger.initializeTest(testInfo.title);
    
    // NO LOGIN REQUIRED - navigate directly to feature
    await featurePage.navigateDirectlyToFeature();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Standard cleanup
    SmartLogger.finalizeTest();
  });

  // Individual test cases...
});
```

## 🎯 **Test Organization Patterns**

### **Test Case Structure (AAA Pattern)**
```typescript
test('should [clear description] @tags', async ({ page }) => {
  // Arrange - Prepare test data and state
  const testData = featureData.validScenario;
  SmartLogger.log('INFO', 'Test data prepared', { testData });

  // Act - Perform the actions being tested
  await featurePage.performMainAction(testData.input);
  await featurePage.performSecondaryAction(testData.secondary);

  // Assert - Verify the expected outcomes
  const result = await featurePage.verifyExpectedOutcome(testData.expected);
  expect(result).toBe(true);
});
```

### **Test Grouping Strategies**

#### **By Functionality**
```typescript
test.describe('Post Creation Tests', () => {
  test.describe('Basic Creation', () => {
    test('should create draft post', async () => {});
    test('should create published post', async () => {});
  });

  test.describe('Advanced Features', () => {
    test('should create post with tags', async () => {});
    test('should create post with featured image', async () => {});
  });

  test.describe('Verification Tests', () => {
    test('should verify post details persist', async () => {});
    test('should verify special characters handling', async () => {});
  });
});
```

#### **By Test Type**
```typescript
test.describe('Authentication Tests', {
  tag: [TestTags.AUTHENTICATION, TestTags.CRITICAL]
}, () => {
  // Authentication-specific tests
});

test.describe('Integration Tests', {
  tag: [TestTags.INTEGRATION, TestTags.E2E]
}, () => {
  // End-to-end integration tests
});
```

## 📊 **Data Management Patterns**

### **Fixture Organization**
```typescript
// fixtures/post-data.fixture.ts
export const postCreationData = {
  // Basic scenarios
  validPost: { title: 'Valid Title', content: 'Valid Content' },
  emptyContent: { title: 'Title Only', content: '' },
  
  // Edge cases
  longTitle: { title: 'x'.repeat(255), content: 'Content' },
  specialChars: { title: 'Title with àáâãäå & symbols!', content: 'Special content' },
  
  // Dynamic data generation
  generateFreshPost(): PostData {
    const timestamp = Date.now();
    return {
      title: `Fresh Post ${timestamp}`,
      content: `Content created at ${new Date().toISOString()}`
    };
  }
};
```

### **Data Independence Rules**
- **NO** hardcoded strings in tests → Use fixture data
- **GENERATE** fresh data for each test run when needed  
- **AVOID** test dependencies → Each test self-contained
- **CLEAN UP** test data after test completion

### **Example: Data-Independent Test**
```typescript
test('should create post with dynamic data', async ({ page }) => {
  // Arrange - Fresh data for each run
  const postData = postCreationData.generateFreshPost();
  
  // Act - Use fixture data
  await postPage.fillPostTitle(postData.title);
  await postPage.fillPostContent(postData.content);
  await postPage.saveDraft();
  
  // Assert - Verify with same data
  const isCreated = await postPage.verifyPostDetails(postData.title, postData.content);
  expect(isCreated).toBe(true);
});
```

## 🏷️ **Tagging System**

### **Tag Categories**
```typescript
// fixtures/test-tags.fixture.ts
export const TestTags = {
  // Test Types
  SMOKE: '@smoke',
  REGRESSION: '@regression', 
  CRITICAL: '@critical',
  INTEGRATION: '@integration',
  E2E: '@e2e',
  
  // Features
  POST_CREATION: '@post-creation',
  AUTHENTICATION: '@authentication',
  DASHBOARD: '@dashboard',
  NAVIGATION: '@navigation',
  
  // Environments
  STAGING_ONLY: '@staging-only',
  PROD_SAFE: '@prod-safe',
  
  // Performance
  SLOW: '@slow',
  FAST: '@fast'
};

export const TagCombinations = {
  SMOKE_POST: [TestTags.SMOKE, TestTags.POST_CREATION, TestTags.STAGING_ONLY],
  CRITICAL_AUTH: [TestTags.CRITICAL, TestTags.AUTHENTICATION, TestTags.PROD_SAFE],
  REGRESSION_FULL: [TestTags.REGRESSION, TestTags.INTEGRATION, TestTags.STAGING_ONLY]
};
```

### **Tag Usage Examples**
```typescript
test('should create basic post @smoke @post-creation @staging-only', async () => {});
test('should handle login errors @critical @authentication @error-handling', async () => {});
test('should complete full user journey @e2e @integration @slow', async () => {});
```

## 🔄 **Reusable Test Steps**

### **Test Steps Utility Pattern**
```typescript
// utils/test-steps.utils.ts
export class TestSteps {
  constructor(private pageFactory: PageFactory) {}

  /**
   * Navigate to dashboard (session-based, no login)
   */
  async navigateToDashboard(): Promise<void> {
    await this.pageFactory.dashboardPage.navigateDirectlyToDashboard();
    await this.pageFactory.dashboardPage.waitForDashboardLoad();
  }

  /**
   * Create basic post with title and content
   */
  async createBasicPost(title: string, content: string): Promise<string> {
    const postPage = this.pageFactory.postPage;
    await postPage.navigateDirectlyToPostEditor();
    await postPage.fillPostTitle(title);
    await postPage.fillPostContent(content);
    await postPage.saveDraft();
    return await postPage.getCurrentPostId();
  }

  /**
   * Verify post creation success
   */
  async verifyPostCreated(expectedTitle: string, expectedContent: string): Promise<void> {
    const postPage = this.pageFactory.postPage;
    const isCreated = await postPage.verifyPostDetails(expectedTitle, expectedContent);
    expect(isCreated).toBe(true);
  }
}
```

### **Multi-Step Test Example**
```typescript
test('should complete post creation workflow @e2e @post-creation', async ({ page }) => {
  const testSteps = new TestSteps(pageFactory);
  const testData = postCreationData.generateFreshPost();

  // Multi-step workflow using reusable steps
  const postId = await testSteps.createBasicPost(testData.title, testData.content);
  await testSteps.verifyPostCreated(testData.title, testData.content);
  
  // Additional verification
  expect(postId).toBeTruthy();
  SmartLogger.log('SUCCESS', `Post created with ID: ${postId}`);
});
```

## 📈 **Test Execution Strategies**

### **Parallel Execution Configuration**
```typescript
// playwright.config.ts
{
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0
}
```

### **Test Selection Patterns**
```bash
# Run smoke tests only
npm test -- --grep "@smoke"

# Run specific feature tests
npm test -- --grep "@post-creation"

# Run critical tests for staging
npm test -- --grep "@critical.*@staging-only"

# Exclude slow tests
npm test -- --grep "^(?!.*@slow).*$"
```

---

*See also: [05-templates.md](./05-templates.md) for complete test file templates*