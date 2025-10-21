# Core Principles & Standards

## 🚨 **CRITICAL FIRST STEP: Live Site Inspection**

### **⚠️ MANDATORY: Before Writing ANY Test**

**ALWAYS start by launching and inspecting the live site:**

1. **🌐 Open staging.go.ione.nyc in browser**
2. **🔍 Navigate through the actual UI manually** 
3. **📋 Use DevTools (F12) to inspect all elements**
4. **✅ Document selectors, behaviors, and user flows**
5. **🧪 Test edge cases and error conditions**

**NEVER guess or assume - always verify through live inspection first!**

---

## 🎯 **Page Object Model (POM) Structure**

### **Fundamental Rules**
- **ALWAYS** extend `BasePage` for new page objects
- **ONE** page object per logical page/component  
- **NO** test logic in page objects - only page interactions
- **USE** descriptive method names: `clickLoginButton()`, `enterUsername()`
- **FOLLOW** naming conventions: PascalCase for classes, camelCase for methods

### **Page Object Responsibilities**
```typescript
// ✅ CORRECT - Page objects handle interactions
class PostPage extends BasePage {
  async fillPostTitle(title: string): Promise<void> {
    await elementHelper.enterValue(this.page, this.titleField, title);
  }
  
  async verifyPostCreated(): Promise<boolean> {
    return await elementHelper.isElementDisplayed(this.page.locator(this.successMessage));
  }
}

// ❌ WRONG - No business logic in page objects
class PostPage extends BasePage {
  async createCompletePost(data: PostData): Promise<void> {
    // This is test logic - belongs in test file
    await this.fillTitle(data.title);
    await this.fillContent(data.content);
    await this.addTags(data.tags);
    await this.publish();
    // Verification logic should be separate
  }
}
```

## 📝 **Code Quality Standards**

### **Documentation Requirements**
```typescript
/**
 * Fill the post title field
 * @param title - The title text to enter
 * @example
 * await postPage.fillPostTitle('My Amazing Post');
 */
async fillPostTitle(title: string): Promise<void> {
  await elementHelper.enterValue(this.page, this.titleField, title);
}
```

### **Error Handling Pattern**
```typescript
async performAction(): Promise<void> {
  try {
    await elementHelper.clickElement(this.page, this.actionButton);
    await this.waitForActionComplete();
    SmartLogger.logUserAction('performed action', this.actionButton);
  } catch (error) {
    await SmartLogger.logError(error as Error, this.page);
    throw error;
  }
}
```

### **Type Safety Requirements**
```typescript
// ✅ Use proper TypeScript types
interface PostData {
  title: string;
  content: string;
  tags?: string[];
  status: 'draft' | 'published';
}

// ✅ Return types for methods
async getPostStatus(): Promise<'draft' | 'published'> {
  const url = this.page.url();
  return url.includes('action=edit') ? 'draft' : 'published';
}
```

## 🏗️ **File Organization Standards**

### **Directory Structure**
```
├── pages/           # Page object models
├── tests/          # Test files
├── fixtures/       # Test data
├── utils/          # Utility classes
├── types/          # TypeScript type definitions
└── docs/           # Documentation
```

### **Naming Conventions**
- **Files**: `kebab-case.extension` → `post-creation.spec.ts`
- **Classes**: `PascalCase` → `PostPage`, `DashboardPage`
- **Methods**: `camelCase` → `fillPostTitle()`, `verifyElementVisible()`
- **Constants**: `UPPER_SNAKE_CASE` → `DEFAULT_TIMEOUT`, `API_ENDPOINTS`
- **Variables**: `camelCase` → `testData`, `expectedResult`

## 🎯 **Test Organization Principles**

### **Test Structure**
```typescript
test.describe('Feature Tests', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
    // Setup for each test
  });

  test('should perform specific action @smoke @feature', async ({ page }) => {
    // Arrange - Prepare test data
    const testData = { /* test data */ };
    
    // Act - Perform actions
    await pageFactory.featurePage.performAction(testData);
    
    // Assert - Verify results
    const result = await pageFactory.featurePage.verifyResult();
    expect(result).toBe(true);
  });
});
```

### **Data Independence Rules**
- **NO** hardcoded data in tests - use variables and fixtures
- **CREATE** fresh test data for each test when possible
- **AVOID** dependencies on existing data - tests should be self-contained
- **CLEAN UP** test data after test completion
- **ONE** fixture file per feature under `/fixtures/`

### **Test Naming Standards**
```typescript
// ✅ Descriptive test names
test('should create draft post with title and content @post-creation @smoke', async () => {});
test('should verify post details persist after editing @post-verification', async () => {});

// ❌ Generic test names
test('test post', async () => {});
test('check stuff', async () => {});
```

## 🏷️ **Tagging System**

### **Required Tags**
- **@smoke** - Core functionality tests
- **@regression** - Full regression suite
- **@critical** - Business-critical features
- **@staging-only** - Tests requiring staging environment

### **Feature Tags**
- **@post-creation** - Post creation functionality
- **@authentication** - Login/logout functionality
- **@dashboard** - Dashboard features
- **@navigation** - Site navigation

### **Usage Example**
```typescript
test('should create and publish post @smoke @post-creation @critical', async ({ page }) => {
  // Test implementation
});
```

---

*See also: [03-page-objects.md](./03-page-objects.md) for detailed page object patterns*