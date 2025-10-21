# Code Templates

## 🎭 **Page Object Template**

### **Complete Page Object Structure**

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
import { SmartLogger } from '../utils/smart-logger.utils';

/**
 * [FeatureName] Page Object Model
 * Handles all interactions with the [feature name] page
 * Following AI_AGENT_INSTRUCTIONS patterns with SmartLogger and element.helper
 */
export class [FeatureName]Page extends BasePage {
  constructor(page: Page) {
    // Use a unique selector that identifies this page
    const uniqueElement = '[data-testid="feature-container"], #feature-unique-id';
    super(page, uniqueElement);
  }

  // ===== SELECTORS =====
  
  get [elementName](): string {
    return '[data-testid="element-name"], #fallback-selector';
  }

  get [actionButton](): string {
    return '[data-testid="action-btn"], .action-button';
  }

  // ===== NAVIGATION =====
  
  /**
   * Navigate directly to [feature] page (assumes user authenticated)
   * @example await featurePage.navigateDirectlyToFeature();
   */
  async navigateDirectlyTo[Feature](): Promise<void> {
    try {
      await this.page.goto('https://staging.go.ione.nyc/wp-admin/[feature-url]');
      await this.page.waitForLoadState('networkidle');
      await this.waitForPageLoad();
      SmartLogger.logUserAction('navigated directly to [feature]', '[feature-url]');
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  // ===== INTERACTIONS =====
  
  /**
   * [Action description]
   * @param value - The value to use for the action
   * @example await featurePage.performAction('test value');
   */
  async [actionName](value: string): Promise<void> {
    try {
      await elementHelper.enterValue(this.page, this.[elementName], value);
      SmartLogger.logUserAction('[action description]', this.[elementName], value);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Click [button description]
   * @example await featurePage.clickActionButton();
   */
  async click[ActionButton](): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.[actionButton]);
      
      // Multiple success indicators with fallback
      try {
        await Promise.race([
          this.page.waitForURL(/success-pattern/, { timeout: 8000 }),
          this.page.waitForSelector('.success, .updated', { timeout: 3000 })
        ]);
      } catch (error) {
        await this.page.waitForTimeout(2000); // Graceful fallback
      }
      
      SmartLogger.logUserAction('clicked [button description]', this.[actionButton]);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  // ===== VERIFICATIONS =====
  
  /**
   * Verify [specific condition]
   * @param expectedValue - The expected value to verify
   * @returns Promise<boolean> - True if verification passes
   * @example const isValid = await featurePage.verifyCondition('expected');
   */
  async verify[Condition](expectedValue: string): Promise<boolean> {
    try {
      const actualValue = await elementHelper.getValue(this.page, this.[elementName]);
      const result = actualValue === expectedValue;
      
      SmartLogger.logAssertion(
        '[Condition] verification',
        expectedValue,
        actualValue,
        result
      );
      
      return result;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Get current [data type] (order-independent)
   * @returns Promise<string[]> - Array of current values
   */
  async get[DataType](): Promise<string[]> {
    try {
      const elements = await this.page.locator(this.[dataSelector]).all();
      const values = await Promise.all(
        elements.map(async (element) => {
          const text = await element.textContent();
          return text?.trim() || '';
        })
      );
      
      SmartLogger.logUserAction('retrieved [data type]', this.[dataSelector], values.join(', '));
      return values.filter(value => value.length > 0);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return [];
    }
  }

  /**
   * Compare arrays without order dependency
   * @private
   */
  private compareArraysOrderIndependent<T>(expected: T[], actual: T[]): boolean {
    if (expected.length !== actual.length) return false;
    
    const normalizeArray = (arr: T[]) => 
      arr.map(item => String(item).toLowerCase().trim()).sort();
    
    const expectedNormalized = normalizeArray(expected);
    const actualNormalized = normalizeArray(actual);
    
    return expectedNormalized.every((item, index) => item === actualNormalized[index]);
  }
}

export default [FeatureName]Page;
```

## 🧪 **Test File Template**

### **Complete Test Structure**

```typescript
/**
 * [Feature Name] Tests for staging.go.ione.nyc
 * Tests [feature description] functionality using saved session
 * Following AI_AGENT_INSTRUCTIONS patterns with PageFactory and page objects
 * 
 * Tests cover: [list main test scenarios]
 * 
 * Note: Uses saved session from .auth/staging-ione.json - login handled separately
 * @author XWP Platform Team
 */

import { test, expect } from '@playwright/test';
import PageFactory from '@pages/page.factory';
import { TestTags, TagCombinations } from '@fixtures/test-tags.fixture';
import { [featureName]Data } from '@fixtures/[feature-name]-data.fixture';
import { SmartLogger } from '../utils/smart-logger.utils';

test.describe('[Feature Name] Tests', {
  tag: [TestTags.STAGING_ONLY, TestTags.CORE]
}, () => {
  let pageFactory: PageFactory;
  let [featureName]Page: [FeatureName]Page;

  test.beforeEach(async ({ page }, testInfo) => {
    pageFactory = new PageFactory(page);
    [featureName]Page = pageFactory.[featureName]Page;
    page.setDefaultTimeout(30000);
    
    // Initialize SmartLogger for each test
    SmartLogger.initializeTest(testInfo.title);
    
    // NO LOGIN REQUIRED - User already authenticated via saved session
    // Navigate directly to feature page
    await [featureName]Page.navigateDirectlyTo[Feature]();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Cleanup and finalize logging
    SmartLogger.finalizeTest();
  });

  test('should [test description] @smoke @[feature-tag]', async ({ page }) => {
    // Arrange - Prepare test data
    const testData = [featureName]Data.validScenario;
    SmartLogger.log('INFO', 'Test data prepared', { testData });

    // Act - Perform actions using ONLY page object methods
    await [featureName]Page.performAction(testData.inputValue);     // ✅ Page object method
    await [featureName]Page.clickActionButton();                   // ✅ Page object method

    // Assert - Verify results using page object verification methods
    const isSuccess = await [featureName]Page.verifyCondition(testData.expectedResult);  // ✅ Page object verification
    expect(isSuccess).toBe(true);

    SmartLogger.log('PASS', 'Test completed successfully');
  });

  test('should [another test description] @regression @[feature-tag]', async ({ page }) => {
    // Arrange
    const testData = [featureName]Data.edgeCaseScenario;

    // Act - Chain page object methods for complex scenarios
    await [featureName]Page.performAction(testData.inputValue);
    await [featureName]Page.performSecondaryAction(testData.secondaryValue);

    // Assert - Multiple verifications
    const firstResult = await [featureName]Page.verifyCondition(testData.expectedFirst);
    const secondResult = await [featureName]Page.verifySecondaryCondition(testData.expectedSecond);
    
    expect(firstResult).toBe(true);
    expect(secondResult).toBe(true);
  });

  test('should handle [error scenario] @error-handling @[feature-tag]', async ({ page }) => {
    // Arrange
    const invalidData = [featureName]Data.invalidScenario;

    // Act & Assert - Test error handling
    const result = await [featureName]Page.performAction(invalidData.inputValue);
    const errorVisible = await [featureName]Page.verifyErrorMessage(invalidData.expectedError);
    
    expect(errorVisible).toBe(true);
  });
});
```

## 📊 **Test Data Fixture Template**

### **Complete Fixture Structure**

```typescript
/**
 * [Feature Name] Test Data Fixture
 * Contains all test data for [feature name] functionality
 * Following AI_AGENT_INSTRUCTIONS data independence patterns
 */

export interface [FeatureName]TestData {
  inputValue: string;
  expectedResult: string;
  description: string;
  tags?: string[];
}

export const [featureName]Data = {
  validScenario: {
    inputValue: 'Valid Test Input',
    expectedResult: 'Expected Valid Result',
    description: 'Standard valid scenario test data',
    tags: ['valid', 'standard']
  } as [FeatureName]TestData,

  edgeCaseScenario: {
    inputValue: 'Edge Case Input',
    expectedResult: 'Edge Case Result', 
    description: 'Edge case scenario test data',
    tags: ['edge-case', 'boundary']
  } as [FeatureName]TestData,

  invalidScenario: {
    inputValue: '',
    expectedResult: 'Error Message',
    description: 'Invalid input scenario test data'
  } as [FeatureName]TestData,

  specialCharacters: {
    inputValue: 'Special!@#$%^&*()Characters测试àáâãäå',
    expectedResult: 'Special!@#$%^&*()Characters测试àáâãäå',
    description: 'Unicode and special characters test data',
    tags: ['unicode', 'special-chars', 'international']
  } as [FeatureName]TestData,

  largeDataSet: {
    inputValue: 'x'.repeat(1000),
    expectedResult: 'Large data handled correctly',
    description: 'Large data volume test data'
  } as [FeatureName]TestData,

  // Dynamic data generation
  generateFreshData(): [FeatureName]TestData {
    const timestamp = Date.now();
    return {
      inputValue: `Fresh Data ${timestamp}`,
      expectedResult: `Fresh Result ${timestamp}`,
      description: 'Dynamically generated fresh test data'
    };
  },

  // Order-independent data for array testing
  arrayTestData: {
    inputTags: ['tag3', 'tag1', 'tag2'],
    expectedTags: ['tag1', 'tag2', 'tag3'], // Expected order
    description: 'Data for testing order-independent array comparisons'
  }
};

// Export individual data sets for specific test scenarios
export const validData = [featureName]Data.validScenario;
export const invalidData = [featureName]Data.invalidScenario;
export const edgeCaseData = [featureName]Data.edgeCaseScenario;
```

## 🔧 **Utility Class Template**

### **Helper Utility Structure**

```typescript
/**
 * [Feature Name] Test Utilities
 * Helper functions for [feature name] test operations
 */

export class [FeatureName]TestUtils {
  /**
   * Generate unique test data with timestamp
   */
  static generateUniqueData(prefix: string = 'Test'): string {
    return `${prefix} ${Date.now()}`;
  }

  /**
   * Compare arrays without order dependency
   */
  static compareArraysOrderIndependent<T>(expected: T[], actual: T[]): boolean {
    if (expected.length !== actual.length) return false;
    
    const normalizeArray = (arr: T[]) => 
      arr.map(item => String(item).toLowerCase().trim()).sort();
    
    const expectedNormalized = normalizeArray(expected);
    const actualNormalized = normalizeArray(actual);
    
    return expectedNormalized.every((item, index) => item === actualNormalized[index]);
  }

  /**
   * Clean and normalize text for comparison
   */
  static normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim()                // Remove leading/trailing whitespace
      .toLowerCase();        // Convert to lowercase for comparison
  }

  /**
   * Wait with exponential backoff
   */
  static async waitWithBackoff(
    condition: () => Promise<boolean>,
    maxAttempts: number = 5,
    baseDelay: number = 1000
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (await condition()) {
        return true;
      }
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return false;
  }
}
```

---

*See also: [01-core-principles.md](./01-core-principles.md) for coding standards to follow in these templates*