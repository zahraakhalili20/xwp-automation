import { Page, Locator, expect } from '@playwright/test';
import { SmartLogger } from './smart-logger.utils';
import { ErrorInspector } from './error-inspector.utils';
import { EnvironmentManager } from './environment.utils';

/**
 * ElementHelper - AI-Optimized utility class for Playwright element interactions
 * 
 * This class provides a consistent interface for AI-driven automation with:
 * - SmartLogger integration for AI decision-making context
 * - Automatic retry logic with exponential backoff
 * - Environment-aware configuration from EnvironmentManager
 * - Smart wait conditions for multiple element states
 * - Element health checks with actionable insights
 * - Performance monitoring for AI optimization
 * - Value verification for input operations
 * - Configurable timeouts with sensible defaults
 * - Support for both string selectors and Locator objects
 * - AI-friendly error messages and suggestions
 * - Input validation and type safety
 * - Structured logging for AI agent learning
 * 
 * @author XWP Platform Team
 * @version 3.1.0 - AI-Optimized for autonomous test generation and execution
 * @aiCompatible Full compatibility with AI agents for dynamic test creation
 */
class ElementHelper {
  // ===== CONSTANTS =====
  
  /** Environment manager instance */
  private static readonly envManager = EnvironmentManager.getInstance();
  
  /** Default timeout for most operations */
  private static readonly DEFAULT_TIMEOUT = ElementHelper.envManager.getConfig().timeout || 10000;
  /** Short timeout for quick checks */
  private static readonly SHORT_TIMEOUT = Math.floor(ElementHelper.DEFAULT_TIMEOUT / 2);
  /** Long timeout for complex operations */
  private static readonly LONG_TIMEOUT = ElementHelper.DEFAULT_TIMEOUT * 3;
  /** Delay for animations and transitions */
  private static readonly ANIMATION_DELAY = 100;
  /** Polling interval for custom waits */
  private static readonly POLLING_INTERVAL = 100;
  /** Maximum retry attempts for operations */
  private static readonly MAX_RETRIES = ElementHelper.envManager.getConfig().retries || 3;
  /** Base delay for exponential backoff */
  private static readonly BASE_RETRY_DELAY = 500;
  /** Enable detailed health checks (disable for speed) */
  private static readonly ENABLE_HEALTH_CHECKS = process.env.DETAILED_HEALTH_CHECKS === 'true';
  /** Enable performance monitoring (disable for speed) */
  private static readonly ENABLE_PERFORMANCE_MONITORING = process.env.PERFORMANCE_MONITORING !== 'false';
  /** Enable value verification (disable for speed) */
  private static readonly ENABLE_VALUE_VERIFICATION = process.env.VALUE_VERIFICATION === 'true';

  /** Standard error messages */
  private static readonly ERROR_MESSAGES = {
    ELEMENT_NOT_FOUND: 'Element not found',
    ELEMENT_NOT_VISIBLE: 'Element not visible',
    ELEMENT_NOT_ENABLED: 'Element not enabled',
    TIMEOUT_EXCEEDED: 'Timeout exceeded',
    INVALID_PARAMETER: 'Invalid parameter provided',
    NETWORK_ERROR: 'Network request failed',
  } as const;

  // ===== UTILITY METHODS =====

  /**
   * Create a locator from string or return existing locator
   * @private
   */
  private createLocator(page: Page, element: string | Locator, index: number = 0): Locator {
    return typeof element === 'string' 
      ? page.locator(element).nth(index)
      : element.nth(index);
  }

  /**
   * Validate input parameters
   * @private
   */
  private validateParams(params: { [key: string]: any }): void {
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        throw new Error(`${ElementHelper.ERROR_MESSAGES.INVALID_PARAMETER}: ${key} cannot be null or undefined`);
      }
      if (key.includes('timeout') && typeof value === 'number' && value < 0) {
        throw new Error(`${ElementHelper.ERROR_MESSAGES.INVALID_PARAMETER}: ${key} must be positive`);
      }
      if (key.includes('index') && typeof value === 'number' && value < 0) {
        throw new Error(`${ElementHelper.ERROR_MESSAGES.INVALID_PARAMETER}: ${key} must be non-negative`);
      }
    });
  }

  /**
   * Enhanced error message with context
   * @private
   */
  private createErrorMessage(operation: string, element: string | Locator, error?: string): string {
    const elementDesc = typeof element === 'string' ? `selector "${element}"` : 'Locator object';
    return `${operation} failed for ${elementDesc}${error ? `: ${error}` : ''}`;
  }

  /**
   * Fast-first retry operation with optional performance monitoring
   * @private
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = ElementHelper.MAX_RETRIES,
    baseDelay: number = ElementHelper.BASE_RETRY_DELAY
  ): Promise<T> {
    const startTime = ElementHelper.ENABLE_PERFORMANCE_MONITORING ? performance.now() : 0;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStartTime = ElementHelper.ENABLE_PERFORMANCE_MONITORING ? performance.now() : 0;
      
      try {
        const result = await operation();
        
        // Only log performance if monitoring is enabled and operation took > 1 attempt or > 1 second
        if (ElementHelper.ENABLE_PERFORMANCE_MONITORING) {
          const totalTime = performance.now() - startTime;
          const attemptTime = performance.now() - attemptStartTime;
          
          // Only log detailed metrics if operation was slow or required retries
          if (attempt > 1 || totalTime > 1000) {
            const metrics = {
              operation: operationName,
              totalTime: `${totalTime.toFixed(2)}ms`,
              attempts: attempt,
              attemptTime: `${attemptTime.toFixed(2)}ms`,
              success: true
            };
            SmartLogger.log('INFO', `${operationName} completed (${attempt > 1 ? 'with retries' : 'slow operation'})`, metrics);
          }
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Fast fail on certain unrecoverable errors
        if (this.isUnrecoverableError(lastError)) {
          SmartLogger.log('ERROR', `${operationName} failed (unrecoverable): ${lastError.message}`);
          throw lastError;
        }
        
        if (attempt === maxRetries) {
          if (ElementHelper.ENABLE_PERFORMANCE_MONITORING) {
            const totalTime = performance.now() - startTime;
            SmartLogger.log('ERROR', `${operationName} failed after ${maxRetries} attempts in ${totalTime.toFixed(2)}ms: ${lastError.message}`);
          } else {
            SmartLogger.log('ERROR', `${operationName} failed after ${maxRetries} attempts: ${lastError.message}`);
          }
          throw lastError;
        }
        
        // Quick retry for first failure, longer delays for subsequent ones
        const delay = attempt === 1 ? 100 : baseDelay * Math.pow(2, attempt - 2);
        SmartLogger.log('WARN', `${operationName} attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if error is unrecoverable (no point in retrying)
   * @private
   */
  private isUnrecoverableError(error: Error): boolean {
    const unrecoverablePatterns = [
      'Element not found',
      'page has been closed',
      'context has been closed',
      'browser has been closed',
      'Navigation failed',
      'net::ERR_NAME_NOT_RESOLVED',
      'net::ERR_CONNECTION_REFUSED'
    ];
    
    return unrecoverablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Fast smart wait for element with minimal conditions by default
   * @private
   */
  private async smartWaitForElement(
    elementLocator: Locator,
    conditions: {
      visible?: boolean;
      stable?: boolean;
      enabled?: boolean;
      hasText?: boolean;
    } = {},
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    const { visible = true, stable = false, enabled = false, hasText = false } = conditions;
    
    // Always wait for visibility (this is fast and essential)
    if (visible) {
      await elementLocator.waitFor({ state: 'visible', timeout });
    }
    
    // Only add stability delay if explicitly requested or health checks enabled
    if (stable && (ElementHelper.ENABLE_HEALTH_CHECKS || conditions.stable === true)) {
      await new Promise(resolve => setTimeout(resolve, ElementHelper.ANIMATION_DELAY));
    }
    
    // Only check enabled state if explicitly requested
    if (enabled) {
      await expect(elementLocator).toBeEnabled({ timeout: ElementHelper.SHORT_TIMEOUT });
    }
    
    // Only check text if explicitly requested
    if (hasText) {
      await expect(elementLocator).not.toBeEmpty({ timeout: ElementHelper.SHORT_TIMEOUT });
    }
  }

  /**
   * Fast element health check (only when enabled)
   * @private
   */
  private async checkElementHealth(
    elementLocator: Locator,
    operationType: 'click' | 'fill' | 'read'
  ): Promise<{ healthy: boolean; issues: string[] }> {
    // Skip health checks if disabled for performance
    if (!ElementHelper.ENABLE_HEALTH_CHECKS) {
      return { healthy: true, issues: [] };
    }
    
    const issues: string[] = [];
    
    try {
      // Quick existence check
      const count = await elementLocator.count();
      if (count === 0) {
        issues.push('Element not found in DOM');
        return { healthy: false, issues };
      }
      
      if (count > 1) {
        issues.push(`Multiple elements found (${count}), using first one`);
      }
      
      // Fast visibility check
      const isVisible = await elementLocator.isVisible();
      if (!isVisible) {
        issues.push('Element is not visible');
      }
      
      // Only check enabled state for interactive elements
      if ((operationType === 'click' || operationType === 'fill') && isVisible) {
        const isEnabled = await elementLocator.isEnabled();
        if (!isEnabled) {
          issues.push('Element is disabled');
        }
      }
      
      // Skip expensive coverage check unless specifically needed
      // (Coverage check is slow and rarely needed)
      
      return { healthy: issues.filter(issue => !issue.includes('Multiple elements')).length === 0, issues };
      
    } catch (error) {
      // Don't fail the operation due to health check errors
      return { healthy: true, issues: [`Health check skipped: ${(error as Error).message}`] };
    }
  }

  // ===== VISIBILITY & STATE CHECKS =====

  /**
   * Check if element is displayed (visible) with timeout
   * @param element - The Locator element to check
   * @param timeout - Timeout in milliseconds
   * @returns Promise<boolean> - True if element is visible, false otherwise
   * @throws Never throws - returns false on any error
   */
  async isElementDisplayed(element: Locator, timeout: number = ElementHelper.DEFAULT_TIMEOUT): Promise<boolean> {
    this.validateParams({ element, timeout });
    
    try {
      await element.waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      console.debug(`isElementDisplayed: ${this.createErrorMessage('Visibility check', element, (error as Error).message)}`);
      return false;
    }
  }

  /**
   * Check if element exists in DOM (not necessarily visible)
   * @param page - Playwright Page object  
   * @param element - Element selector or Locator
   * @returns Promise<boolean> - True if element exists, false otherwise
   * @throws Never throws - returns false on any error
   */
  async doesElementExist(page: Page, element: Locator | string): Promise<boolean> {
    this.validateParams({ page, element });
    
    try {
      const locator = typeof element === 'string' ? page.locator(element) : element;
      const count = await locator.count();
      return count > 0;
    } catch (error) {
      console.debug(`doesElementExist: ${this.createErrorMessage('Existence check', element, (error as Error).message)}`);
      return false;
    }
  }

  /**
   * Check if element is hidden with timeout
   * @param element - The Locator element to check
   * @param timeout - Timeout in milliseconds
   * @returns Promise<boolean> - True if element is hidden, false otherwise
   * @throws Never throws - returns false on any error
   */
  async isElementHidden(element: Locator, timeout: number = ElementHelper.LONG_TIMEOUT): Promise<boolean> {
    this.validateParams({ element, timeout });
    
    try {
      await element.waitFor({ state: 'hidden', timeout });
      return true;
    } catch (error) {
      console.debug(`isElementHidden: ${this.createErrorMessage('Hidden check', element, (error as Error).message)}`);
      return false;
    }
  }

  /**
   * Check if element is visible without waiting (immediate check)
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @returns Promise<boolean> - True if element is visible, false otherwise
   * @throws Never throws - returns false on any error
   */
  async isElementVisible(
    page: Page,
    element: string | Locator,
    index: number = 0
  ): Promise<boolean> {
    this.validateParams({ page, element, index });
    
    try {
      const locator = this.createLocator(page, element, index);
      return await locator.isVisible();
    } catch (error) {
      console.debug(`isElementVisible: ${this.createErrorMessage('Visibility check', element, (error as Error).message)}`);
      return false;
    }
  }

  /**
   * Check if element is enabled
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @returns Promise<boolean> - True if element is enabled, false otherwise
   * @throws Never throws - returns false on any error
   */
  async isElementEnabled(
    page: Page,
    element: string | Locator,
    index: number = 0
  ): Promise<boolean> {
    this.validateParams({ page, element, index });
    
    try {
      const locator = this.createLocator(page, element, index);
      return await locator.isEnabled();
    } catch (error) {
      console.debug(`isElementEnabled: ${this.createErrorMessage('Enabled check', element, (error as Error).message)}`);
      return false;
    }
  }

  /**
   * Check if checkbox/radio element is checked
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @returns Promise<boolean> - True if element is checked, false otherwise
   * @throws Never throws - returns false on any error
   */
  async isElementChecked(
    page: Page,
    element: string | Locator,
    index: number = 0
  ): Promise<boolean> {
    this.validateParams({ page, element, index });
    
    try {
      const locator = this.createLocator(page, element, index);
      return await locator.isChecked();
    } catch (error) {
      console.debug(`isElementChecked: ${this.createErrorMessage('Checked state check', element, (error as Error).message)}`);
      return false;
    }
  }

  // ===== INTERACTION METHODS =====

  /**
   * Click on an element with enhanced error handling and stability checks
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if element cannot be clicked within timeout
   */
  async clickElement(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.LONG_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    const elementSelector = typeof element === 'string' ? element : element.toString();
    SmartLogger.logUserAction('click', elementSelector);
    
    try {
      await this.retryOperation(async () => {
        const elementLocator = this.createLocator(page, element, index);

        // Fast wait - Playwright's click already includes actionability checks
        await this.smartWaitForElement(elementLocator, { visible: true }, timeout);

        // Playwright's click has built-in checks for: visible, enabled, stable, not covered
        await elementLocator.click({ timeout: ElementHelper.SHORT_TIMEOUT });
        
        SmartLogger.log('INFO', `Successfully clicked ${elementSelector}`);
      }, `Click ${elementSelector}`);
      
    } catch (error) {
      await SmartLogger.logError(error as Error, page);
      throw new Error(this.createErrorMessage('Click', element, (error as Error).message));
    }
  }

  /**
   * Force click on an element (bypasses actionability checks)
   * Use with caution - only when normal click fails due to overlapping elements
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds for waiting
   * @throws Error if element is not displayed or force click fails
   */
  async forceClickElement(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);

      const displayed = await this.waitForDisplayed(page, elementLocator, timeout);
      if (!displayed) {
        throw new Error(`${ElementHelper.ERROR_MESSAGES.ELEMENT_NOT_VISIBLE} at index ${index}`);
      }

      await elementLocator.click({ force: true, timeout });
      
    } catch (error) {
      throw new Error(this.createErrorMessage('Force click', element, (error as Error).message));
    }
  }

  /**
   * Double click on an element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if element cannot be double clicked
   */
  async doubleClickElement(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.dblclick({ timeout });
    } catch (error) {
      throw new Error(this.createErrorMessage('Double click', element, (error as Error).message));
    }
  }

  /**
   * Right click on an element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if element cannot be right clicked
   */
  async rightClickElement(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.click({ button: 'right', timeout });
    } catch (error) {
      throw new Error(this.createErrorMessage('Right click', element, (error as Error).message));
    }
  }

  /**
   * Hover over an element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if element cannot be hovered
   */
  async hoverElement(
    page: Page, 
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.hover({ timeout });
    } catch (error) {
      throw new Error(this.createErrorMessage('Hover', element, (error as Error).message));
    }
  }

  // ===== INPUT METHODS =====

  /**
   * Enter value into an input field
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param value - Value to enter
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if value cannot be entered
   */
  async enterValue(
    page: Page,
    element: string | Locator,
    value: string,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, value, index, timeout });
    
    const elementSelector = typeof element === 'string' ? element : element.toString();
    SmartLogger.logUserAction('fill', elementSelector, value);
    
    try {
      await this.retryOperation(async () => {
        const elementLocator = this.createLocator(page, element, index);
        
        // Simple wait - fill() already includes basic checks
        await this.smartWaitForElement(elementLocator, { visible: true }, timeout);
        
        // Playwright's fill() automatically clears and fills
        await elementLocator.fill(value);
        
        // Only verify value if explicitly enabled (slower but more reliable)
        if (ElementHelper.ENABLE_VALUE_VERIFICATION) {
          const actualValue = await elementLocator.inputValue();
          if (actualValue !== value) {
            throw new Error(`Value verification failed. Expected: "${value}", Actual: "${actualValue}"`);
          }
          SmartLogger.log('INFO', `Successfully filled ${elementSelector} with verified value`);
        } else {
          SmartLogger.log('INFO', `Successfully filled ${elementSelector}`);
        }
      }, `Enter value in ${elementSelector}`);
      
    } catch (error) {
      await SmartLogger.logError(error as Error, page);
      throw new Error(this.createErrorMessage('Enter value', element, (error as Error).message));
    }
  }

  /**
   * Clear input field and then enter value
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param value - Value to enter
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if value cannot be entered
   */
  async clearAndEnterValue(
    page: Page,
    element: string | Locator,
    value: string,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, value, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'visible', timeout });
      await elementLocator.clear();
      await elementLocator.fill(value);
    } catch (error) {
      throw new Error(this.createErrorMessage('Clear and enter value', element, (error as Error).message));
    }
  }

  /**
   * Type text with delay (simulates human typing)
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param text - Text to type
   * @param delay - Delay between keystrokes in milliseconds
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if text cannot be typed
   */
  async typeText(
    page: Page,
    element: string | Locator,
    text: string,
    delay: number = ElementHelper.ANIMATION_DELAY,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, text, delay, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'visible', timeout });
      await elementLocator.type(text, { delay });
    } catch (error) {
      throw new Error(this.createErrorMessage('Type text', element, (error as Error).message));
    }
  }

  /**
   * Press a key on an element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param key - Key to press (e.g., 'Enter', 'Tab', 'Escape')
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if key cannot be pressed
   */
  async pressKey(
    page: Page,
    element: string | Locator,
    key: string,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, key, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.press(key);
    } catch (error) {
      throw new Error(this.createErrorMessage('Press key', element, (error as Error).message));
    }
  }

  // ===== FOCUS METHODS =====

  /**
   * Focus on an element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if element cannot be focused
   */
  async focusElement(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.focus();
    } catch (error) {
      throw new Error(this.createErrorMessage('Focus', element, (error as Error).message));
    }
  }

  /**
   * Remove focus from an element (blur)
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @throws Error if element cannot be blurred
   */
  async blurElement(
    page: Page,
    element: string | Locator,
    index: number = 0
  ): Promise<void> {
    this.validateParams({ page, element, index });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.blur();
    } catch (error) {
      throw new Error(this.createErrorMessage('Blur', element, (error as Error).message));
    }
  }

  // ===== FORM METHODS =====

  /**
   * Select option by value with fallback to label
   * @param page - Playwright Page object
   * @param element - Select element selector or Locator
   * @param value - Option value or label to select
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if option cannot be selected
   */
  async selectOptionValue(
    page: Page,
    element: string | Locator,
    value: string,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, value, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'visible', timeout });
      
      // Try to select by value first, then by label as fallback
      try {
        await elementLocator.selectOption({ value });
      } catch {
        await elementLocator.selectOption({ label: value });
      }
    } catch (error) {
      throw new Error(this.createErrorMessage('Select option', element, (error as Error).message));
    }
  }

  /**
   * Select multiple options in a multi-select dropdown
   * @param page - Playwright Page object
   * @param element - Select element selector or Locator
   * @param values - Array of option values to select
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if options cannot be selected
   */
  async selectMultipleOptions(
    page: Page,
    element: string | Locator,
    values: string[],
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, values, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'visible', timeout });
      await elementLocator.selectOption(values);
    } catch (error) {
      throw new Error(this.createErrorMessage('Select multiple options', element, (error as Error).message));
    }
  }

  /**
   * Toggle checkbox state intelligently
   * @param page - Playwright Page object
   * @param element - Checkbox element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if checkbox cannot be toggled
   */
  async toggleCheckbox(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      
      const isVisible = await this.waitForDisplayed(page, elementLocator, timeout);
      if (!isVisible) {
        throw new Error(`${ElementHelper.ERROR_MESSAGES.ELEMENT_NOT_VISIBLE} at index ${index}`);
      }

      const isChecked = await this.isElementChecked(page, elementLocator);
      
      if (isChecked) {
        await elementLocator.uncheck();
      } else {
        await elementLocator.check();
      }
    } catch (error) {
      throw new Error(this.createErrorMessage('Toggle checkbox', element, (error as Error).message));
    }
  }

  /**
   * Upload file to input element
   * @param page - Playwright Page object
   * @param element - File input element selector or Locator
   * @param filePath - Path to file to upload
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if file cannot be uploaded
   */
  async uploadFile(
    page: Page,
    element: string | Locator,
    filePath: string,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, filePath, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'attached', timeout });
      await elementLocator.setInputFiles(filePath);
    } catch (error) {
      throw new Error(this.createErrorMessage('Upload file', element, (error as Error).message));
    }
  }

  // ===== TEXT & CONTENT METHODS =====

  /**
   * Get element text content with enhanced error handling
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string> - Element text content
   * @throws Error if text cannot be retrieved
   */
  async getElementText(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<string> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      
      const text = await locator.textContent({ timeout });
      return (text || '').trim();
    } catch (error) {
      throw new Error(this.createErrorMessage('Get text', element, (error as Error).message));
    }
  }

  /**
   * Get inner text of element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string> - Element inner text
   * @throws Error if inner text cannot be retrieved
   */
  async getInnerText(
    page: Page, 
    element: string | Locator, 
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<string> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      return await locator.innerText();
    } catch (error) {
      throw new Error(this.createErrorMessage('Get inner text', element, (error as Error).message));
    }
  }

  /**
   * Get all text contents from matching elements
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string[]> - Array of text contents
   * @throws Error if texts cannot be retrieved
   */
  async getAllElementTexts(
    page: Page, 
    element: string | Locator,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<string[]> {
    this.validateParams({ page, element, timeout });
    
    try {
      const locator = typeof element === 'string' ? page.locator(element) : element;
      await locator.first().waitFor({ state: 'visible', timeout });
      return await locator.allInnerTexts();
    } catch (error) {
      throw new Error(this.createErrorMessage('Get all texts', element, (error as Error).message));
    }
  }

  /**
   * Get input field value
   * @param page - Playwright Page object
   * @param element - Input element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string> - Input value
   * @throws Error if value cannot be retrieved
   */
  async getInputValue(
    page: Page, 
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<string> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      return await locator.inputValue() || '';
    } catch (error) {
      throw new Error(this.createErrorMessage('Get input value', element, (error as Error).message));
    }
  }

  // ===== ATTRIBUTE METHODS =====

  /**
   * Get element attribute value
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param attribute - Attribute name to retrieve
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string> - Attribute value or empty string
   * @throws Error if attribute cannot be retrieved
   */
  async getElementAttribute(
    page: Page,
    element: string | Locator,
    attribute: string,
    index: number = 0,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<string> {
    this.validateParams({ page, element, attribute, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'attached', timeout });
      return (await elementLocator.getAttribute(attribute)) ?? '';
    } catch (error) {
      throw new Error(this.createErrorMessage(`Get attribute "${attribute}"`, element, (error as Error).message));
    }
  }

  /**
   * Get CSS property value of an element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param property - CSS property name
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string> - CSS property value
   * @throws Error if CSS property cannot be retrieved
   */
  async getCSSProperty(
    page: Page,
    element: string | Locator,
    property: string,
    index: number = 0,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<string> {
    this.validateParams({ page, element, property, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      
      return await locator.evaluate(
        (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
        property
      );
    } catch (error) {
      throw new Error(this.createErrorMessage(`Get CSS property "${property}"`, element, (error as Error).message));
    }
  }

  /**
   * Check if element has specific CSS class
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param className - CSS class name to check
   * @param index - Index of element if multiple matches
   * @returns Promise<boolean> - True if element has class, false otherwise
   * @throws Never throws - returns false on any error
   */
  async hasClass(
    page: Page,
    element: string | Locator,
    className: string,
    index: number = 0
  ): Promise<boolean> {
    this.validateParams({ page, element, className, index });
    
    try {
      const locator = this.createLocator(page, element, index);
      const classList = await locator.getAttribute('class');
      return classList ? classList.split(' ').includes(className) : false;
    } catch (error) {
      console.debug(`hasClass: ${this.createErrorMessage('Class check', element, (error as Error).message)}`);
      return false;
    }
  }

  // ===== WAITING METHODS =====

  /**
   * Wait for element to be displayed with configurable timeout
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param timeout - Timeout in milliseconds
   * @returns Promise<boolean> - True if element becomes visible, false otherwise
   * @throws Never throws - returns false on timeout or error
   */
  async waitForDisplayed(
    page: Page,
    element: string | Locator,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<boolean> {
    this.validateParams({ page, element, timeout });
    
    try {
      const elementLocator = typeof element === 'string' ? page.locator(element) : element;
      await elementLocator.waitFor({ state: 'visible', timeout });
      return true;
    } catch (error) {
      console.debug(`waitForDisplayed: ${this.createErrorMessage('Wait for visible', element, (error as Error).message)}`);
      return false;
    }
  }

  /**
   * Wait for element to be removed from DOM
   * @param page - Playwright Page object
   * @param element - Element selector
   * @param timeout - Timeout in milliseconds
   * @returns Promise<boolean> - True if element is removed, false if still present after timeout
   * @throws Never throws - returns false on timeout or error
   */
  async waitForElementRemoved(
    page: Page,
    element: string,
    timeout: number = ElementHelper.LONG_TIMEOUT
  ): Promise<boolean> {
    this.validateParams({ page, element, timeout });
    
    try {
      await page.waitForSelector(element, { state: 'hidden', timeout });
      return true;
    } catch (error) {
      console.debug(`waitForElementRemoved: Element still present after ${timeout}ms: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Wait for element to contain specific text
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param expectedText - Text to wait for
   * @param timeout - Timeout in milliseconds
   * @throws Error if text doesn't appear within timeout
   */
  async waitForText(
    page: Page,
    element: string | Locator,
    expectedText: string,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, expectedText, timeout });
    
    try {
      const locator = typeof element === 'string' ? page.locator(element) : element;
      await locator.waitFor({ state: 'visible', timeout });
      await expect(locator).toContainText(expectedText, { timeout });
    } catch (error) {
      throw new Error(this.createErrorMessage(`Wait for text "${expectedText}"`, element, (error as Error).message));
    }
  }

  /**
   * Wait for element to be enabled
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param timeout - Timeout in milliseconds
   * @throws Error if element doesn't become enabled within timeout
   */
  async waitForElementEnabled(
    page: Page,
    element: string | Locator,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, timeout });
    
    try {
      const locator = typeof element === 'string' ? page.locator(element) : element;
      await locator.waitFor({ state: 'visible', timeout });
      
      // Use Playwright's native waitFor with a custom function for better reliability
      await page.waitForFunction(
        (el) => {
          const element = el as HTMLElement;
          return element && !element.hasAttribute('disabled') && 
                 !(element as any).disabled;
        },
        await locator.elementHandle(),
        { timeout }
      );
    } catch (error) {
      throw new Error(this.createErrorMessage('Wait for enabled', element, (error as Error).message));
    }
  }

  /**
   * Wait for element to have specific CSS class
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param className - CSS class name to wait for
   * @param timeout - Timeout in milliseconds
   * @param index - Index of element if multiple matches
   * @throws Error if class doesn't appear within timeout
   */
  async waitForClass(
    page: Page,
    element: string | Locator,
    className: string,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT,
    index: number = 0
  ): Promise<void> {
    this.validateParams({ page, element, className, timeout, index });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'attached', timeout });
      
      const elementHandle = await locator.elementHandle();
      await page.waitForFunction(
        ({ element, className: cls }) => {
          return element && element.classList.contains(cls);
        },
        { element: elementHandle, className },
        { timeout }
      );
    } catch (error) {
      throw new Error(this.createErrorMessage(`Wait for class "${className}"`, element, (error as Error).message));
    }
  }

  /**
   * Wait for specific element count
   * @param page - Playwright Page object
   * @param selector - Element selector
   * @param expectedCount - Expected number of elements
   * @param timeout - Timeout in milliseconds
   * @throws Error if expected count is not reached within timeout
   */
  async waitForElementCount(
    page: Page,
    selector: string,
    expectedCount: number,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, selector, expectedCount, timeout });
    
    try {
      await page.waitForFunction(
        ({ sel, count }) => document.querySelectorAll(sel).length === count,
        { sel: selector, count: expectedCount },
        { timeout }
      );
    } catch (error) {
      throw new Error(this.createErrorMessage(`Wait for count ${expectedCount}`, selector, (error as Error).message));
    }
  }

  /**
   * Wait for URL to change
   * @param page - Playwright Page object
   * @param expectedUrl - Expected URL (string or RegExp)
   * @param timeout - Timeout in milliseconds
   * @throws Error if URL doesn't change within timeout
   */
  async waitForUrlChange(
    page: Page,
    expectedUrl: string | RegExp,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, expectedUrl, timeout });
    
    try {
      await page.waitForURL(expectedUrl, { timeout });
    } catch (error) {
      throw new Error(`Wait for URL change failed: ${(error as Error).message}`);
    }
  }

  /**
   * Wait for network to be idle (no requests for specified time)
   * @param page - Playwright Page object
   * @param timeout - Timeout in milliseconds
   * @throws Error if network doesn't become idle within timeout
   */
  async waitForNetworkIdle(
    page: Page,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, timeout });
    
    try {
      await page.waitForLoadState('networkidle', { timeout: timeout * 2 });
    } catch (error) {
      throw new Error(`Wait for network idle failed: ${(error as Error).message}`);
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get count of elements matching selector
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @returns Promise<number> - Number of matching elements
   * @throws Never throws - returns 0 on any error
   */
  async getElementCount(page: Page, element: string | Locator): Promise<number> {
    this.validateParams({ page, element });
    
    try {
      const locator = typeof element === 'string' ? page.locator(element) : element;
      return await locator.count();
    } catch (error) {
      console.debug(`getElementCount: ${this.createErrorMessage('Count elements', element, (error as Error).message)}`);
      return 0;
    }
  }

  /**
   * Get element's bounding box (position and size)
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<{x: number, y: number, width: number, height: number} | null>
   * @throws Error if bounding box cannot be retrieved
   */
  async getElementBoundingBox(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<{ x: number; y: number; width: number; height: number } | null> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      return await locator.boundingBox();
    } catch (error) {
      throw new Error(this.createErrorMessage('Get bounding box', element, (error as Error).message));
    }
  }

  /**
   * Scroll element into view if needed
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if element cannot be scrolled into view
   */
  async scrollToElementIfNeeded(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'attached', timeout });
      await locator.scrollIntoViewIfNeeded();
    } catch (error) {
      throw new Error(this.createErrorMessage('Scroll into view', element, (error as Error).message));
    }
  }

  /**
   * Take screenshot of specific element
   * @param page - Playwright Page object
   * @param element - Element selector or Locator
   * @param path - Path to save screenshot
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if screenshot cannot be taken
   */
  async takeElementScreenshot(
    page: Page,
    element: string | Locator,
    path: string,
    index: number = 0,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, element, path, index, timeout });
    
    try {
      const locator = this.createLocator(page, element, index);
      await locator.waitFor({ state: 'visible', timeout });
      await locator.screenshot({ path });
    } catch (error) {
      throw new Error(this.createErrorMessage('Take screenshot', element, (error as Error).message));
    }
  }

  // ===== ADVANCED METHODS =====

  /**
   * Drag and drop from source to target element
   * @param page - Playwright Page object
   * @param source - Source element selector or Locator
   * @param target - Target element selector or Locator
   * @param sourceIndex - Index of source element if multiple matches
   * @param targetIndex - Index of target element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @throws Error if drag and drop operation fails
   */
  async dragAndDrop(
    page: Page,
    source: string | Locator,
    target: string | Locator,
    sourceIndex: number = 0,
    targetIndex: number = 0,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    this.validateParams({ page, source, target, sourceIndex, targetIndex, timeout });
    
    try {
      const sourceLocator = this.createLocator(page, source, sourceIndex);
      const targetLocator = this.createLocator(page, target, targetIndex);
      
      await sourceLocator.waitFor({ state: 'visible', timeout });
      await targetLocator.waitFor({ state: 'visible', timeout });
      
      await sourceLocator.dragTo(targetLocator);
    } catch (error) {
      const sourceDesc = typeof source === 'string' ? source : 'source Locator';
      const targetDesc = typeof target === 'string' ? target : 'target Locator';
      throw new Error(`Drag and drop failed from ${sourceDesc} to ${targetDesc}: ${(error as Error).message}`);
    }
  }

  // ===== DROPDOWN SPECIFIC METHODS =====

  /**
   * Get selected text from dropdown
   * @param page - Playwright Page object
   * @param dropdownSelector - Dropdown element selector
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string> - Selected option text
   * @throws Error if selected text cannot be retrieved
   */
  async getDropdownSelectedText(
    page: Page,
    dropdownSelector: string,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<string> {
    this.validateParams({ page, dropdownSelector, timeout });
    
    try {
      const locator = page.locator(dropdownSelector);
      await locator.waitFor({ state: 'visible', timeout });
      const selectedOption = locator.locator('option:checked');
      const selectedText = await selectedOption.textContent();
      return selectedText?.trim() || '';
    } catch (error) {
      throw new Error(this.createErrorMessage('Get dropdown selected text', dropdownSelector, (error as Error).message));
    }
  }

  /**
   * Get all selected option values from a multi-select element
   * @param page - Playwright Page object
   * @param element - Select element selector or Locator
   * @param index - Index of element if multiple matches
   * @param timeout - Timeout in milliseconds
   * @returns Promise<string[]> - Array of selected option values
   * @throws Error if selected options cannot be retrieved
   */
  async getSelectedOptions(
    page: Page,
    element: string | Locator,
    index: number = 0,
    timeout: number = ElementHelper.SHORT_TIMEOUT
  ): Promise<string[]> {
    this.validateParams({ page, element, index, timeout });
    
    try {
      const elementLocator = this.createLocator(page, element, index);
      await elementLocator.waitFor({ state: 'visible', timeout });
      
      return await elementLocator.evaluate((select: HTMLSelectElement) => {
        return Array.from(select.selectedOptions).map((option: HTMLOptionElement) => option.value);
      });
    } catch (error) {
      throw new Error(this.createErrorMessage('Get selected options', element, (error as Error).message));
    }
  }

  // ===== LEGACY SUPPORT METHODS =====

  /**
   * Wait for button to be enabled (legacy method for backward compatibility)
   * @deprecated Use waitForElementEnabled instead
   * @param page - Playwright Page object
   * @param element - Button element selector
   * @param timeout - Timeout in milliseconds
   * @throws Error if button doesn't become enabled within timeout
   */
  async waitForButtonEnabled(
    page: Page, 
    element: string,
    timeout: number = ElementHelper.DEFAULT_TIMEOUT
  ): Promise<void> {
    console.warn('waitForButtonEnabled is deprecated. Use waitForElementEnabled instead.');
    await this.waitForElementEnabled(page, element, timeout);
  }

  /**
   * Check if button is enabled (legacy method for backward compatibility)
   * @deprecated Use isElementEnabled instead
   * @param page - Playwright Page object
   * @param element - Button element selector
   * @returns Promise<boolean> - True if button is enabled
   */
  async isButtonEnabled(page: Page, element: string): Promise<boolean> {
    console.warn('isButtonEnabled is deprecated. Use isElementEnabled instead.');
    return await this.isElementEnabled(page, element);
  }
}

export default new ElementHelper();