import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
import { SmartLogger } from '../utils/smart-logger.utils';

/**
 * Dashboard Page Object Model for WordPress Admin Dashboard
 */
class DashboardPage extends BasePage {
  constructor(page: Page) {
    // WordPress admin body typically has wp-admin class
    const element = 'body.wp-admin, #wpadminbar';
    super(page, element);
  }

  // Dashboard specific selectors
  get adminBar(): string {
    return '#wpadminbar';
  }

  get userAccountMenu(): string {
    return '#wp-admin-bar-my-account, #wp-admin-bar-user-info';
  }

  get newButton(): string {
    return '#wp-admin-bar-new-content, .page-title-action';
  }

  get siteName(): string {
    return '#wp-admin-bar-site-name a, .wp-admin-bar-site-name';
  }

  get currentUserName(): string {
    return '#wp-admin-bar-user-info .display-name, #wp-admin-bar-my-account .display-name, .howdy, #wp-admin-bar-user-actions';
  }

  get dashboardWidgets(): string {
    return '#dashboard-widgets, .metabox-holder';
  }

  get mainContent(): string {
    return '#wpbody-content';
  }

  // ===== SIDEBAR MENU ELEMENTS =====
  get dashboardMenuItem(): string {
    return '#menu-dashboard';
  }

  get postsMenuItem(): string {
    return '#menu-posts';
  }

  get mediaMenuItem(): string {
    return '#menu-media';
  }

  get pagesMenuItem(): string {
    return '#menu-pages';
  }

  get commentsMenuItem(): string {
    return '#menu-comments';
  }

  get appearanceMenuItem(): string {
    return '#menu-appearance';
  }

  get pluginsMenuItem(): string {
    return '#menu-plugins';
  }

  get usersMenuItem(): string {
    return '#menu-users';
  }

  get toolsMenuItem(): string {
    return '#menu-tools';
  }

  get settingsMenuItem(): string {
    return '#menu-settings';
  }

  get jetpackMenuItem(): string {
    return '#toplevel_page_jetpack';
  }

  /**
   * Navigate to the dashboard
   */
  async navigate(): Promise<void> {
    const baseURL = process.env.BASE_URL || process.env.LOGIN_URL?.replace('/wp-login.php?skipsso', '') || '';
    if (!baseURL) {
      throw new Error('Base URL is not defined in the environment variables.');
    }
    await this.page.goto(`${baseURL}/wp-admin/`);
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.waitForPageShown();
    // Additional wait for dashboard-specific elements
    try {
      await elementHelper.waitForDisplayed(this.page, this.adminBar, 10000);
      await elementHelper.waitForDisplayed(this.page, this.mainContent, 10000);
    } catch (error) {
      console.warn('Dashboard elements may not be fully loaded:', error);
    }
  }

  /**
   * Check if user is logged in by verifying admin bar presence
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const locator = this.page.locator(this.adminBar);
      return await elementHelper.isElementDisplayed(locator);
    } catch {
      return false;
    }
  }

  /**
   * Check if the "New" button is visible (indicates admin privileges)
   */
  async isNewButtonVisible(): Promise<boolean> {
    try {
      const locator = this.page.locator(this.newButton);
      return await elementHelper.isElementDisplayed(locator);
    } catch {
      return false;
    }
  }

  /**
   * Get the site name from the admin bar
   */
  async getSiteName(): Promise<string> {
    try {
      return await elementHelper.getElementText(this.page, this.siteName);
    } catch {
      return '';
    }
  }

  /**
   * Get the current user name from the admin bar
   */
  async getCurrentUserName(): Promise<string> {
    try {
      return await elementHelper.getElementText(this.page, this.currentUserName);
    } catch {
      return '';
    }
  }

  /**
   * Check if dashboard widgets are loaded
   */
  async areDashboardWidgetsLoaded(): Promise<boolean> {
    try {
      const locator = this.page.locator(this.dashboardWidgets);
      return await elementHelper.isElementDisplayed(locator);
    } catch {
      return false;
    }
  }

  // ===== SIDEBAR MENU ACTIONS =====
  /**
   * Check if a sidebar menu item is visible
   * @param menuSelector - The selector for the menu item
   * @returns Promise<boolean> - True if menu item is visible
   */
  async isSidebarMenuItemVisible(menuSelector: string): Promise<boolean> {
    try {
      const locator = this.page.locator(menuSelector);
      return await elementHelper.isElementDisplayed(locator);
    } catch {
      return false;
    }
  }

  /**
   * Click a sidebar menu item
   * @param menuSelector - The selector for the menu item
   */
  async clickSidebarMenuItem(menuSelector: string): Promise<void> {
    await elementHelper.clickElement(this.page, menuSelector);
  }

  /**
   * Verify all main sidebar elements are visible
   * @returns Promise<{visible: number, total: number, missing: string[]}> - Sidebar verification results
   */
  async verifySidebarElements(): Promise<{visible: number, total: number, missing: string[]}> {
    const sidebarElements = [
      { name: 'Dashboard', selector: this.dashboardMenuItem },
      { name: 'Posts', selector: this.postsMenuItem },
      { name: 'Media', selector: this.mediaMenuItem },
      { name: 'Pages', selector: this.pagesMenuItem },
      { name: 'Comments', selector: this.commentsMenuItem },
      { name: 'Appearance', selector: this.appearanceMenuItem },
      { name: 'Plugins', selector: this.pluginsMenuItem },
      { name: 'Users', selector: this.usersMenuItem },
      { name: 'Tools', selector: this.toolsMenuItem },
      { name: 'Settings', selector: this.settingsMenuItem }
    ];

    let visible = 0;
    const missing: string[] = [];

    for (const element of sidebarElements) {
      const isVisible = await this.isSidebarMenuItemVisible(element.selector);
      if (isVisible) {
        visible++;
      } else {
        missing.push(element.name);
      }
    }

    return {
      visible,
      total: sidebarElements.length,
      missing
    };
  }

  /**
   * Navigate to Posts page via sidebar
   */
  async navigateToPosts(): Promise<void> {
    await this.clickSidebarMenuItem(this.postsMenuItem);
  }

  /**
   * Navigate to Add New Post page directly
   */
  async navigateToNewPost(): Promise<void> {
    try {
      // First try clicking the admin bar "New" button if it exists
      const newButton = this.page.locator(this.newButton);
      const newButtonVisible = await newButton.isVisible();
      
      if (newButtonVisible) {
        await newButton.click();
        // Wait for submenu to appear and click "Post"
        const postOption = this.page.locator('a[href*="post-new.php"]');
        if (await postOption.isVisible()) {
          await postOption.click();
          return;
        }
      }
      
      // Fallback: Navigate to Posts submenu and click "Add New"
      await this.page.hover(this.postsMenuItem);
      await this.page.waitForTimeout(500); // Wait for submenu
      
      const addNewLink = this.page.locator(`${this.postsMenuItem} + ul a[href*="post-new.php"]`);
      if (await addNewLink.isVisible()) {
        await addNewLink.click();
      } else {
        // Direct navigation as last resort
        const baseURL = process.env.BASE_URL || '';
        await this.page.goto(`${baseURL}/wp-admin/post-new.php`);
      }
    } catch (error) {
      // Direct navigation fallback
      const baseURL = process.env.BASE_URL || '';
      await this.page.goto(`${baseURL}/wp-admin/post-new.php`);
    }
  }

  /**
   * Navigate to Media page via sidebar
   */
  async navigateToMedia(): Promise<void> {
    await this.clickSidebarMenuItem(this.mediaMenuItem);
  }

  /**
   * Navigate to Pages page via sidebar
   */
  async navigateToPages(): Promise<void> {
    await this.clickSidebarMenuItem(this.pagesMenuItem);
  }

  /**
   * Navigate to Settings page via sidebar
   */
  async navigateToSettings(): Promise<void> {
    await this.clickSidebarMenuItem(this.settingsMenuItem);
  }

  /**
   * Verify that we are on the dashboard page
   */
  async verifyOnDashboardPage(): Promise<boolean> {
    try {
      SmartLogger.logUserAction('Verifying we are on dashboard page');
      const element = this.page.locator(this.adminBar);
      const isVisible = await elementHelper.isElementDisplayed(element);
      SmartLogger.logUserAction(`Dashboard page verification result: ${isVisible}`);
      return isVisible;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Verify posts menu is visible in sidebar
   */
  async verifyPostsMenuVisible(): Promise<boolean> {
    try {
      SmartLogger.logUserAction('Verifying posts menu is visible');
      const element = this.page.locator(this.postsMenuItem);
      const isVisible = await elementHelper.isElementDisplayed(element);
      SmartLogger.logUserAction(`Posts menu visibility: ${isVisible}`);
      return isVisible;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Take a screenshot of the dashboard
   */
  async takeScreenshot(name: string = 'dashboard'): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }
}

export default DashboardPage;