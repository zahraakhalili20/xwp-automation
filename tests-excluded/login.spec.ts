import { testUsers } from '../fixtures/test-data.fixture';
import { TestTags, TagCombinations } from '../fixtures/test-tags.fixture';
import PageFactory from '../pages/page.factory';
import { EnvironmentManager } from '../utils/environment.utils';
import { SmartLogger } from '../utils/smart-logger.utils';
import {
  chromium,
  Page,
  Browser,
  BrowserContext,
  test,
  expect
} from '@playwright/test';
import path from 'path';

const authFile = path.resolve('playwright/.auth/staging-ione.json');

let browser: Browser;
let context: BrowserContext;
let page: Page;
let pageFactory: PageFactory;

test.describe('Login Authentication Tests', { 
  tag: [...TagCombinations.AUTH_POSITIVE, TestTags.WORDPRESS] 
}, () => {
  test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext();
    await context.clearCookies();
    page = await context.newPage();
    pageFactory = new PageFactory(page);
    // Navigate to staging login page
    const loginUrl = process.env.STAGING_LOGIN_URL;
    if (!loginUrl) {
      throw new Error('STAGING_LOGIN_URL is not set in environment variables');
    }
    await page.goto(loginUrl);
  });

  test.beforeEach(async ({}, testInfo) => {
    // Initialize smart logging for each test
    SmartLogger.initializeTest(testInfo.title);
  });

  test.afterEach(async ({}, testInfo) => {
    // Export smart logs to test report
    const attachments = SmartLogger.exportForReporting();
    for (const attachment of attachments) {
      await testInfo.attach(attachment.name, { 
        body: attachment.content, 
        contentType: attachment.type 
      });
    }
    
    // Clear logs for next test
    SmartLogger.clearTestLogs();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should successfully login with valid admin credentials', { 
    tag: [...TagCombinations.SMOKE_LOGIN, TestTags.HAPPY_PATH],
    annotation: [
      { type: 'feature', description: 'User Authentication' },
      { type: 'story', description: 'Admin user can login with valid credentials' },
      { type: 'severity', description: 'critical' }
    ]
  }, async () => {
    try {
      SmartLogger.log('INFO', 'Starting staging login test - automated login with admin credentials');

      // Click on "login with username" first
      await pageFactory.loginPage.clickLoginWithUsername();

      // Fill in admin credentials from .env
      const username = process.env.ADMIN_USERNAME;
      const password = process.env.ADMIN_PASSWORD;
      if (!username || !password) {
        throw new Error('Admin credentials are not set in environment variables');
      }
      await pageFactory.loginPage.enterUsername(username);
      await pageFactory.loginPage.enterPassword(password);
      await pageFactory.loginPage.clickLogin();

      // Verify login success
      await page.waitForURL('**/wp-admin**', { timeout: 10000 });
      const currentUrl = page.url();
      const isOnDashboard = currentUrl.includes('wp-admin') || currentUrl.includes('dashboard');
      SmartLogger.logAssertion('Should be on dashboard after login', 'wp-admin or dashboard', currentUrl, isOnDashboard);
      expect(isOnDashboard).toBe(true);

      // Save authentication state for other tests
      await page.context().storageState({ path: authFile });
      SmartLogger.log('INFO', 'Staging authentication state saved successfully');

    } catch (error) {
      await SmartLogger.logError(error as Error, page);
      throw error;
    }
  });

});