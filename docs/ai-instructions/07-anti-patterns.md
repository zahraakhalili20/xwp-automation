# Anti-Patterns & Common Mistakes

## ⚠️ **CRITICAL: Anti-Patterns to AVOID**

### **❌ Authentication Anti-Patterns**

```typescript
// ❌ NEVER do this in functional tests:
test('should create post', async ({ page }) => {
  await pageFactory.loginPage.navigate();          // ❌ Wrong - no login needed
  await pageFactory.loginPage.enterCredentials();  // ❌ Wrong - session exists
  await pageFactory.loginPage.clickLogin();        // ❌ Wrong - already authenticated
  
  // Then test the feature...
});

// ✅ ALWAYS do this instead:
test('should create post', async ({ page }) => {
  // User already authenticated via saved session
  await pageFactory.postPage.navigateDirectlyToPostEditor(); // ✅ Correct
  
  // Test the actual functionality
  await pageFactory.postPage.fillPostTitle('Test Title');
});
```

### **❌ Direct Playwright API Anti-Patterns**

```typescript
// ❌ NEVER use direct API calls in test files:
test('should create post', async ({ page }) => {
  await page.goto('https://staging.site.com/page');     // ❌ Wrong
  await page.click('#submit-button');                   // ❌ Wrong
  await page.fill('#title', 'My Title');                // ❌ Wrong
  await page.locator('#content').fill('Content');       // ❌ Wrong
  await page.waitForSelector('.success');               // ❌ Wrong
  await expect(page).toHaveURL(/success/);              // ❌ Wrong
  await page.waitForLoadState('networkidle');           // ❌ Wrong
});

// ✅ ALWAYS use page object methods instead:
test('should create post', async ({ page }) => {
  await pageFactory.postPage.navigateDirectlyToPostEditor(); // ✅ Correct
  await pageFactory.postPage.clickSubmitButton();            // ✅ Correct
  await pageFactory.postPage.fillPostTitle('My Title');      // ✅ Correct
  await pageFactory.postPage.fillPostContent('Content');     // ✅ Correct
  await pageFactory.postPage.waitForSuccessMessage();        // ✅ Correct
  const isSuccess = await pageFactory.postPage.verifySuccess(); // ✅ Correct
  expect(isSuccess).toBe(true);
});
```

### **❌ Data Comparison Anti-Patterns**

```typescript
// ❌ NEVER do order-dependent comparisons:
test('should verify tags', async ({ page }) => {
  const expectedTags = ['tag1', 'tag2', 'tag3'];
  const actualTags = await postPage.getTags();
  
  expect(actualTags).toEqual(expectedTags);         // ❌ Wrong - fails if order differs
  expect(actualTags[0]).toBe('tag1');               // ❌ Wrong - assumes order
});

// ✅ ALWAYS use order-independent comparisons:
test('should verify tags', async ({ page }) => {
  const expectedTags = ['tag1', 'tag2', 'tag3'];
  const actualTags = await postPage.getTags();
  
  expect(actualTags.sort()).toEqual(expectedTags.sort()); // ✅ Correct
  
  // Or use page object verification method:
  const tagsMatch = await postPage.verifyTags(expectedTags); // ✅ Best
  expect(tagsMatch).toBe(true);
});
```

### **❌ Static Waits Anti-Patterns**

```typescript
// ❌ NEVER use hardcoded static waits:
test('should create post', async ({ page }) => {
  await postPage.fillPostTitle('Test Title');
  await page.waitForTimeout(3000);              // ❌ Wrong - hardcoded wait
  await postPage.saveDraft();
  await page.waitForTimeout(5000);              // ❌ Wrong - unpredictable timing
});

// ❌ NEVER use magic numbers for timeouts:
async saveDraft(): Promise<void> {
  await elementHelper.clickElement(this.page, this.saveDraftButton);
  await this.page.waitForTimeout(2500);         // ❌ Wrong - magic number
}

// ✅ ALWAYS use constants and smart waits:
test('should create post', async ({ page }) => {
  await postPage.fillPostTitle('Test Title');
  await postPage.saveDraft();                   // ✅ Correct - page object handles waiting
});

// ✅ ALWAYS use predefined timeouts from fixtures:
import { testTimeouts } from '../fixtures/test-data.fixture';

async saveDraft(): Promise<void> {
  await elementHelper.clickElement(this.page, this.saveDraftButton);
  
  try {
    await Promise.race([
      this.page.waitForURL(/.*post\.php.*action=edit/, { timeout: testTimeouts.medium }),
      this.page.waitForSelector('.updated, .notice-success', { timeout: testTimeouts.short })
    ]);
  } catch (error) {
    await this.page.waitForTimeout(testTimeouts.short); // Use constant, not magic number
  }
}
```

### **❌ Error Handling Anti-Patterns**

```typescript
// ❌ NEVER rely on single success indicators:
async saveDraft(): Promise<void> {
  await elementHelper.clickElement(this.page, this.saveDraftButton);
  await this.page.waitForSelector('.success');     // ❌ Wrong - may timeout
}

// ✅ ALWAYS use multiple fallback strategies:
async saveDraft(): Promise<void> {
  await elementHelper.clickElement(this.page, this.saveDraftButton);
  
  try {
    await Promise.race([                             // ✅ Correct
      this.page.waitForURL(/.*post\.php.*action=edit/, { timeout: 8000 }),
      this.page.waitForSelector('.updated, .notice-success', { timeout: 3000 })
    ]);
  } catch (error) {
    await this.page.waitForTimeout(2000); // Graceful fallback
  }
}
```

### **❌ Test Organization Anti-Patterns**

```typescript
// ❌ WRONG - Hardcoded data and poor organization
test('test post stuff', async ({ page }) => {
  await postPage.fillTitle('hardcoded title');     // ❌ Hardcoded data
  await postPage.fillContent('some content');      // ❌ Hardcoded data
  
  // No clear sections
  await postPage.save();
  expect(postPage.getTitle()).toBe('hardcoded title');
});

// ✅ CORRECT - Proper data management and structure
test('should create post with title and content @post-creation @smoke', async ({ page }) => {
  // Arrange - Use fixture data
  const testData = postCreationData.validPost;
  
  // Act - Perform actions
  await postPage.fillPostTitle(testData.title);
  await postPage.fillPostContent(testData.content);
  await postPage.saveDraft();
  
  // Assert - Verify results  
  const isCreated = await postPage.verifyPostDetails(testData.title, testData.content);
  expect(isCreated).toBe(true);
});
```

## 🚨 **Common Code Violations**

### **❌ Business Logic in Page Objects**

```typescript
// ❌ WRONG - Complex business logic in page object
class PostPage extends BasePage {
  async createCompletePost(data: PostData): Promise<void> {
    // This is test logic - belongs in test file
    await this.fillTitle(data.title);
    await this.fillContent(data.content);
    if (data.tags) {
      await this.addTags(data.tags);
    }
    if (data.featured) {
      await this.setFeaturedImage(data.image);
    }
    await this.publish();
    
    // Verification logic should be separate
    const isPublished = await this.verifyPublished();
    if (!isPublished) {
      throw new Error('Post creation failed');
    }
  }
}

// ✅ CORRECT - Page objects only handle interactions
class PostPage extends BasePage {
  async fillPostTitle(title: string): Promise<void> {
    await elementHelper.enterValue(this.page, this.titleField, title);
  }
  
  async fillPostContent(content: string): Promise<void> {
    await elementHelper.enterValue(this.page, this.contentField, content);
  }
  
  async publishPost(): Promise<void> {
    await elementHelper.clickElement(this.page, this.publishButton);
  }
}
```

### **❌ Missing Error Context**

```typescript
// ❌ WRONG - Generic error handling
async fillPostTitle(title: string): Promise<void> {
  try {
    await this.page.fill('#title', title);
  } catch (error) {
    throw error; // No context or logging
  }
}

// ✅ CORRECT - Proper error context and logging
async fillPostTitle(title: string): Promise<void> {
  try {
    await elementHelper.enterValue(this.page, this.titleField, title);
    SmartLogger.logUserAction('filled post title', this.titleField, title);
  } catch (error) {
    await SmartLogger.logError(error as Error, this.page, {
      action: 'fillPostTitle',
      title: title,
      element: this.titleField
    });
    throw error;
  }
}
```

## ✅ **Quick Violation Detection**

### **Red Flags in Test Files**
- `await page.goto()` → Move to page object navigation method
- `await page.click()` → Move to page object interaction method  
- `await page.fill()` → Move to page object interaction method
- `await page.locator()` → Move to page object method
- `await page.waitForSelector()` → Move to page object waiting method
- `expect(page).toHaveURL()` → Move to page object verification method
- Login steps in functional tests → Remove, use saved session
- Hardcoded strings → Move to fixture files
- Order-dependent array comparisons → Make order-independent

### **Red Flags in Page Objects**
- Complex business logic → Move to test files
- Multiple actions in one method → Split into focused methods
- Test assertions → Move to test files
- No error handling → Add try-catch with SmartLogger
- Direct Playwright API without elementHelper → Use elementHelper

## 🔍 **Quick Fix Guide**

### **Direct API Usage Fix**
```typescript
// BEFORE (❌ Wrong)
await page.click('#submit');

// AFTER (✅ Correct)
await pageFactory.postPage.clickSubmitButton();
```

### **Authentication Fix**
```typescript
// BEFORE (❌ Wrong)
await pageFactory.loginPage.enterCredentials();
await pageFactory.loginPage.clickLogin();

// AFTER (✅ Correct)
// Remove login steps - user already authenticated via saved session
```

### **Order-Independent Comparison Fix**
```typescript
// BEFORE (❌ Wrong)
expect(actualTags).toEqual(expectedTags);

// AFTER (✅ Correct)
expect(actualTags.sort()).toEqual(expectedTags.sort());
// Or better: use page object verification method
const tagsMatch = await postPage.verifyTags(expectedTags);
expect(tagsMatch).toBe(true);
```

### **Error Handling Fix**
```typescript
// BEFORE (❌ Wrong)
await this.page.waitForSelector('.success');

// AFTER (✅ Correct)
try {
  await Promise.race([
    this.page.waitForURL(/success/, { timeout: 8000 }),
    this.page.waitForSelector('.success', { timeout: 3000 })
  ]);
} catch (error) {
  await this.page.waitForTimeout(2000); // Graceful fallback
}
```

---

*See also: [06-ai-guidelines.md](./06-ai-guidelines.md) for decision-making guidance to prevent these anti-patterns*