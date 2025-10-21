# AI Decision-Making Guidelines

## 🤖 **Before Creating Any Code - ALWAYS CHECK:**

### **Step 0: Authentication Decision (CRITICAL)**

```typescript
// QUESTION: Does this test need login functionality?
if (testingAuthenticationItself) {
  // → ONLY for tests/login.spec.ts or auth setup utilities
  // → USE pageFactory.loginPage methods
} else {
  // → FUNCTIONAL TEST - User already authenticated via saved session
  // → NEVER add login steps
  // → START with direct navigation to feature
}

// EXAMPLES:
// ✅ Post creation test → Navigate directly to post editor
// ✅ Dashboard test → Navigate directly to dashboard  
// ✅ User profile → Navigate directly to profile page
// ❌ DON'T add login.enterCredentials() in any functional test
```

### **Step 1: Page Object Pattern Decision (CRITICAL)**

```typescript
// QUESTION: Am I about to write direct Playwright API calls in a test?
if (writingInTestFile && usingDirectAPI) {
  // → WRONG APPROACH - Move to page object
  // ❌ await page.goto(), page.click(), page.fill(), page.locator()
  // ❌ await expect(page).toHaveURL(), page.waitForSelector()
} else {
  // → CORRECT APPROACH - Use page object methods
  // ✅ await pageFactory.postPage.navigateDirectlyToPostEditor()
  // ✅ await pageFactory.postPage.fillPostTitle()
  // ✅ await pageFactory.postPage.verifyPostCreated()
}

// EXAMPLES:
// ✅ Navigation → pageFactory.postPage.navigateDirectlyToPostEditor()
// ✅ Interaction → pageFactory.postPage.clickSubmitButton()
// ✅ Verification → pageFactory.postPage.verifyElementVisible()
// ❌ DON'T use page.goto(), page.click(), page.locator() in tests
```

### **Step 2: Existing Page Objects Analysis**

```bash
# Check what page objects exist
ls pages/
# Result: base.page.ts, login.page.ts, dashboard.page.ts, post.page.ts, page.factory.ts
```

### **Step 3: Decision Tree for Page Objects**

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

### **Step 4: Test File Decision Logic**

```typescript
// STEP 1: Does test file exist for this feature?
if (testFileExists) {
  // → ADD new test cases to existing file
  // → REUSE existing setup/teardown
  // → MAINTAIN consistent describe blocks
} else {
  // → CREATE new test file from template
  // → CREATE corresponding fixture file
  // → FOLLOW established patterns
}
```

## 🎯 **Decision Workflow Examples**

### **Example 1: User wants to test post creation**

```typescript
// Step 0: Authentication needed? → NO (functional test)
// Step 1: Using direct API? → NO (use page objects)
// Step 2: Check existing pages → PostPage exists ✓
// Step 3: Missing methods? → Check for fillPostTitle(), saveDraft()
// Step 4: Test file exists? → post-creation.spec.ts exists ✓

// DECISION: Extend PostPage if missing methods, add test to existing file
```

### **Example 2: User wants to verify WordPress dashboard**

```typescript
// Step 0: Authentication needed? → NO (functional test)
// Step 1: Using direct API? → NO (use page objects)  
// Step 2: Check existing pages → DashboardPage exists ✓
// Step 3: Missing methods? → Check for verifyMenuVisible(), getWidgets()
// Step 4: Test file exists? → dashboard.spec.ts exists ✓

// DECISION: Extend DashboardPage if missing verification methods
```

### **Example 3: User wants to test login functionality**

```typescript
// Step 0: Authentication needed? → YES (testing auth itself)
// Step 1: Using direct API? → LIMITED (page.pause() for manual login)
// Step 2: Check existing pages → LoginPage exists ✓  
// Step 3: Missing methods? → Check existing methods
// Step 4: Test file exists? → login.spec.ts exists ✓

// DECISION: Use LoginPage methods, this is legitimate login test
```

## 🧠 **AI Reasoning Framework**

### **Pre-Code Analysis Questions**

1. **What is the user trying to test?**
   - Authentication functionality → Use login methods
   - Feature functionality → Assume authenticated, use page objects

2. **Where will this code go?**
   - Test file → Use page object methods only
   - Page object → Add elements and interactions
   - Utility → Helper functions and shared logic

3. **What already exists?**
   - Check existing page objects first
   - Look for similar patterns to follow
   - Identify reusable components

4. **What patterns should I follow?**
   - Same page → Extend existing page object
   - New page → Create new page object
   - Same feature → Add to existing test file

### **Code Generation Priorities**

```typescript
// PRIORITY 1: Reuse existing code
if (existingMethodExists) {
  // → Use existing method
  await pageFactory.postPage.existingMethod();
}

// PRIORITY 2: Extend existing classes  
else if (samePageObject) {
  // → Add method to existing page object
  class PostPage extends BasePage {
    async newMethod(): Promise<void> { /* implementation */ }
  }
}

// PRIORITY 3: Create new classes
else {
  // → Create new page object following template
  class NewPage extends BasePage { /* implementation */ }
}
```

## 🔍 **Context Analysis Framework**

### **User Request Analysis**

```typescript
// Parse user request for:
const analysis = {
  feature: 'post creation',           // What feature?
  testType: 'functional',             // Auth test or functional?
  pageObject: 'PostPage',             // Which page object?
  missingElements: ['publishButton'], // What's missing?
  missingMethods: ['publishPost'],    // What methods needed?
  existingFile: 'post-creation.spec.ts' // Where to add test?
};
```

### **Codebase State Analysis**

```typescript
// Check current state:
const codebaseState = {
  pageObjects: ['BasePage', 'LoginPage', 'PostPage', 'DashboardPage'],
  testFiles: ['login.spec.ts', 'post-creation.spec.ts', 'dashboard.spec.ts'],
  missingCapabilities: ['tag verification', 'publish workflow'],
  existingPatterns: ['session-based auth', 'page object methods']
};
```

## ✅ **Quick Decision Checklist**

Use this checklist before generating any code:

1. **Authentication needed?** → Only if testing auth itself
2. **Login code in test?** → Remove it, use saved session
3. **Direct API calls in test?** → Move to page object methods
4. **page.goto() in test?** → Use page object navigation  
5. **page.click/fill/locator in test?** → Use page object interactions
6. **Array comparison?** → Make it order-independent
7. **Single timeout point?** → Add fallback strategies
8. **New page object needed?** → Check if existing one can be extended
9. **Missing test file?** → Create with proper fixture data
10. **Error handling present?** → Add try-catch with SmartLogger

## 🎪 **Decision Examples by Scenario**

### **Scenario: "Create a test for post publishing"**

```typescript
// Analysis:
// - Feature: Post publishing (functional test)
// - Authentication: Not needed (saved session)
// - Page Object: PostPage likely exists
// - Direct API: Should not be used in test
// - Missing: Possibly publishPost() method

// Decision Path:
// 1. Check PostPage exists ✓
// 2. Check for publishPost() method
// 3. If missing → Add to PostPage
// 4. Create test using page object methods only
// 5. Add to existing post-creation.spec.ts file
```

### **Scenario: "Verify dashboard widgets load correctly"**

```typescript
// Analysis:
// - Feature: Dashboard verification (functional test)  
// - Authentication: Not needed (saved session)
// - Page Object: DashboardPage likely exists
// - Missing: Widget verification methods

// Decision Path:
// 1. Check DashboardPage exists ✓
// 2. Add getWidgets(), verifyWidgetsLoaded() methods
// 3. Create test using page object verification methods
// 4. Add to existing dashboard.spec.ts file
```

---

*See also: [07-anti-patterns.md](./07-anti-patterns.md) for common mistakes to avoid during decision-making*