# Authentication & Session Management

## 🔐 **Critical Authentication Rules**

### **❌ NEVER Add Login Steps to Functional Tests**
- **Authentication is handled by saved sessions**
- **Use saved session from `.auth/staging-ione.json`** configured in playwright.config.ts
- **AVOID** pageFactory.loginPage or any login-related code in functional tests
- **ONLY** create login tests for testing authentication functionality itself
- **ASSUME** user is already logged in for all functional tests

## ✅ **Correct Session-Based Pattern**

### **Functional Test Structure**
```typescript
test.describe('Post Creation Tests', () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
    // User is automatically logged in via saved session from playwright.config.ts
    // NO login steps needed - just navigate to feature page
  });

  test('should create post @post-creation', async ({ page }) => {
    // Direct navigation to feature - user already authenticated
    await pageFactory.postPage.navigateDirectlyToPostEditor();
    
    // Test the actual functionality
    await pageFactory.postPage.fillPostTitle('Test Title');
    await pageFactory.postPage.saveDraft();
    
    // Verify results
    const isCreated = await pageFactory.postPage.verifyPostCreated();
    expect(isCreated).toBe(true);
  });
});
```

## ❌ **Incorrect Login Pattern (DON'T DO THIS)**

```typescript
// ❌ WRONG - Don't add login steps to functional tests
test('should create post', async ({ page }) => {
  await pageFactory.loginPage.navigate();           // ❌ Wrong
  await pageFactory.loginPage.enterCredentials();   // ❌ Wrong  
  await pageFactory.loginPage.clickLogin();         // ❌ Wrong
  
  // Then test the feature...
  await pageFactory.postPage.navigateToPostEditor();
  // ... rest of test
});
```

## 🔧 **Session Configuration**

### **Playwright Config Setup**
The session is automatically configured in `playwright.config.ts`:
```typescript
{
  name: 'staging',
  use: {
    baseURL: 'https://staging.go.ione.nyc',
    storageState: 'playwright/.auth/staging-ione.json'  // Automatically loads saved session
  }
}
```

### **Session File Structure**
```json
{
  "cookies": [...],
  "origins": [
    {
      "origin": "https://staging.go.ione.nyc",
      "localStorage": [...],
      "sessionStorage": [...]
    }
  ]
}
```

## 🎯 **When to Use Login Functionality**

### **Only These Cases Need Login:**
1. **`tests/login.spec.ts`** - Testing authentication functionality itself
2. **Auth setup utilities** - Creating or refreshing sessions
3. **Global setup files** - Initial session creation

### **Login Test Example (Legitimate Use)**
```typescript
// ✅ CORRECT - This is testing authentication itself
test.describe('Login Authentication Tests', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('https://staging.go.ione.nyc/wp-login.php');
    
    // Manual login required for session creation
    await page.pause(); // Allow manual login
    
    // Verify login success
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('wp-admin');
    expect(isOnDashboard).toBe(true);
    
    // Save authentication state for other tests
    await page.context().storageState({ path: '.auth/staging-ione.json' });
  });
});
```

## 🚀 **Best Practices**

### **Session Management**
- **Sessions persist** across test runs for efficiency
- **Manual login** only required when session expires or for auth testing
- **Tests assume** user has admin privileges and is authenticated
- **Session refresh** handled automatically by Playwright

### **Test File Headers**
Always include this comment in functional test files:
```typescript
/**
 * Feature Tests for staging.go.ione.nyc
 * Note: Uses saved session from .auth/staging-ione.json - login handled separately
 */
```

### **Navigation Patterns**
```typescript
// ✅ Direct navigation - user already authenticated
await pageFactory.postPage.navigateDirectlyToPostEditor();
await pageFactory.dashboardPage.navigateDirectlyToDashboard();
await pageFactory.profilePage.navigateDirectlyToProfile();

// ❌ Don't check authentication in functional tests
if (await pageFactory.loginPage.isLoggedIn()) {
  // This check is unnecessary
}
```

## 🔍 **Troubleshooting Sessions**

### **Session Expired Symptoms**
- Tests redirect to login page
- "Please log in" errors
- Authentication-related failures

### **Session Refresh Process**
1. Run the login test manually: `npm test tests/login.spec.ts`
2. Complete manual login when prompted
3. New session automatically saved to `.auth/staging-ione.json`
4. All other tests will use the refreshed session

### **Environment-Specific Sessions**
```typescript
// Different sessions for different environments
production: { 
  storageState: '.auth/production.json' 
},
staging: { 
  storageState: 'playwright/.auth/staging-ione.json' 
},
development: { 
  storageState: '.auth/development.json' 
}
```

---

*See also: [07-anti-patterns.md](./07-anti-patterns.md) for authentication anti-patterns to avoid*