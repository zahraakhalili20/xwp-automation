import { Page } from '@playwright/test';
import { SmartLogger } from '../utils/smart-logger.utils';
import { ErrorInspector } from '../utils/error-inspector.utils';

export class BasePage {
  protected page: Page;
  protected selector: string;
  protected errorInspector: ErrorInspector;

  /**
   * Constructs a new BasePage instance.
   * @param page - The Playwright Page object.
   * @param selector - A unique selector used to verify the page is loaded.
   */
  constructor(page: Page, selector: string) {
    this.page = page;
    this.selector = selector;
    this.errorInspector = new ErrorInspector(page);
  }

  /**
   * Navigates to the base URL (from process.env.URL) plus an optional path.
   * This gives flexibility if you want to navigate to different endpoints.
   * @param path - An optional path to append to the base URL.
   */
  async navigate(path: string = ''): Promise<void> {
    const baseURL = process.env.LOGIN_URL || '';
    if (!baseURL) {
      throw new Error('Base URL is not defined in the environment variables.');
    }
    await this.page.goto(`${baseURL}${path}`);
  }

  /**
   * Waits for the page to finish loading (load state) and then waits for the
   * unique selector (defined in the constructor) to become visible.
   * Also waits for network activity to settle to ensure the page is fully loaded.
   * @throws Will throw an error if the load state or the visibility check times out.
   */
  async waitForPageShown(): Promise<void> {
    try {
      // Wait for the "load" state first
      await this.page.waitForLoadState('load', { timeout: 30000 });

      // Select the primary element that indicates the page is ready.
      const element = this.page.locator(this.selector).first();

      // Wait for it to become visible. Adjust the timeout as needed.
      await element.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err: unknown) {
      // Forward the original error details to help with debugging.
      throw new Error(
        `Error while waiting for page to load or element to become visible: ${(err as Error).message}`
      );
    }

    // Wait for network activity to settle to ensure the page is fully loaded and ready for interaction
    // This is outside the try-catch so it doesn't fail the method if network activity continues
    try {
      // eslint-disable-next-line playwright/no-networkidle
      await this.page.waitForLoadState('networkidle', { timeout: 20000 });
    } catch {
      // Silently continue if networkidle times out - the page is still considered ready
    }
  }

  /**
   * Returns the current page title.
   * Waits for the DOM to finish loading before getting the title.
   */
  async getPageTitle(): Promise<string> {
    await this.page.waitForLoadState('domcontentloaded');
    return this.page.title();
  }

  /**
   * Smart navigation with performance tracking and error logging
   */
  async smartNavigate(url: string, options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    const startTime = Date.now();
    const currentUrl = this.page.url();
    
    try {
      SmartLogger.log('INFO', `Navigating to ${url}`);
      await this.page.goto(url, options);
      
      const loadTime = Date.now() - startTime;
      SmartLogger.logNavigation(currentUrl, url, loadTime);
      SmartLogger.logPerformance('page_load', loadTime, 5000);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Smart assertion with detailed logging
   */
  async smartExpect(selector: string, condition: 'toBeVisible' | 'toHaveText' | 'toHaveValue', expectedValue?: string): Promise<void> {
    try {
      const element = this.page.locator(selector);
      let actualValue: string | undefined;

      switch (condition) {
        case 'toBeVisible':
          await element.waitFor({ state: 'visible', timeout: 10000 });
          SmartLogger.logAssertion(`Element ${selector} should be visible`, true, true, true);
          break;
        case 'toHaveText':
          actualValue = await element.textContent() || '';
          const textMatches = actualValue.includes(expectedValue || '');
          SmartLogger.logAssertion(`Element ${selector} should contain text "${expectedValue}"`, expectedValue, actualValue, textMatches);
          if (!textMatches) throw new Error(`Text assertion failed for ${selector}`);
          break;
        case 'toHaveValue':
          actualValue = await element.inputValue();
          const valueMatches = actualValue === expectedValue;
          SmartLogger.logAssertion(`Element ${selector} should have value "${expectedValue}"`, expectedValue, actualValue, valueMatches);
          if (!valueMatches) throw new Error(`Value assertion failed for ${selector}`);
          break;
      }
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Get diagnostic information when tests fail
   */
  async getDiagnosticInfo(): Promise<string[]> {
    try {
      const report = await this.errorInspector.inspectPageOnError('Diagnostic check requested');
      return ErrorInspector.generateFailureSuggestions(report);
    } catch (error) {
      return [`Unable to generate diagnostics: ${(error as Error).message}`];
    }
  }
}
