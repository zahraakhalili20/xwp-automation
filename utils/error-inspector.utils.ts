import { Page, expect } from '@playwright/test';
import { TestUtils } from './test.utils';

/**
 * Smart error inspection utility
 * Automatically inspects page state on test failures to provide detailed context
 */
export class ErrorInspector {
  constructor(private page: Page) {}

  /**
   * Comprehensive page inspection on error
   * Captures multiple data points to diagnose failure reasons
   */
  async inspectPageOnError(errorContext: string): Promise<PageInspectionReport> {
    const timestamp = TestUtils.getCurrentTimestamp();
    const report: PageInspectionReport = {
      timestamp,
      errorContext,
      url: this.page.url(),
      title: await this.page.title().catch(() => 'Unable to get title'),
      viewport: this.page.viewportSize(),
      userAgent: await this.page.evaluate(() => navigator.userAgent).catch(() => 'Unknown'),
      console: [],
      network: [],
      elements: {},
      screenshot: '',
      html: '',
      localStorage: {},
      cookies: []
    };

    try {
      // Capture console logs
      report.console = await this.getRecentConsoleLogs();

      // Capture network failures
      report.network = await this.getNetworkErrors();

      // Inspect common error elements
      report.elements = await this.inspectErrorElements();

      // Take screenshot
      report.screenshot = await this.captureErrorScreenshot(timestamp);

      // Get page HTML for analysis
      report.html = await this.page.content().catch(() => 'Unable to capture HTML');

      // Capture localStorage
      report.localStorage = await this.getLocalStorage();

      // Capture cookies
      report.cookies = await this.page.context().cookies();

      // Check for JavaScript errors
      report.jsErrors = await this.getJavaScriptErrors();

      // Check page load state
      report.loadState = await this.getPageLoadState();

      // Analyze potential blocking elements
      report.blockingElements = await this.findBlockingElements();

    } catch (inspectionError) {
      console.warn('Error during page inspection:', inspectionError);
      report.inspectionError = (inspectionError as Error).message;
    }

    return report;
  }

  /**
   * Get recent console logs
   */
  private async getRecentConsoleLogs(): Promise<Array<{type: string, text: string, timestamp: string}>> {
    // This would need to be captured during test execution
    // For now, return empty array - console logs need to be captured via page.on('console')
    return [];
  }

  /**
   * Get network errors and failed requests
   */
  private async getNetworkErrors(): Promise<Array<{url: string, status: number, method: string}>> {
    // This would need to be captured during test execution
    // For now, return empty array - network requests need to be captured via page.on('response')
    return [];
  }

  /**
   * Inspect common error elements on the page
   */
  private async inspectErrorElements(): Promise<{[key: string]: any}> {
    const elements: {[key: string]: any} = {};

    // Common error selectors to check
    const errorSelectors = [
      '.error',
      '.error-message',
      '.alert-danger',
      '.notice-error',
      '#error',
      '[role="alert"]',
      '.wp-die-message',
      '.login-error',
      '.message.error'
    ];

    for (const selector of errorSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          elements[selector] = {
            count,
            visible: await element.first().isVisible(),
            text: await element.first().textContent()
          };
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    // Check for loading spinners that might indicate hanging requests
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '.wp-spinner',
      '[aria-label*="loading"]',
      '.is-loading'
    ];

    for (const selector of loadingSelectors) {
      try {
        const element = this.page.locator(selector);
        const count = await element.count();
        if (count > 0 && await element.first().isVisible()) {
          elements[`loading_${selector}`] = {
            count,
            visible: true,
            text: await element.first().textContent()
          };
        }
      } catch (error) {
        // Continue checking
      }
    }

    // Check if expected elements are missing
    const commonSelectors = [
      'body',
      'main',
      '#wpadminbar',
      '.wp-admin',
      'form'
    ];

    for (const selector of commonSelectors) {
      try {
        const exists = await this.page.locator(selector).count() > 0;
        elements[`exists_${selector}`] = exists;
      } catch (error) {
        elements[`exists_${selector}`] = false;
      }
    }

    return elements;
  }

  /**
   * Capture screenshot with error context
   */
  private async captureErrorScreenshot(timestamp: string): Promise<string> {
    try {
      const filename = `error-${timestamp}.png`;
      const path = `screenshots/${filename}`;
      
      await this.page.screenshot({ 
        path,
        fullPage: true,
        animations: 'disabled'
      });
      
      return filename;
    } catch (error) {
      return `Screenshot failed: ${(error as Error).message}`;
    }
  }

  /**
   * Get localStorage data
   */
  private async getLocalStorage(): Promise<{[key: string]: string}> {
    try {
      return await this.page.evaluate(() => {
        const storage: {[key: string]: string} = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage[key] = localStorage.getItem(key) || '';
          }
        }
        return storage;
      });
    } catch {
      return {};
    }
  }

  /**
   * Get JavaScript errors from the page
   */
  private async getJavaScriptErrors(): Promise<string[]> {
    try {
      return await this.page.evaluate(() => {
        // @ts-ignore - accessing window errors if they exist
        return window.jsErrors || [];
      });
    } catch {
      return [];
    }
  }

  /**
   * Get page load state information
   */
  private async getPageLoadState(): Promise<{[key: string]: any}> {
    try {
      return await this.page.evaluate(() => ({
        readyState: document.readyState,
        loadEventFired: performance.timing.loadEventEnd > 0,
        domContentLoaded: performance.timing.domContentLoadedEventEnd > 0,
        networkIdle: performance.now() - performance.timing.loadEventEnd > 500
      }));
    } catch {
      return { error: 'Unable to get load state' };
    }
  }

  /**
   * Find elements that might be blocking user interaction
   */
  private async findBlockingElements(): Promise<Array<{selector: string, reason: string}>> {
    const blockingElements: Array<{selector: string, reason: string}> = [];

    // Check for modals or overlays
    const overlaySelectors = [
      '.modal',
      '.overlay',
      '.popup',
      '.dialog',
      '[role="dialog"]',
      '.fancybox-overlay',
      '.ui-widget-overlay'
    ];

    for (const selector of overlaySelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0 && await element.first().isVisible()) {
          blockingElements.push({
            selector,
            reason: 'Modal or overlay blocking interaction'
          });
        }
      } catch {
        // Continue checking
      }
    }

    // Check for elements with high z-index that might be covering content
    try {
      const highZIndexElements = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
          .filter(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            return zIndex > 1000 && style.position !== 'static';
          })
          .map(el => ({
            selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ').join('.')}` : ''),
            zIndex: window.getComputedStyle(el).zIndex
          }));
      });

      highZIndexElements.forEach(el => {
        blockingElements.push({
          selector: el.selector,
          reason: `High z-index (${el.zIndex}) element potentially blocking interaction`
        });
      });
    } catch {
      // Unable to check z-index
    }

    return blockingElements;
  }

  /**
   * Generate smart suggestions based on inspection results
   */
  static generateFailureSuggestions(report: PageInspectionReport): string[] {
    const suggestions: string[] = [];

    // URL-based suggestions
    if (report.url.includes('wp-login.php')) {
      suggestions.push('🔐 Login page detected - check credentials and form submission');
    }
    if (report.url.includes('404') || report.title.toLowerCase().includes('not found')) {
      suggestions.push('🔍 404 error detected - verify URL and routing');
    }

    // Element-based suggestions
    Object.entries(report.elements).forEach(([selector, data]) => {
      if (selector.includes('error') && data.visible) {
        suggestions.push(`❌ Error message found: "${data.text}" - check form validation or server response`);
      }
      if (selector.includes('loading') && data.visible) {
        suggestions.push('⏳ Loading indicator still visible - request may be stuck or taking too long');
      }
    });

    // Network-based suggestions
    if (report.network.some(req => req.status >= 400)) {
      suggestions.push('🌐 Network errors detected - check API endpoints and server connectivity');
    }

    // JavaScript error suggestions
    if (report.jsErrors && report.jsErrors.length > 0) {
      suggestions.push('⚠️ JavaScript errors detected - check browser console for details');
    }

    // Blocking elements suggestions
    if (report.blockingElements && report.blockingElements.length > 0) {
      suggestions.push('🚫 Potentially blocking elements detected - check for modals or overlays');
    }

    // Load state suggestions
    if (report.loadState && report.loadState.readyState !== 'complete') {
      suggestions.push('⏱️ Page not fully loaded - consider waiting for load state or specific elements');
    }

    // Generic fallback suggestions
    if (suggestions.length === 0) {
      suggestions.push('🔍 Check element selectors - they may have changed');
      suggestions.push('⏰ Consider adding explicit waits for dynamic content');
      suggestions.push('🔄 Verify page navigation completed successfully');
    }

    return suggestions;
  }
}

/**
 * Interface for page inspection report
 */
export interface PageInspectionReport {
  timestamp: string;
  errorContext: string;
  url: string;
  title: string;
  viewport: { width: number; height: number } | null;
  userAgent: string;
  console: Array<{type: string, text: string, timestamp: string}>;
  network: Array<{url: string, status: number, method: string}>;
  elements: {[key: string]: any};
  screenshot: string;
  html: string;
  localStorage: {[key: string]: string};
  cookies: any[];
  jsErrors?: string[];
  loadState?: {[key: string]: any};
  blockingElements?: Array<{selector: string, reason: string}>;
  inspectionError?: string;
}