/**
 * Base page interface for all page object models
 */
export interface BasePage {
  readonly page: import('@playwright/test').Page;
  goto(url?: string): Promise<void>;
  waitForLoad(): Promise<void>;
  getTitle(): Promise<string>;
  getUrl(): Promise<string>;
}

/**
 * Test user interface
 */
export interface TestUser {
  username: string;
  password: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

/**
 * User roles enumeration
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  SUBSCRIBER = 'subscriber',
  GUEST = 'guest'
}

/**
 * Test data interface
 */
export interface TestData {
  users: Record<string, TestUser>;
  urls: Record<string, string>;
  timeouts: Record<string, number>;
}

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  baseUrl: string;
  apiUrl: string;
  timeout: number;
  retries: number;
  headless: boolean;
}

/**
 * Page element locators interface
 */
export interface PageLocators {
  [key: string]: string;
}

/**
 * Test result interface
 */
export interface TestResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error;
}