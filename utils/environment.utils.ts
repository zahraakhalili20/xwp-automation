import { EnvironmentConfig } from '../types/base.types';

/**
 * Environment configuration utility
 */
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): EnvironmentConfig {
    return {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      apiUrl: process.env.API_URL || 'http://localhost:3000/api',
      timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
      retries: parseInt(process.env.TEST_RETRIES || '1'),
      headless: process.env.HEADLESS !== 'false'
    };
  }

  /**
   * Get configuration
   */
  getConfig(): EnvironmentConfig {
    return this.config;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Get timeout
   */
  getTimeout(): number {
    return this.config.timeout;
  }

  /**
   * Get retries
   */
  getRetries(): number {
    return this.config.retries;
  }

  /**
   * Check if running in headless mode
   */
  isHeadless(): boolean {
    return this.config.headless;
  }

  /**
   * Get environment name
   */
  getEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Check if running in CI
   */
  isCI(): boolean {
    return !!process.env.CI;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}