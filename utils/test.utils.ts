import { TestUser } from '../types/base.types';

/**
 * Utility functions for test helpers
 */
export class TestUtils {
  /**
   * Generate random string
   * @param length - Length of the string
   * @returns Random string
   */
  static generateRandomString(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Generate random email
   * @param domain - Email domain
   * @returns Random email address
   */
  static generateRandomEmail(domain: string = 'test.com'): string {
    const randomString = this.generateRandomString(8);
    return `${randomString}@${domain}`;
  }

  /**
   * Wait for specified duration
   * @param ms - Milliseconds to wait
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current timestamp
   * @returns Current timestamp string
   */
  static getCurrentTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns True if email is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create test user with random data
   * @param overrides - Properties to override
   * @returns Test user object
   */
  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    const randomString = this.generateRandomString(6);
    return {
      username: `testuser_${randomString}`,
      password: 'Test123!',
      email: this.generateRandomEmail(),
      role: 'subscriber' as any,
      firstName: 'Test',
      lastName: 'User',
      ...overrides
    };
  }

  /**
   * Sanitize string for file names
   * @param str - String to sanitize
   * @returns Sanitized string
   */
  static sanitizeForFileName(str: string): string {
    return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /**
   * Deep clone an object
   * @param obj - Object to clone
   * @returns Cloned object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}