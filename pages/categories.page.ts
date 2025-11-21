import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
import { SmartLogger } from '../utils/smart-logger.utils';
import { EnvironmentManager } from '../utils/environment.utils';

/**
 * WordPress Categories Page Object Model
 * Handles all interactions with the WordPress categories management page (edit-tags.php?taxonomy=category)
 * Following AI_AGENT_INSTRUCTIONS patterns with SmartLogger and element.helper
 * 
 * Based on live site inspection of staging.go.ione.nyc/wp-admin/edit-tags.php?taxonomy=category
 */
export class CategoriesPage extends BasePage {
  private envManager = EnvironmentManager.getInstance();

  constructor(page: Page) {
    super(page, '.wrap h1'); // Categories page has main heading as identifier
  }

  // ===== SELECTORS (Based on WordPress standard structure) =====
  
  // Page structure elements
  get pageTitle(): string {
    return '.wrap h1'; // "Categories" page title
  }

  get addNewCategoryForm(): string {
    return '#col-left'; // Left column with add new category form
  }

  get categoriesTable(): string {
    return '#the-list'; // Main categories table
  }

  get categoriesTableRows(): string {
    return '#the-list tr';
  }

  // Add new category form elements
  get categoryNameField(): string {
    return '#tag-name';
  }

  get categorySlugField(): string {
    return '#tag-slug';
  }

  get categoryDescriptionField(): string {
    return '#tag-description';
  }

  get parentCategoryDropdown(): string {
    return '#parent';
  }

  get addCategoryButton(): string {
    return '#submit';
  }

  // Categories table elements
  get searchBox(): string {
    return '#tag-search-input';
  }

  get searchButton(): string {
    return '#search-submit';
  }

  // Bulk actions
  get bulkActionsDropdown(): string {
    return '#bulk-action-selector-top';
  }

  get applyBulkActionButton(): string {
    return '#doaction';
  }

  // Individual category actions (dynamic selectors)
  getCategoryEditLink(categoryName: string): string {
    return `#the-list tr:has(.name .row-title:text("${categoryName}")) .row-actions .edit a`;
  }

  getCategoryDeleteLink(categoryName: string): string {
    return `#the-list tr:has(.name .row-title:text("${categoryName}")) .row-actions .delete a`;
  }

  getCategoryCheckbox(categoryName: string): string {
    return `tr:has(.row-title:text("${categoryName}")) .check-column input[type="checkbox"]`;
  }

  // Success/error messages
  get successMessage(): string {
    return '.notice.notice-success:not(.hidden), .updated:not(.hidden)';
  }

  get errorMessage(): string {
    return '.notice.notice-error:not(.hidden), .error:not(.hidden)';
  }

  // ===== NAVIGATION METHODS =====

  /**
   * Navigate to categories management page
   */
  async navigate(): Promise<void> {
    try {
      const categoriesUrl = `${this.envManager.getBaseUrl()}/wp-admin/edit-tags.php?taxonomy=category`;
      await this.page.goto(categoriesUrl);
      await this.waitForLoad();
      SmartLogger.logUserAction('navigated to categories page', 'edit-tags.php?taxonomy=category');
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  /**
   * Wait for categories page to load
   */
  async waitForLoad(): Promise<void> {
    try {
      await elementHelper.waitForDisplayed(this.page, this.pageTitle, 10000);
      await elementHelper.waitForDisplayed(this.page, this.addNewCategoryForm, 10000);
      SmartLogger.logUserAction('waited for categories page to load', this.pageTitle);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  /**
   * Check if categories page is loaded
   */
  async isCategoriesPageLoaded(): Promise<boolean> {
    try {
      const titleLocator = this.page.locator(this.pageTitle);
      const formLocator = this.page.locator(this.addNewCategoryForm);
      const titleExists = await elementHelper.isElementDisplayed(titleLocator);
      const formExists = await elementHelper.isElementDisplayed(formLocator);
      const isLoaded = titleExists && formExists;
      SmartLogger.logUserAction('verified categories page loaded', this.pageTitle, isLoaded.toString());
      return isLoaded;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  // ===== CATEGORY MANAGEMENT METHODS =====

  /**
   * Create a new category
   */
  async createCategory(name: string, slug?: string, description?: string, parentCategory?: string): Promise<boolean> {
    try {
      SmartLogger.logUserAction('creating new category', 'category form', name);

      // Fill category name (required)
      await elementHelper.enterValue(this.page, this.categoryNameField, name);
      SmartLogger.logUserAction('filled category name', this.categoryNameField, name);

      // Fill slug if provided
      if (slug) {
        await elementHelper.enterValue(this.page, this.categorySlugField, slug);
        SmartLogger.logUserAction('filled category slug', this.categorySlugField, slug);
      }

      // Fill description if provided
      if (description) {
        await elementHelper.enterValue(this.page, this.categoryDescriptionField, description);
        SmartLogger.logUserAction('filled category description', this.categoryDescriptionField, description);
      }

      // Select parent category if provided
      if (parentCategory) {
        await elementHelper.selectOptionValue(this.page, this.parentCategoryDropdown, parentCategory);
        SmartLogger.logUserAction('selected parent category', this.parentCategoryDropdown, parentCategory);
      }

      // Submit the form
      await elementHelper.clickElement(this.page, this.addCategoryButton);
      SmartLogger.logUserAction('clicked add category button', this.addCategoryButton);

      // Wait for page to reload and check for success
      await this.page.waitForLoadState('networkidle');
      await this.waitForLoad();

      const success = await this.isSuccessMessageVisible();
      SmartLogger.logUserAction('category creation result', 'success', success.toString());
      return success;

    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  /**
   * Edit an existing category
   */
  async editCategory(currentName: string, newName?: string, newSlug?: string, newDescription?: string): Promise<boolean> {
    try {
      SmartLogger.logUserAction('editing category', 'category edit', currentName);

      // First check if category exists
      const categoryExists = await this.categoryExists(currentName);
      if (!categoryExists) {
        SmartLogger.logUserAction('category not found for editing', 'error', currentName);
        return false;
      }

      // Click edit link for the category
      const editLink = this.getCategoryEditLink(currentName);
      
      // First hover over the row to reveal the action links
      const categoryRow = `#the-list tr:has(.name .row-title:text("${currentName}"))`;
      await this.page.locator(categoryRow).hover();
      await this.page.waitForTimeout(500); // Wait for hover effects
      
      // Wait for the edit link to be available
      await this.page.waitForSelector(editLink, { timeout: 10000 });
      
      // Scroll the row into view and hover again to ensure visibility
      await this.page.locator(categoryRow).scrollIntoViewIfNeeded();
      await this.page.locator(categoryRow).hover();
      await this.page.waitForTimeout(500); // Small delay after hover
      
      await elementHelper.clickElement(this.page, editLink);
      SmartLogger.logUserAction('clicked category edit link', editLink, currentName);

      // Wait for edit form to load - use edit form specific selectors
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000); // Give extra time for form to render
      
      // Log current page URL to ensure we're on edit page
      const currentUrl = this.page.url();
      SmartLogger.logUserAction('edit page URL', currentUrl);
      
      // WordPress edit form uses different field names
      const editNameField = 'input[name="name"]';
      const editSlugField = 'input[name="slug"]';
      const editDescriptionField = 'textarea[name="description"]';
      
      await elementHelper.waitForDisplayed(this.page, editNameField, 10000);

      // Update fields if provided
      if (newName) {
        await elementHelper.clearAndEnterValue(this.page, editNameField, newName);
        SmartLogger.logUserAction('updated category name', editNameField, newName);
      }

      if (newSlug) {
        await elementHelper.clearAndEnterValue(this.page, editSlugField, newSlug);
        SmartLogger.logUserAction('updated category slug', editSlugField, newSlug);
      }

      if (newDescription) {
        await elementHelper.clearAndEnterValue(this.page, editDescriptionField, newDescription);
        SmartLogger.logUserAction('updated category description', editDescriptionField, newDescription);
      }

      // Submit the update - try multiple possible submit button selectors
      const submitSelectors = [
        'input[type="submit"].button-primary',
        'input[type="submit"][name="submit"]',
        'input[value="Update"]',
        'input[type="submit"][value="Update"]', 
        '#submit',
        '.button-primary',
        '[type="submit"]',
        'button[type="submit"]'
      ];
      
      let buttonClicked = false;
      for (const selector of submitSelectors) {
        try {
          const element = this.page.locator(selector);
          const isVisible = await element.isVisible({ timeout: 1000 });
          if (isVisible) {
            SmartLogger.logUserAction('found submit button', selector);
            await elementHelper.clickElement(this.page, selector);
            SmartLogger.logUserAction('clicked update category button', selector);
            buttonClicked = true;
            break;
          } else {
            SmartLogger.logUserAction('submit button not visible', selector);
          }
        } catch (e) {
          SmartLogger.logUserAction('submit button selector failed', selector, (e as Error).message);
          continue;
        }
      }
      
      if (!buttonClicked) {
        throw new Error('Could not find submit button on edit form');
      }

      // Wait for navigation back to categories list
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000); // Give extra time for messages to appear
      
      const success = await this.isSuccessMessageVisible();
      SmartLogger.logUserAction('category edit result', 'success', success.toString());
      return success;

    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryName: string): Promise<boolean> {
    try {
      SmartLogger.logUserAction('deleting category', 'category delete', categoryName);

      // First check if category exists
      const categoryExists = await this.categoryExists(categoryName);
      if (!categoryExists) {
        SmartLogger.logUserAction('category not found for deletion', 'error', categoryName);
        return false;
      }

      // Click delete link for the category
      const deleteLink = this.getCategoryDeleteLink(categoryName);
      const categoryRow = `#the-list tr:has(.name .row-title:text("${categoryName}"))`;
      
      // First hover over the row to reveal the action links
      await this.page.locator(categoryRow).hover();
      await this.page.waitForTimeout(500); // Wait for hover effects
      
      // Wait for the delete link to be available and visible
      await this.page.waitForSelector(deleteLink, { timeout: 10000 });
      
      // Scroll the row into view and hover again to ensure visibility
      await this.page.locator(categoryRow).scrollIntoViewIfNeeded();
      await this.page.locator(categoryRow).hover();
      await this.page.waitForTimeout(500); // Small delay after hover
      
      await elementHelper.clickElement(this.page, deleteLink);
      SmartLogger.logUserAction('clicked category delete link', deleteLink, categoryName);

      // Wait for page load and potential success message
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000); // Give extra time for messages to appear
      
      const success = await this.isSuccessMessageVisible();
      SmartLogger.logUserAction('category deletion result', 'success', success.toString());
      return success;

    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  /**
   * Search for categories
   */
  async searchCategories(searchTerm: string): Promise<void> {
    try {
      SmartLogger.logUserAction('searching categories', this.searchBox, searchTerm);
      
      await elementHelper.enterValue(this.page, this.searchBox, searchTerm);
      await elementHelper.clickElement(this.page, this.searchButton);
      
      await this.page.waitForLoadState('networkidle');
      await this.waitForLoad();
      
      SmartLogger.logUserAction('completed category search', this.searchButton, searchTerm);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      throw error;
    }
  }

  /**
   * Get all category names from the table
   */
  async getAllCategoryNames(): Promise<string[]> {
    try {
      const categoryNames: string[] = [];
      const categoryRows = this.page.locator(this.categoriesTableRows);
      const count = await categoryRows.count();

      for (let i = 0; i < count; i++) {
        const row = categoryRows.nth(i);
        const nameElement = row.locator('.row-title');
        if (await nameElement.count() > 0) {
          const name = await nameElement.textContent();
          if (name) {
            categoryNames.push(name.trim());
          }
        }
      }

      SmartLogger.logUserAction('retrieved category names', this.categoriesTableRows, categoryNames.join(', '));
      return categoryNames;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return [];
    }
  }

  /**
   * Check if a category exists in the table
   */
  async categoryExists(categoryName: string): Promise<boolean> {
    try {
      const categoryRow = this.page.locator(`tr:has(.row-title:text("${categoryName}"))`);
      const exists = await categoryRow.count() > 0;
      SmartLogger.logUserAction('checked category exists', 'category existence', `${categoryName}: ${exists}`);
      return exists;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  /**
   * Get category count from the table
   */
  async getCategoryCount(): Promise<number> {
    try {
      const categoryRows = this.page.locator(this.categoriesTableRows);
      const count = await categoryRows.count();
      SmartLogger.logUserAction('retrieved category count', this.categoriesTableRows, count.toString());
      return count;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return 0;
    }
  }

  /**
   * Perform bulk action on selected categories
   */
  async performBulkAction(action: 'delete', categoryNames: string[]): Promise<boolean> {
    try {
      SmartLogger.logUserAction('performing bulk action', 'bulk actions', `${action} on ${categoryNames.length} categories`);

      // Select checkboxes for specified categories
      for (const categoryName of categoryNames) {
        const categoryRow = `#the-list tr:has(.name .row-title:text("${categoryName}"))`;
        const checkbox = this.getCategoryCheckbox(categoryName);
        
        // Hover over row to ensure all elements are visible
        await this.page.locator(categoryRow).hover();
        await this.page.waitForTimeout(300);
        
        await elementHelper.clickElement(this.page, checkbox);
        SmartLogger.logUserAction('selected category checkbox', checkbox, categoryName);
      }

      // Select bulk action
      await elementHelper.selectOptionValue(this.page, this.bulkActionsDropdown, action);
      SmartLogger.logUserAction('selected bulk action', this.bulkActionsDropdown, action);

      // Apply bulk action
      await elementHelper.clickElement(this.page, this.applyBulkActionButton);
      SmartLogger.logUserAction('applied bulk action', this.applyBulkActionButton, action);

      // Wait for completion
      await this.page.waitForLoadState('networkidle');
      const success = await this.isSuccessMessageVisible();
      SmartLogger.logUserAction('bulk action result', 'success', success.toString());
      return success;

    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  // ===== VERIFICATION METHODS =====

  /**
   * Check if success message is visible
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    try {
      // Check multiple success message selectors
      const selectors = [
        '.notice.notice-success:not(.hidden)',
        '.updated:not(.hidden)',
        '#message.updated',
        '.notice-success'
      ];
      
      for (const selector of selectors) {
        try {
          const isVisible = await this.page.locator(selector).isVisible({ timeout: 2000 });
          if (isVisible) {
            SmartLogger.logUserAction('found success message', selector);
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      SmartLogger.logUserAction('no success message found', 'all selectors checked');
      return false;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    try {
      // Check multiple error message selectors
      const selectors = [
        '.notice.notice-error:not(.hidden)',
        '.error:not(.hidden)',
        '#message.error',
        '.notice-error'
      ];
      
      for (const selector of selectors) {
        try {
          const isVisible = await this.page.locator(selector).isVisible({ timeout: 2000 });
          if (isVisible) {
            const errorText = await this.page.locator(selector).textContent();
            SmartLogger.logUserAction('found error message', selector, errorText || '');
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      SmartLogger.logUserAction('no error message found', 'all selectors checked');
      return false;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    try {
      const titleElement = this.page.locator(this.pageTitle);
      const title = await titleElement.textContent() || '';
      SmartLogger.logUserAction('retrieved page title', this.pageTitle, title);
      return title.trim();
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return '';
    }
  }

  /**
   * Verify all category form elements are visible
   */
  async verifyAllCategoryFormElementsVisible(): Promise<boolean> {
    try {
      const elements = [
        this.categoryNameField,
        this.categorySlugField,
        this.categoryDescriptionField,
        this.parentCategoryDropdown,
        this.addCategoryButton
      ];

      for (const element of elements) {
        const elementLocator = this.page.locator(element);
        const isVisible = await elementHelper.isElementDisplayed(elementLocator);
        if (!isVisible) {
          SmartLogger.logUserAction('category form element not visible', element, 'false');
          return false;
        }
      }

      SmartLogger.logUserAction('verified all category form elements visible', 'form elements', 'true');
      return true;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page, true);
      return false;
    }
  }
}

export default CategoriesPage;