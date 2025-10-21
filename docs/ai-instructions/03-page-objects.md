# Page Object Patterns & Locator Usage

## 🎭 **Page Object Extension Guidelines**

### **Decision Tree: Extend vs Create New**

```typescript
// STEP 1: Does the page object exist?
if (pageObjectExists) {
  // STEP 2: Does it have the required elements/methods?
  if (missingElements || missingMethods) {
    // → EXTEND existing page object
    // → ADD missing elements as getters
    // → ADD missing methods following existing patterns
  } else {
    // → USE existing page object as-is
  }
} else {
  // → CREATE new page object from template
  // → ADD to page.factory.ts
  // → CREATE corresponding fixture file
}
```

### **When to Extend Existing Page Objects**
- **Same logical page** → Extend existing page object
- **Missing elements** → Add selectors to existing page object
- **Missing methods** → Add interaction methods to existing page object
- **Related functionality** → Keep together in same page object

### **When to Create New Page Objects**
- **Different page/URL** → Create new page object
- **Distinct component** → Create separate page object
- **Unrelated functionality** → Create new page object

## 🚫 **Critical: NO Direct Playwright API in Tests**

### **❌ NEVER Use Direct API Calls in Test Files**
```typescript
// ❌ WRONG - Direct Playwright API usage in tests
test('should create post', async ({ page }) => {
  await page.goto('https://staging.site.com/post-new.php');     // ❌ Wrong
  await page.click('#submit-button');                           // ❌ Wrong
  await page.fill('#title', 'My Title');                        // ❌ Wrong
  await page.locator('#content').fill('Content');               // ❌ Wrong
  await page.waitForSelector('.success');                       // ❌ Wrong
  await expect(page).toHaveURL(/success/);                      // ❌ Wrong
});
```

### **✅ ALWAYS Use Page Object Methods**
```typescript
// ✅ CORRECT - Page object method usage
test('should create post', async ({ page }) => {
  const postPage = pageFactory.postPage;
  
  await postPage.navigateDirectlyToPostEditor();       // ✅ Page object navigation
  await postPage.clickSubmitButton();                  // ✅ Page object interaction
  await postPage.fillPostTitle('My Title');            // ✅ Page object interaction
  await postPage.fillPostContent('Content');           // ✅ Page object interaction
  await postPage.waitForSuccessMessage();              // ✅ Page object waiting
  const isSuccess = await postPage.verifySuccess();    // ✅ Page object verification
  expect(isSuccess).toBe(true);
});
```

## 🏗️ **Page Object Structure**

### **Complete Page Object Example**
```typescript
import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
import { SmartLogger } from '../utils/smart-logger.utils';

/**
 * Post Page Object Model
 * Handles all interactions with the WordPress post editor page
 */
export class PostPage extends BasePage {
  constructor(page: Page) {
    super(page, '#title'); // Unique identifier for this page
  }

  // ===== SELECTORS =====
  get titleField(): string {
    return '#title';
  }

  get contentField(): string {
    return '#content';
  }

  get saveDraftButton(): string {
    return '#save-post';
  }

  // ===== NAVIGATION =====
  /**
   * Navigate directly to post editor (assumes user authenticated)
   */
  async navigateDirectlyToPostEditor(): Promise<void> {
    try {
      await this.page.goto('https://staging.go.ione.nyc/wp-admin/post-new.php');
      await this.page.waitForLoadState('networkidle');
      await this.waitForPageLoad();
      SmartLogger.logUserAction('navigated directly to post editor', 'post-new.php');
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  // ===== INTERACTIONS =====
  /**
   * Fill the post title field
   */
  async fillPostTitle(title: string): Promise<void> {
    try {
      await elementHelper.enterValue(this.page, this.titleField, title);
      SmartLogger.logUserAction('filled post title', this.titleField, title);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Save post as draft
   */
  async saveDraft(): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.saveDraftButton);
      
      // Multiple success indicators with fallback
      try {
        await Promise.race([
          this.page.waitForURL(/.*post\.php.*action=edit/, { timeout: 8000 }),
          this.page.waitForSelector('.updated, .notice-success', { timeout: 3000 })
        ]);
      } catch (error) {
        await this.page.waitForTimeout(2000); // Graceful fallback
      }
      
      SmartLogger.logUserAction('saved post as draft', this.saveDraftButton);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  // ===== VERIFICATIONS =====
  /**
   * Verify post details match expected values
   */
  async verifyPostDetails(expectedTitle: string, expectedContent?: string): Promise<boolean> {
    try {
      const actualTitle = await elementHelper.getValue(this.page, this.titleField);
      const titleMatch = actualTitle === expectedTitle;
      
      let contentMatch = true;
      if (expectedContent) {
        const actualContent = await elementHelper.getValue(this.page, this.contentField);
        contentMatch = actualContent === expectedContent;
      }
      
      const result = titleMatch && contentMatch;
      SmartLogger.logAssertion('Post details verification', `${expectedTitle}, ${expectedContent}`, `${actualTitle}, content match: ${contentMatch}`, result);
      
      return result;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }
}

export default PostPage;
```

## 🔧 **Element Management**

### **Adding Missing Elements**
```typescript
// If PostPage is missing a "publish" button:
export class PostPage extends BasePage {
  // ... existing elements ...

  // ADD missing element selector
  get publishButton(): string {
    return '#publish';
  }

  // ADD missing interaction method
  /**
   * Publish the post
   */
  async publishPost(): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.publishButton);
      await this.page.waitForSelector('.updated, .notice-success', { timeout: 10000 });
      SmartLogger.logUserAction('published post', this.publishButton);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }
}
```

### **Selector Best Practices**
```typescript
// ✅ Robust selectors with fallbacks
get submitButton(): string {
  return '[data-testid="submit"], #submit-button, .submit-btn';
}

// ✅ Specific and stable selectors
get postTitle(): string {
  return '#title'; // WordPress admin uses stable IDs
}

// ❌ Fragile selectors
get submitButton(): string {
  return 'button:nth-child(3)'; // Breaks if DOM changes
}
```

## 📋 **Page Object Responsibilities**

### **What Belongs in Page Objects**
- **Navigation**: All `page.goto()` calls
- **Interactions**: All clicks, fills, selections
- **Waiting**: All `waitForSelector`, `waitForLoadState` calls  
- **Element queries**: Getting text, attributes, visibility
- **Verification**: Element-specific validations

### **What Belongs in Tests**
- **Test logic**: Arrange, Act, Assert structure
- **Data preparation**: Test data creation and setup
- **Business assertions**: `expect()` calls for business rules
- **Test flow**: Combining page object methods for complete scenarios

## 🔄 **Order-Independent Verification**

### **Robust Comparison Methods**
```typescript
/**
 * Compare arrays without order dependency
 */
private compareArraysOrderIndependent<T>(expected: T[], actual: T[]): boolean {
  if (expected.length !== actual.length) return false;
  
  const normalizeArray = (arr: T[]) => 
    arr.map(item => String(item).toLowerCase().trim()).sort();
  
  const expectedNormalized = normalizeArray(expected);
  const actualNormalized = normalizeArray(actual);
  
  return expectedNormalized.every((item, index) => item === actualNormalized[index]);
}

/**
 * Verify tags with order-independent comparison
 */
async verifyTags(expectedTags: string[]): Promise<boolean> {
  const actualTags = await this.getTagsValue();
  return this.compareArraysOrderIndependent(expectedTags, actualTags);
}
```

## 🚫 **Allowed Direct API Exceptions**

### **Limited Direct API Usage**
```typescript
// ✅ Test setup/teardown
await page.context().storageState({ path: '.auth/session.json' });

// ✅ Debug utilities  
await page.pause();

// ✅ Framework expectations
expect(result).toBe(true);

// ✅ Test metadata
const testName = test.info().title;
```

---

*See also: [05-templates.md](./05-templates.md) for complete page object templates*