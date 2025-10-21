import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
import { SmartLogger } from '../utils/smart-logger.utils';
import { EnvironmentManager } from '../utils/environment.utils';

/**
 * WordPress All Posts Page Object Model
 * Handles all interactions with the WordPress posts list page (edit.php)
 * Following AI_AGENT_INSTRUCTIONS patterns with SmartLogger and element.helper
 * 
 * Based on live site inspection of staging.go.ione.nyc/wp-admin/edit.php
 */
export class AllPostsPage extends BasePage {
  private envManager = EnvironmentManager.getInstance();

  constructor(page: Page) {
    super(page, '.wrap h1'); // Posts list page has main heading as identifier
  }

  // ===== SELECTORS (Based on live site inspection) =====
  
  // Page structure elements
  get pageTitle(): string {
    return '.wrap h1'; // "Posts" page title
  }

  get addNewButton(): string {
    return '.page-title-action'; // "Add New" button next to title
  }

  get postsTable(): string {
    return '#the-list'; // Main posts table
  }

  get postsTableRows(): string {
    return '#the-list tr';
  }

  // Filter and search elements
  get searchBox(): string {
    return '#post-search-input';
  }

  get searchButton(): string {
    return '#search-submit';
  }

  get dateFilter(): string {
    return '#filter-by-date';
  }

  get categoryFilter(): string {
    return '#cat';
  }

  get filterButton(): string {
    return '#post-query-submit';
  }

  // Bulk actions
  get bulkActionSelect(): string {
    return '#bulk-action-selector-top';
  }

  get bulkActionButton(): string {
    return '#doaction';
  }

  get selectAllCheckbox(): string {
    return '#cb-select-all-1';
  }

  // View options
  get viewAllFilter(): string {
    return '.subsubsub a[href*="all"]';
  }

  get viewPublishedFilter(): string {
    return '.subsubsub a[href*="publish"]';
  }

  get viewDraftFilter(): string {
    return '.subsubsub a[href*="draft"]';
  }

  get viewTrashFilter(): string {
    return '.subsubsub a[href*="trash"]';
  }

  // Post row elements (for individual posts)
  get postTitleLinks(): string {
    return '.row-title';
  }

  get editLinks(): string {
    return '.row-actions .edit a';
  }

  get quickEditLinks(): string {
    return '.row-actions .inline a';
  }

  get trashLinks(): string {
    return '.row-actions .trash a';
  }

  get viewLinks(): string {
    return '.row-actions .view a';
  }

  // Status indicators
  get draftStatus(): string {
    return '.post-state:contains("Draft")';
  }

  get publishedStatus(): string {
    return '.status-publish';
  }

  // Pagination
  get paginationInfo(): string {
    return '.displaying-num';
  }

  get paginationLinks(): string {
    return '.tablenav-pages a';
  }

  get nextPageLink(): string {
    return '.next-page';
  }

  get prevPageLink(): string {
    return '.prev-page';
  }

  // ===== NAVIGATION METHODS =====

  /**
   * Navigate directly to All Posts page
   */
  async navigate(): Promise<void> {
    try {
      const baseUrl = this.envManager.getBaseUrl();
      await this.page.goto(`${baseUrl}/wp-admin/edit.php`);
      await this.waitForPageShown();
      SmartLogger.logUserAction('navigated to all posts page', 'edit.php');
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  /**
   * Navigate to Add New Post from All Posts page
   */
  async navigateToAddNew(): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.addNewButton);
      await this.page.waitForURL(/.*post-new\.php/);
      SmartLogger.logUserAction('navigated to add new post from all posts page', this.addNewButton);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  // ===== VERIFICATION METHODS =====

  /**
   * Verify All Posts page is loaded
   */
  async isAllPostsPageLoaded(): Promise<boolean> {
    try {
      const titleVisible = await elementHelper.isElementDisplayed(this.page.locator(this.pageTitle));
      const tableVisible = await elementHelper.isElementDisplayed(this.page.locator(this.postsTable));
      const addNewVisible = await elementHelper.isElementDisplayed(this.page.locator(this.addNewButton));
      
      const isLoaded = titleVisible && tableVisible && addNewVisible;
      SmartLogger.logAssertion('all posts page loaded verification', true, isLoaded, isLoaded);
      return isLoaded;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      return false;
    }
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    try {
      const title = await elementHelper.getElementText(this.page, this.pageTitle);
      SmartLogger.logUserAction('retrieved page title', this.pageTitle, title);
      return title;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      return '';
    }
  }

  // ===== POST MANAGEMENT METHODS =====

  /**
   * Get all post titles from the current page
   */
  async getAllPostTitles(): Promise<string[]> {
    try {
      await this.waitForPageShown();
      const titleElements = await this.page.locator(this.postTitleLinks).all();
      const titles: string[] = [];
      
      for (const element of titleElements) {
        const title = await element.textContent();
        if (title) {
          titles.push(title.trim());
        }
      }
      
      SmartLogger.logUserAction('retrieved all post titles', this.postTitleLinks, `Found ${titles.length} posts`);
      return titles;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      return [];
    }
  }

  /**
   * Search for posts by title
   */
  async searchPosts(searchTerm: string): Promise<void> {
    try {
      await elementHelper.enterValue(this.page, this.searchBox, searchTerm);
      await elementHelper.clickElement(this.page, this.searchButton);
      await this.page.waitForLoadState('networkidle');
      SmartLogger.logUserAction('searched for posts', this.searchBox, searchTerm);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      throw error;
    }
  }

  /**
   * Filter posts by status (all, published, draft, trash)
   */
  async filterByStatus(status: 'all' | 'published' | 'draft' | 'trash'): Promise<void> {
    try {
      // Handle 'all' status specially - navigate to base posts page without query params
      if (status === 'all') {
        await this.navigate();
        await this.waitForPostsTableLoad();
        SmartLogger.logUserAction('filtered posts by status', 'navigation to all posts', status);
        return;
      }
      
      let filterSelector: string;
      
      switch (status) {
        case 'published':
          filterSelector = this.viewPublishedFilter;
          break;
        case 'draft':
          filterSelector = this.viewDraftFilter;
          break;
        case 'trash':
          filterSelector = this.viewTrashFilter;
          break;
        default:
          throw new Error(`Invalid status filter: ${status}`);
      }
      
      // Wait for the filter links to be available
      await this.page.locator('.subsubsub').waitFor({ state: 'visible', timeout: 10000 });
      
      // Check if the filter link exists and is clickable
      const filterLink = this.page.locator(filterSelector);
      await filterLink.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get current URL to detect if navigation occurs
      const currentUrl = this.page.url();
      
      await filterLink.click({ timeout: 5000 });
      
      // Wait for URL to change or network to settle
      try {
        await this.page.waitForURL(url => url.toString() !== currentUrl, { timeout: 10000 });
      } catch {
        // Fallback to network idle if URL doesn't change
        await this.page.waitForLoadState('networkidle', { timeout: 15000 });
      }
      
      // Additional wait for posts table to update
      await this.waitForPostsTableLoad();
      
      SmartLogger.logUserAction('filtered posts by status', filterSelector, status);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  /**
   * Find and click edit link for a specific post by title
   */
  async editPostByTitle(title: string): Promise<void> {
    try {
      // Find the row containing the post title
      const postRow = this.page.locator(`tr:has(.row-title:text("${title}"))`);
      
      // Ensure the row is visible and scroll into view
      await postRow.scrollIntoViewIfNeeded();
      await postRow.waitFor({ state: 'visible', timeout: 10000 });
      
      // Hover over the row to reveal the edit links
      await postRow.hover();
      await this.page.waitForTimeout(500); // Wait for hover effects
      
      const editLink = postRow.locator(this.editLinks);
      await editLink.waitFor({ state: 'visible', timeout: 5000 });
      
      // Try clicking with force if normal click fails
      try {
        await editLink.click({ timeout: 5000 });
      } catch (clickError) {
        // Force click if element is stubborn
        await editLink.click({ force: true });
      }
      
      await this.page.waitForURL(/.*post\.php.*action=edit/, { timeout: 10000 });
      SmartLogger.logUserAction('clicked edit link for post', 'edit link', title);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  /**
   * Verify a post exists in the list by title
   */
  async verifyPostExists(title: string): Promise<boolean> {
    try {
      const postExists = await this.page.locator(`.row-title:text("${title}")`).count() > 0;
      SmartLogger.logAssertion('post exists verification', true, postExists, postExists);
      return postExists;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      return false;
    }
  }

  /**
   * Get the post ID for a specific post by title
   */
  async getPostIdByTitle(title: string): Promise<string | null> {
    try {
      const postRow = this.page.locator(`tr:has(.row-title:text("${title}"))`);
      const editLink = postRow.locator('a[href*="post.php"][href*="action=edit"]');
      
      if (await editLink.count() === 0) {
        return null;
      }
      
      const href = await editLink.getAttribute('href');
      if (!href) return null;
      
      const postIdMatch = href.match(/post=(\d+)/);
      return postIdMatch ? postIdMatch[1] : null;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return null;
    }
  }

  /**
   * Get post status for a specific post by title
   */
  async getPostStatus(title: string): Promise<'published' | 'draft' | 'unknown'> {
    try {
      const postRow = this.page.locator(`tr:has(.row-title:text("${title}"))`);
      
      // Wait for the post row to be visible
      await postRow.waitFor({ state: 'visible', timeout: 5000 });
      
      // Check for draft status first (more specific)
      const draftState = await postRow.locator('.post-state:text("Draft")').count();
      if (draftState > 0) {
        SmartLogger.logUserAction('retrieved post status', 'post status', 'draft');
        return 'draft';
      }
      
      // Check for published status using multiple selectors
      const publishedSelectors = [
        '.status-publish',
        'td.post_status:text("Published")',
        '.column-date:not(:has(.post-state))', // Published posts don't show state
        'tr.status-publish'
      ];
      
      for (const selector of publishedSelectors) {
        const isPublished = await postRow.locator(selector).count() > 0;
        if (isPublished) {
          SmartLogger.logUserAction('retrieved post status', 'post status', 'published');
          return 'published';
        }
      }
      
      // If no draft indicator and has date, likely published
      const hasDate = await postRow.locator('.column-date').count() > 0;
      const hasDraftState = await postRow.locator('.post-state').count() > 0;
      
      if (hasDate && !hasDraftState) {
        SmartLogger.logUserAction('retrieved post status', 'post status', 'published');
        return 'published';
      }
      
      SmartLogger.logUserAction('retrieved post status', 'post status', 'unknown');
      return 'unknown';
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return 'unknown';
    }
  }

  /**
   * Get total number of posts displayed
   */
  async getTotalPostCount(): Promise<number> {
    try {
      const rows = await this.page.locator(this.postsTableRows).count();
      SmartLogger.logUserAction('retrieved total post count', this.postsTableRows, rows.toString());
      return rows;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      return 0;
    }
  }

  /**
   * Wait for posts table to be fully loaded
   */
  async waitForPostsTableLoad(): Promise<void> {
    try {
      await elementHelper.waitForDisplayed(this.page, this.postsTable, 10000);
      await this.page.waitForLoadState('networkidle');
      SmartLogger.logUserAction('waited for posts table to load', this.postsTable);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);      throw error;
    }
  }
}

export default AllPostsPage;