# Advanced Features & Integrations

## 📊 **SmartLogger Integration**

### **Automatic Logging (Built-in)**
SmartLogger is automatically integrated into `element.helper` - no extra code needed in most cases:

```typescript
// ✅ Automatic logging happens when using elementHelper
await elementHelper.clickElement(this.page, this.submitButton);
await elementHelper.enterValue(this.page, this.titleField, 'Title');
await elementHelper.isElementDisplayed(this.page.locator(this.element));

// All these actions are automatically logged with context
```

### **Manual Logging for Custom Actions**
```typescript
// Custom actions that need manual logging
SmartLogger.logUserAction('performed custom action', this.elementSelector, value);
SmartLogger.logAssertion('verification description', expected, actual, result);
SmartLogger.log('INFO', 'Custom information', { context: 'data' });
```

### **Test Setup Integration**
```typescript
test.beforeEach(async ({ page }, testInfo) => {
  // Initialize SmartLogger for detailed reporting
  SmartLogger.initializeTest(testInfo.title);
});

test.afterEach(async ({ page }, testInfo) => {
  // Finalize logging and attach reports
  SmartLogger.finalizeTest();
});
```

## 🧰 **Utilities Usage Guide**

### **Available Utilities Overview**
```typescript
// Core utilities - import as needed
import elementHelper from '../utils/element.helper';           // Element interactions
import { SmartLogger } from '../utils/smart-logger.utils';     // Logging & reporting
import { EnvironmentManager } from '../utils/environment.utils'; // Environment config
import { TestUtils } from '../utils/test.utils';              // Test helpers
import { GraphQLHelper } from '../utils/graphql.helper';      // API testing
import { ErrorInspector } from '../utils/error-inspector.utils'; // Error analysis
```

### **Element Helper - Complete Usage**
```typescript
import elementHelper from '../utils/element.helper';

// Clicking elements (handles loading, retries, logging)
await elementHelper.clickElement(this.page, this.buttonSelector);
await elementHelper.clickElement(this.page, this.page.locator(this.element));

// Text input (handles clearing, validation, logging)
await elementHelper.enterValue(this.page, this.inputSelector, 'value');
await elementHelper.enterValue(this.page, this.page.locator(this.field), 'text');

// Element visibility checks
const isVisible = await elementHelper.isElementDisplayed(this.page.locator(this.element));
await elementHelper.waitForDisplayed(this.page, this.selector, 10000);

// Text retrieval
const text = await elementHelper.getElementText(this.page, this.selector);
const value = await elementHelper.getElementAttribute(this.page, this.selector, 'value');

// Element state checks
const isEnabled = await elementHelper.isElementEnabled(this.page.locator(this.element));
const exists = await elementHelper.elementExists(this.page, this.selector);
```

### **Test Utils - Data Generation & Validation**
```typescript
import { TestUtils } from '../utils/test.utils';

// Random data generation
const randomString = TestUtils.generateRandomString(12);
const uniqueTitle = TestUtils.generateUniqueTitle('Post');      // "Post_ABC123XY"
const testEmail = TestUtils.generateTestEmail();                // "test_ABC123@example.com"

// Validation helpers
const isValidEmail = TestUtils.isValidEmail('user@domain.com');
const isValidUrl = TestUtils.isValidUrl('https://example.com');

// Time delays (use sparingly - prefer smart waits)
await TestUtils.wait(testTimeouts.short);  // Use constant, not magic number
```

### **Environment Manager - Configuration Access**
```typescript
import { EnvironmentManager } from '../utils/environment.utils';

const envManager = EnvironmentManager.getInstance();

// Get configuration values
const baseUrl = envManager.getBaseUrl();              // From BASE_URL env var
const timeout = envManager.getTimeout();              // From TEST_TIMEOUT env var
const config = envManager.getConfig();                // Complete config object

// Example usage in page objects
async navigateToHomePage(): Promise<void> {
  const baseUrl = envManager.getBaseUrl();
  await this.page.goto(`${baseUrl}/`);
}
```

### **Constants & Timeouts - Use Fixtures**
```typescript
import { testTimeouts } from '../fixtures/test-data.fixture';

// ✅ ALWAYS use predefined timeouts instead of magic numbers
await this.page.waitForSelector('.element', { timeout: testTimeouts.medium });
await elementHelper.waitForDisplayed(this.page, this.selector, testTimeouts.long);

// Available timeout constants:
// testTimeouts.short = 5000ms
// testTimeouts.medium = 15000ms  
// testTimeouts.long = 30000ms
// testTimeouts.extraLong = 60000ms
```

### **Error Inspector - Debugging Support**
```typescript
import { ErrorInspector } from '../utils/error-inspector.utils';

// In page object error handling
catch (error) {
  await SmartLogger.logError(error as Error, this.page, {
    action: 'actionName',
    context: 'additional info'
  });
  
  // Optional: Enhanced error analysis
  const analysis = await ErrorInspector.analyzeError(error, this.page);
  SmartLogger.log('ERROR', 'Error analysis', analysis);
  
  throw error;
}
```

## 🔌 **GraphQL Integration**

### **GraphQL Helper Usage**
```typescript
import { GraphQLHelper } from '@utils/graphql.helper';

test('should validate data consistency @integration @graphql', async ({ page }) => {
  const graphql = new GraphQLHelper(page);
  
  // Frontend action
  await postPage.createPost(testData);
  const frontendData = await postPage.getPostDetails();
  
  // Backend validation via GraphQL
  const backendData = await graphql.executeQuery('getPostById', { 
    id: frontendData.id 
  });
  
  // Compare frontend vs backend data
  expect(frontendData.title).toBe(backendData.post.title);
  expect(frontendData.status).toBe(backendData.post.status);
});
```

### **GraphQL Query Organization**
```typescript
// graphql/post-queries.ts
export const postQueries = {
  getPostById: `
    query GetPost($id: ID!) {
      post(id: $id) {
        id
        title
        content
        status
        author {
          name
          email
        }
      }
    }
  `,
  
  createPost: `
    mutation CreatePost($input: PostInput!) {
      createPost(input: $input) {
        id
        title
        status
      }
    }
  `
};
```

## ⚡ **Performance Optimization**

### **Smart Navigation with Performance Tracking**
```typescript
/**
 * Navigate with performance monitoring
 */
async navigateDirectlyToPostEditor(): Promise<void> {
  const startTime = performance.now();
  
  try {
    await this.page.goto('https://staging.go.ione.nyc/wp-admin/post-new.php');
    await this.page.waitForLoadState('networkidle');
    
    const loadTime = performance.now() - startTime;
    SmartLogger.logPerformance('Post editor navigation', loadTime);
    
    if (loadTime > 5000) {
      SmartLogger.log('WARN', `Slow navigation detected: ${loadTime}ms`);
    }
  } catch (error) {
    await SmartLogger.logError(error as Error, this.page);
    throw error;
  }
}
```

### **Element Helper Performance Features**
```typescript
// Built-in performance tracking in elementHelper
await elementHelper.clickElement(this.page, this.slowButton); 
// Automatically logs if operation takes > 3 seconds

await elementHelper.waitForElement(this.page, this.dynamicElement, { 
  timeout: 10000,
  performanceThreshold: 2000 
});
// Logs performance warning if wait exceeds threshold
```

## 🔄 **Error Recovery Patterns**

### **Robust Operation with Multiple Fallbacks**
```typescript
/**
 * Save operation with comprehensive error recovery
 */
async saveWithFallback(): Promise<void> {
  try {
    await elementHelper.clickElement(this.page, this.saveButton);
    
    // Try multiple success indicators
    await Promise.race([
      this.page.waitForURL(/.*action=edit/, { timeout: 8000 }),     // URL change
      this.page.waitForSelector('.updated', { timeout: 3000 }),     // Success message
      this.page.waitForSelector('#message', { timeout: 3000 })      // Alternative message
    ]);
    
    SmartLogger.logUserAction('save completed successfully', this.saveButton);
    
  } catch (primaryError) {
    SmartLogger.log('WARN', 'Primary save indicators failed, trying fallback');
    
    try {
      // Fallback: Check if save actually worked via different method
      await this.page.waitForTimeout(2000);
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('action=edit')) {
        SmartLogger.log('INFO', 'Save successful (detected via URL fallback)');
        return;
      }
      
      // Final fallback: Check for draft status
      const isDraft = await this.verifyDraftStatus();
      if (isDraft) {
        SmartLogger.log('INFO', 'Save successful (detected via draft status)');
        return;
      }
      
    } catch (fallbackError) {
      await SmartLogger.logError(fallbackError as Error, this.page, {
        originalError: primaryError,
        context: 'save operation with fallback'
      });
      throw fallbackError;
    }
  }
}
```

### **Retry Logic with Exponential Backoff**
```typescript
/**
 * Retry operation with exponential backoff
 */
async retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        SmartLogger.log('INFO', `Operation succeeded on attempt ${attempt}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        await SmartLogger.logError(lastError, this.page, {
          attempts: attempt,
          context: 'retry operation failed'
        });
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      SmartLogger.log('WARN', `Attempt ${attempt} failed, retrying in ${delay}ms`);
      await this.page.waitForTimeout(delay);
    }
  }
  
  throw lastError!;
}
```

## 🎛️ **Environment Configuration & URLs**

### **❌ NEVER Use Hardcoded URLs**
```typescript
// ❌ WRONG - Hardcoded URLs will break across environments
async navigateToPostEditor(): Promise<void> {
  await this.page.goto('https://staging.go.ione.nyc/wp-admin/post-new.php'); // ❌ Wrong
}

async navigateToHomePage(): Promise<void> {
  await this.page.goto('http://localhost:3000/');                            // ❌ Wrong
}
```

### **✅ ALWAYS Use Environment Variables**
```typescript
// ✅ CORRECT - Use EnvironmentManager for all URLs
import { EnvironmentManager } from '../utils/environment.utils';

async navigateToPostEditor(): Promise<void> {
  const envManager = EnvironmentManager.getInstance();
  const baseUrl = envManager.getBaseUrl();                    // From BASE_URL env var
  await this.page.goto(`${baseUrl}/wp-admin/post-new.php`);
}

async navigateToHomePage(): Promise<void> {
  const envManager = EnvironmentManager.getInstance();
  const baseUrl = envManager.getBaseUrl();
  await this.page.goto(`${baseUrl}/`);
}
```

### **Available Environment Variables (.env)**
```bash
# Base configuration (from .env.example)
BASE_URL=https://staging.go.ione.nyc
API_URL=https://staging.go.ione.nyc/wp-json/wp/v2
LOGIN_URL=https://staging.go.ione.nyc/wp-login.php?skipsso

# Test configuration  
TEST_TIMEOUT=30000
TEST_RETRIES=1
HEADLESS=false

# CI configuration
CI=false
WORKERS=4
```

### **Multi-Environment Support**
```typescript
// Page objects should always use environment manager
export class PostPage extends BasePage {
  private envManager = EnvironmentManager.getInstance();
  
  async navigateDirectlyToPostEditor(): Promise<void> {
    const baseUrl = this.envManager.getBaseUrl();             // ✅ From env
    const timeout = this.envManager.getTimeout();             // ✅ From env
    
    await this.page.goto(`${baseUrl}/wp-admin/post-new.php`, { 
      timeout: timeout 
    });
  }
  
  async verifyPostPublished(postId: string): Promise<boolean> {
    const baseUrl = this.envManager.getBaseUrl();
    const expectedUrl = `${baseUrl}/?p=${postId}`;             // ✅ Dynamic URL
    return this.page.url().includes(expectedUrl);
  }
}
```

### **Environment-Specific Test Configuration**
```typescript
// playwright.config.ts - Dynamic configuration
import { EnvironmentManager } from './utils/environment.utils';

const envManager = EnvironmentManager.getInstance();

export default defineConfig({
  use: {
    baseURL: envManager.getBaseUrl(),                         // ✅ From env
    actionTimeout: envManager.getTimeout(),                   // ✅ From env
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: process.env.AUTH_FILE || '.auth/staging-ione.json'  // ✅ From env
      },
    },
  ],
  
  retries: envManager.getConfig().retries,                    // ✅ From env
  workers: process.env.CI ? 2 : 4,                           // ✅ CI-aware
});
```

### **Environment-Specific Page Objects**
```typescript
export class PostPage extends BasePage {
  constructor(page: Page) {
    super(page, '#title');
  }

  async navigateDirectlyToPostEditor(): Promise<void> {
    const config = getConfig();
    const url = `${config.baseURL}/wp-admin/post-new.php`;
    
    try {
      await this.page.goto(url, { timeout: config.timeout });
      await this.page.waitForLoadState('networkidle');
      SmartLogger.logUserAction('navigated to post editor', url);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }
}
```

## 📊 **Reporting & Analytics**

### **Test Metrics Collection**
```typescript
// Automatic metrics collection via SmartLogger
test('should track test metrics @performance', async ({ page }) => {
  const startTime = performance.now();
  
  await postPage.navigateDirectlyToPostEditor();  // Navigation time tracked
  await postPage.fillPostTitle('Test Title');     // Interaction time tracked
  await postPage.saveDraft();                     // Save operation time tracked
  
  const totalTime = performance.now() - startTime;
  SmartLogger.logMetric('total_test_time', totalTime);
  
  // Performance assertions
  expect(totalTime).toBeLessThan(10000); // Test should complete under 10s
});
```

### **Allure Reporting Integration**
```typescript
import { allure } from 'allure-playwright';

test('should generate detailed allure report', async ({ page }) => {
  allure.story('Post Creation');
  allure.feature('Content Management');
  allure.severity('critical');
  
  await allure.step('Navigate to post editor', async () => {
    await postPage.navigateDirectlyToPostEditor();
  });
  
  await allure.step('Create post with content', async () => {
    await postPage.fillPostTitle('Allure Test Post');
    await postPage.fillPostContent('This is a test post for Allure reporting');
  });
  
  await allure.step('Save and verify post', async () => {
    await postPage.saveDraft();
    const isCreated = await postPage.verifyPostCreated();
    expect(isCreated).toBe(true);
  });
});
```

## 🔒 **Security & Authentication**

### **Session Management Best Practices**
```typescript
// Automatic session refresh on expiry
export class SessionManager {
  static async checkSessionValid(page: Page): Promise<boolean> {
    try {
      await page.goto('https://staging.go.ione.nyc/wp-admin/', { timeout: 10000 });
      const currentUrl = page.url();
      return currentUrl.includes('wp-admin') && !currentUrl.includes('wp-login');
    } catch {
      return false;
    }
  }

  static async refreshSessionIfNeeded(page: Page): Promise<void> {
    const isValid = await this.checkSessionValid(page);
    
    if (!isValid) {
      SmartLogger.log('WARN', 'Session expired, manual refresh required');
      throw new Error('Session expired - please run login test to refresh session');
    }
  }
}
```

---

*See also: [01-core-principles.md](./01-core-principles.md) for fundamental patterns used in these advanced features*