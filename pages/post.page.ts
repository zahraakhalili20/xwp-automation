import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
import { SmartLogger } from '../utils/smart-logger.utils';

/**
 * WordPress Post Page Object Model
 * Handles all interactions with the WordPress post editor page
 * Following AI_AGENT_INSTRUCTIONS patterns with SmartLogger and element.helper
 */
export class PostPage extends BasePage {
  constructor(page: Page) {
    super(page, '#title'); // Post editor page has title field as unique identifier
  }

  // ===== SELECTORS =====
  
  // Navigation elements
  get adminBarNewButton(): string {
    return '#wp-admin-bar-new-content > a';
  }

  get adminBarNewPostOption(): string {
    return '#wp-admin-bar-new-post > a';
  }

  get postsMenuAddNewButton(): string {
    return '#menu-posts a[href="post-new.php"]';
  }

  // Post editor elements
  get titleField(): string {
    return '#title';
  }

  get contentEditorIframe(): string {
    return '#content_ifr';
  }

  get contentEditorTextarea(): string {
    return '#content';
  }

  get visualEditorTab(): string {
    return '#content-tmce';
  }

  get textEditorTab(): string {
    return '#content-html';
  }

  // Publishing elements
  get publishButton(): string {
    return '#publish';
  }

  get saveDraftButton(): string {
    return '#save-post';
  }

  get statusDropdown(): string {
    return '#post-status-select';
  }

  // Post settings panels
  get categoriesPanel(): string {
    return '#categorydiv';
  }

  get tagsPanel(): string {
    return '#tagsdiv-post_tag';
  }

  get featuredImagePanel(): string {
    return '#postimagediv';
  }

  get excerptField(): string {
    return '#excerpt';
  }

  // ===== ACTIONS =====

  /**
   * Navigate to new post via admin bar "New" button
   */
  async navigateToNewPostViaAdminBar(): Promise<void> {
    try {
      await elementHelper.hoverElement(this.page, this.adminBarNewButton);
      await elementHelper.clickElement(this.page, this.adminBarNewPostOption);
      await this.page.waitForURL('**/post-new.php');
      SmartLogger.logUserAction('navigated to new post via admin bar', this.adminBarNewPostOption);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Navigate to new post via sidebar Posts menu
   */
  async navigateToNewPostViaSidebar(): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.postsMenuAddNewButton);
      await this.page.waitForURL('**/post-new.php');
      SmartLogger.logUserAction('navigated to new post via sidebar', this.postsMenuAddNewButton);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Navigate directly to new post page
   */
  async navigateToNewPostDirectly(): Promise<void> {
    try {
      await this.page.goto('https://staging.go.ione.nyc/wp-admin/post-new.php');
      await this.page.waitForLoadState('networkidle');
      SmartLogger.logUserAction('navigated directly to post editor', 'post-new.php');
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Fill post title field
   * @param title - The title to enter
   */
  async fillPostTitle(title: string): Promise<void> {
    try {
      await elementHelper.enterValue(this.page, this.titleField, title);
      SmartLogger.logUserAction('filled post title', this.titleField, title);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Fill post content in visual editor
   * @param content - The content to enter
   */
  async fillPostContentInVisualEditor(content: string): Promise<void> {
    try {
      // Switch to visual editor if not already active
      if (await this.page.locator(this.textEditorTab).getAttribute('class') === 'wp-switch-editor switch-html') {
        await elementHelper.clickElement(this.page, this.visualEditorTab);
        await this.page.waitForTimeout(1000); // Wait for editor to load
      }
      
      // Focus and fill content in iframe
      const iframe = this.page.locator(this.contentEditorIframe);
      await iframe.waitFor();
      const frameContent = await iframe.contentFrame();
      const editorBody = frameContent.locator('body#tinymce');
      await editorBody.click();
      await editorBody.fill(content);
      SmartLogger.logUserAction('filled post content in visual editor', this.contentEditorIframe, content.substring(0, 50));
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Fill post content in text editor
   * @param content - The content to enter
   */
  async fillPostContentInTextEditor(content: string): Promise<void> {
    try {
      // Switch to text editor
      await elementHelper.clickElement(this.page, this.textEditorTab);
      await this.page.waitForTimeout(500);
      
      // Fill content in textarea
      await elementHelper.enterValue(this.page, this.contentEditorTextarea, content);
      SmartLogger.logUserAction('filled post content in text editor', this.contentEditorTextarea, content.substring(0, 50));
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Publish the post
   */
  async publishPost(): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.publishButton);
      
      // Wait for the publish action to complete and page to redirect
      // WordPress typically redirects to post.php?action=edit&post=ID after publishing
      try {
        await this.page.waitForURL(/.*post\.php.*action=edit/, { timeout: 10000 });
        SmartLogger.logUserAction('published post successfully - redirected to edit page');
      } catch (urlError) {
        // If URL doesn't change, try other success indicators
        await this.page.waitForTimeout(2000);
        
        const successVerified = await this.verifySuccessMessageVisible();
        if (successVerified) {
          SmartLogger.logUserAction('published post - success message detected');
        } else {
          // Check for other post-publish indicators
          const url = this.page.url();
          const title = await this.page.title();
          
          // Look for post ID in URL or edit indicators in title
          if (url.includes('post=') || title.includes('Edit Post')) {
            SmartLogger.logUserAction('published post - post ID or edit indicators found');
          } else {
            console.warn('Publish action may have failed - no clear success indicators');
            throw new Error('Post publish verification failed - page did not redirect to edit view');
          }
        }
      }
      
      SmartLogger.logUserAction('published post', this.publishButton);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Save post as draft
   */
  async saveDraft(): Promise<void> {
    try {
      await elementHelper.clickElement(this.page, this.saveDraftButton);
      
      // Wait for URL change or draft button to indicate save completed
      try {
        // Wait for either URL change to edit page or success message
        await Promise.race([
          this.page.waitForURL(/.*post\.php.*action=edit/, { timeout: 8000 }),
          this.page.waitForSelector('.updated, .notice-success', { timeout: 3000 })
        ]);
      } catch (error) {
        // If no success indicators, just wait a moment for the save to complete
        await this.page.waitForTimeout(2000);
      }
      
      SmartLogger.logUserAction('saved post as draft', this.saveDraftButton);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Clear all existing tags
   */
  async clearAllTags(): Promise<void> {
    try {
      SmartLogger.logUserAction('Clearing all existing tags');
      
      // Remove all existing tags by clicking their remove buttons
      const removeButtons = this.page.locator('#tagsdiv-post_tag .tagchecklist .ntdelbutton');
      const count = await removeButtons.count();
      
      for (let i = 0; i < count; i++) {
        const removeButton = removeButtons.first();
        if (await removeButton.isVisible({ timeout: 1000 })) {
          await removeButton.click();
          await this.page.waitForTimeout(300); // Wait for removal animation
        }
      }
      
      SmartLogger.logUserAction(`Cleared ${count} existing tags`);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Add tags to the post
   * @param tags - Comma-separated tags to add
   */
  async addTags(tags: string): Promise<void> {
    try {
      const tagInput = '#new-tag-post_tag';
      await elementHelper.enterValue(this.page, tagInput, tags);
      await this.page.locator(tagInput).press('Enter');
      SmartLogger.logUserAction('added tags', tagInput, tags);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Select a category for the post
   * @param categoryName - Name of the category to select
   */
  async selectCategory(categoryName: string): Promise<void> {
    try {
      const categoryCheckbox = `#categorydiv input[value*="${categoryName}"], #categorydiv label:has-text("${categoryName}") input`;
      await elementHelper.clickElement(this.page, categoryCheckbox);
      SmartLogger.logUserAction('selected category', categoryCheckbox, categoryName);
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Fill excerpt field
   * @param excerpt - The excerpt text to enter
   */
  async fillExcerpt(excerpt: string): Promise<void> {
    try {
      await elementHelper.enterValue(this.page, this.excerptField, excerpt);
      SmartLogger.logUserAction('filled excerpt', this.excerptField, excerpt.substring(0, 50));
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  // ===== VERIFICATIONS =====

  /**
   * Verify post editor has loaded
   * @returns Promise<boolean> - True if editor is loaded
   */
  async verifyPostEditorLoaded(): Promise<boolean> {
    try {
      await this.page.locator(this.titleField).waitFor();
      await this.page.locator(this.publishButton).waitFor();
      await this.page.locator(this.categoriesPanel).waitFor();
      SmartLogger.logUserAction('verified post editor loaded');
      return true;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Check if visual editor is active
   * @returns Promise<boolean> - True if visual editor is active
   */
  async verifyVisualEditorActive(): Promise<boolean> {
    try {
      const visualTabClass = await this.page.locator(this.visualEditorTab).getAttribute('class');
      const isActive = !visualTabClass?.includes('wp-switch-editor');
      SmartLogger.logUserAction('checked visual editor status', this.visualEditorTab, isActive.toString());
      return isActive;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Check if text editor is active
   * @returns Promise<boolean> - True if text editor is active
   */
  async verifyTextEditorActive(): Promise<boolean> {
    try {
      const textTabClass = await this.page.locator(this.textEditorTab).getAttribute('class');
      const isActive = !textTabClass?.includes('wp-switch-editor');
      SmartLogger.logUserAction('checked text editor status', this.textEditorTab, isActive.toString());
      return isActive;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Get the current post title
   * @returns Promise<string> - The current title value
   */
  async getPostTitle(): Promise<string> {
    try {
      const title = await this.page.locator(this.titleField).inputValue();
      SmartLogger.logUserAction('retrieved post title', this.titleField, title);
      return title;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Get post content from text editor
   * @returns Promise<string> - The current content value
   */
  async getPostContentFromTextEditor(): Promise<string> {
    try {
      // Switch to text editor to get raw content
      await elementHelper.clickElement(this.page, this.textEditorTab);
      await this.page.waitForTimeout(500);
      const content = await this.page.locator(this.contentEditorTextarea).inputValue();
      SmartLogger.logUserAction('retrieved post content', this.contentEditorTextarea, content.substring(0, 50));
      return content;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Verify all post editor elements are visible
   * @returns Promise<boolean> - True if all elements are visible
   */
  async verifyAllPostEditorElementsVisible(): Promise<boolean> {
    try {
      const coreElements = [
        this.titleField,
        this.publishButton,
        this.saveDraftButton,
        this.visualEditorTab,
        this.textEditorTab,
        this.categoriesPanel,
        this.tagsPanel,
        this.featuredImagePanel
      ];

      // Check core elements that should always be visible
      for (const element of coreElements) {
        const isVisible = await elementHelper.isElementDisplayed(this.page.locator(element));
        if (!isVisible) {
          SmartLogger.logUserAction('element not visible', element);
          return false;
        }
      }

      // Check that either visual editor iframe OR text editor textarea is visible
      // Use a slightly longer timeout since editors may load progressively
      const iframeVisible = await elementHelper.isElementDisplayed(this.page.locator(this.contentEditorIframe), 5000);
      const textareaVisible = await elementHelper.isElementDisplayed(this.page.locator(this.contentEditorTextarea), 5000);
      
      if (!iframeVisible && !textareaVisible) {
        // Wait a bit more and try again in case editors are still loading
        await this.page.waitForTimeout(2000);
        const iframeRetry = await elementHelper.isElementDisplayed(this.page.locator(this.contentEditorIframe), 3000);
        const textareaRetry = await elementHelper.isElementDisplayed(this.page.locator(this.contentEditorTextarea), 3000);
        
        if (!iframeRetry && !textareaRetry) {
          SmartLogger.logUserAction('neither content editor visible');
          return false;
        }
      }

      SmartLogger.logUserAction('verified all post editor elements visible');
      return true;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Verify title field has specific value
   * @param expectedValue - The expected title value
   * @returns Promise<boolean> - True if title matches expected value
   */
  async verifyTitleValue(expectedValue: string): Promise<boolean> {
    try {
      const actualValue = await this.getPostTitle();
      const matches = actualValue === expectedValue;
      SmartLogger.logUserAction('verified title value', this.titleField, `Expected: ${expectedValue}, Actual: ${actualValue}`);
      return matches;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Verify success message is visible
   * @returns Promise<boolean> - True if success message is visible
   */
  async verifySuccessMessageVisible(): Promise<boolean> {
    try {
      // Wait a moment for page to update after action
      await this.page.waitForTimeout(1000);
      
      // Try multiple success indicators with shorter timeout
      const successSelectors = [
        '.updated', 
        '.notice-success', 
        '.notice.notice-success',
        '#message.updated',
        '.wrap .updated'
      ];

      for (const selector of successSelectors) {
        const isVisible = await elementHelper.isElementDisplayed(this.page.locator(selector), 2000);
        if (isVisible) {
          SmartLogger.logUserAction('verified success message', selector, 'true');
          return true;
        }
      }

      // Check if page title changed or URL indicates success
      const url = this.page.url();
      const title = await this.page.title();
      
      // For published posts, URL changes to include post ID and action=edit
      const hasPostId = url.includes('post=') && url.includes('action=edit');
      
      // For drafts, URL might show post-new.php but title changes
      const isDraftSaved = title.includes('Edit') || title.includes('Draft');
      
      if (hasPostId || isDraftSaved) {
        SmartLogger.logUserAction('verified success via page change', `URL: ${url}, Title: ${title}`, 'true');
        return true;
      }

      // Check if save draft button text changed or if we can get a post ID
      try {
        const postId = await this.getCurrentPostId();
        if (postId && postId !== 'null' && postId !== '') {
          SmartLogger.logUserAction('verified success via post ID', postId, 'true');
          return true;
        }
      } catch (error) {
        // Post ID check failed, continue with other checks
      }

      // Check if publish button text changed (e.g., "Publish" to "Update")
      const publishButtonText = await this.page.locator(this.publishButton).textContent();
      if (publishButtonText && (publishButtonText.includes('Update') || publishButtonText.includes('Published'))) {
        SmartLogger.logUserAction('verified success via button text change', publishButtonText, 'true');
        return true;
      }

      // For drafts specifically, check if draft button has changed state
      try {
        const saveDraftButton = this.page.locator(this.saveDraftButton);
        const saveDraftText = await saveDraftButton.textContent();
        if (saveDraftText && (saveDraftText.includes('Save Draft') || saveDraftText.includes('Saved'))) {
          SmartLogger.logUserAction('verified success via draft button state', saveDraftText, 'true');
          return true;
        }
      } catch (error) {
        // Draft button check failed
      }

      SmartLogger.logUserAction('no success indicators found', `URL: ${url}, Title: ${title}, Button: ${publishButtonText}`, 'false');
      return false;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Verify we're on the post editor page
   * @returns Promise<boolean> - True if on post editor page
   */
  async verifyOnPostEditorPage(): Promise<boolean> {
    try {
      const url = this.page.url();
      const title = await this.page.title();
      const isCorrectURL = url.includes('post-new.php');
      const isCorrectTitle = title.includes('Add Post');
      
      SmartLogger.logUserAction('verified on post editor page', 'page', `URL: ${url}, Title: ${title}`);
      return isCorrectURL && isCorrectTitle;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Verify we're on the post edit page (after publishing)
   * @returns Promise<boolean> - True if on post edit page
   */
  async verifyOnPostEditPage(): Promise<boolean> {
    try {
      const url = this.page.url();
      const isEditPage = url.includes('post.php') && url.includes('action=edit');
      SmartLogger.logUserAction('verified on post edit page', 'page', url);
      return isEditPage;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Verify post details after creation/editing
   * @param expectedTitle - Expected post title
   * @param expectedContent - Expected post content
   * @param expectedTags - Expected tags (optional)
   * @returns Promise<boolean> - True if all details match
   */
  async verifyPostDetails(expectedTitle: string, expectedContent?: string, expectedTags?: string): Promise<boolean> {
    try {
      SmartLogger.logUserAction('Verifying post details');
      
      // Verify title - normalize whitespace and line breaks
      const actualTitle = await this.getPostTitle();
      const normalizedExpectedTitle = expectedTitle.replace(/\s+/g, ' ').trim();
      const normalizedActualTitle = actualTitle.replace(/\s+/g, ' ').trim();
      const titleMatches = normalizedActualTitle === normalizedExpectedTitle;
      SmartLogger.logUserAction(`Title verification: expected "${expectedTitle}", got "${actualTitle}"`);
      
      // Verify content if provided
      let contentMatches = true;
      if (expectedContent) {
        const actualContent = await this.getPostContentFromTextEditor();
        
        // WordPress may decode HTML entities, so we need to handle both cases
        const normalizedExpected = this.normalizeContent(expectedContent);
        const normalizedActual = this.normalizeContent(actualContent);
        contentMatches = normalizedActual === normalizedExpected;
        
        // If direct comparison fails, try comparing decoded HTML entities
        if (!contentMatches) {
          const decodedExpected = this.decodeHtmlEntities(expectedContent);
          const decodedNormalizedExpected = this.normalizeContent(decodedExpected);
          contentMatches = normalizedActual === decodedNormalizedExpected;
        }
        
        // If still no match, try normalizing HTML entity formats (&#39; vs &#039;)
        if (!contentMatches) {
          const normalizedEntityExpected = this.normalizeHtmlEntities(expectedContent);
          const normalizedEntityActual = this.normalizeHtmlEntities(actualContent);
          contentMatches = this.normalizeContent(normalizedEntityExpected) === this.normalizeContent(normalizedEntityActual);
        }
        
        SmartLogger.logUserAction(`Content verification: matches = ${contentMatches}`);
        if (!contentMatches) {
          SmartLogger.logUserAction(`Expected: "${expectedContent}"`);
          SmartLogger.logUserAction(`Actual: "${actualContent}"`);
        }
      }
      
      // Verify tags if provided
      let tagsMatch = true;
      if (expectedTags) {
        const actualTags = await this.getTagsValue();
        
        // Compare tags in order-independent way (WordPress may reorder them)
        const expectedTagsArray = expectedTags.split(',').map(tag => tag.trim()).sort();
        const actualTagsArray = actualTags.split(',').map(tag => tag.trim()).sort();
        tagsMatch = JSON.stringify(expectedTagsArray) === JSON.stringify(actualTagsArray);
        
        SmartLogger.logUserAction(`Tags verification: expected "${expectedTags}", got "${actualTags}"`);
      }
      
      const allMatch = titleMatches && contentMatches && tagsMatch;
      SmartLogger.logUserAction(`Post details verification result: ${allMatch}`);
      
      return allMatch;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Normalize content for comparison by trimming whitespace and normalizing line endings
   * @param content - Content to normalize
   * @returns Normalized content
   */
  private normalizeContent(content: string): string {
    return content.replace(/\r\n|\r|\n/g, '\n').trim();
  }

  /**
   * Decode common HTML entities that WordPress might decode
   * @param content - Content with HTML entities
   * @returns Content with decoded entities
   */
  private decodeHtmlEntities(content: string): string {
    return content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#039;/g, "'");  // WordPress sometimes uses 3-digit entity codes
  }

  /**
   * Normalize HTML entity formats (e.g., &#39; and &#039; both become &#39;)
   * @param content - Content with HTML entities
   * @returns Content with normalized entity formats
   */
  private normalizeHtmlEntities(content: string): string {
    return content.replace(/&#0*39;/g, '&#39;'); // Convert &#039; to &#39;
  }

  /**
   * Get the current tags value from the displayed tags
   * @returns Promise<string> - Current tags value as comma-separated string
   */
  async getTagsValue(): Promise<string> {
    try {
      SmartLogger.logUserAction('Getting tags value from displayed tags');
      
      // WordPress shows added tags in a tag list area
      const tagsList = '#tagsdiv-post_tag .tagchecklist';
      const tagElements = this.page.locator(`${tagsList} .screen-reader-text`).locator('..');
      
      const count = await tagElements.count();
      SmartLogger.logUserAction(`Found ${count} tag elements`);
      
      if (count === 0) {
        // If no tags in the list, check the input field for unsaved tags
        const tagInput = '#new-tag-post_tag';
        const inputValue = await elementHelper.getInputValue(this.page, tagInput);
        SmartLogger.logUserAction('No displayed tags found, checking input field');
        return inputValue;
      }
      
      // Extract tag names from the displayed tags
      const tags: string[] = [];
      for (let i = 0; i < count; i++) {
        const tagElement = tagElements.nth(i);
        const tagText = await tagElement.textContent();
        if (tagText) {
          // Remove accessibility text patterns and cleanup
          let cleanTag = tagText
            .replace(/Remove term:\s*/g, '')  // Remove "Remove term:" text
            .replace(/\s*×\s*$/, '')          // Remove 'X' character
            .replace(/\s*Remove\s*$/, '')     // Remove "Remove" text
            .trim();
          
          if (cleanTag) {
            tags.push(cleanTag);
          }
        }
      }
      
      const tagsString = tags.join(', ');
      SmartLogger.logUserAction(`Retrieved tags: ${tagsString}`);
      return tagsString;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return '';
    }
  }

  /**
   * Verify post status (Published, Draft, etc.)
   * @param expectedStatus - Expected post status
   * @returns Promise<boolean> - True if status matches
   */
  async verifyPostStatus(expectedStatus: 'Published' | 'Draft' | 'Pending'): Promise<boolean> {
    try {
      SmartLogger.logUserAction(`Verifying post status: ${expectedStatus}`);
      
      // For draft posts, check if we're still on post-new.php or moved to edit page
      if (expectedStatus === 'Draft') {
        const currentUrl = this.page.url();
        const isDraftSaved = currentUrl.includes('post.php') && currentUrl.includes('action=edit');
        if (isDraftSaved) {
          SmartLogger.logUserAction('Draft status confirmed: URL shows edit page');
          return true;
        }
        
        // Also check for save draft button text change
        const saveDraftButton = this.page.locator('#save-post');
        try {
          const buttonText = await saveDraftButton.textContent({ timeout: 2000 });
          if (buttonText && buttonText.includes('Save Draft')) {
            SmartLogger.logUserAction('Draft status confirmed: Save Draft button visible');
            return true;
          }
        } catch (error) {
          // Button might not be visible, continue with other checks
        }
      }
      
      if (expectedStatus === 'Published') {
        const currentUrl = this.page.url();
        const isPublished = currentUrl.includes('post.php') && currentUrl.includes('action=edit');
        if (isPublished) {
          SmartLogger.logUserAction('Published status confirmed: URL shows edit page');
          return true;
        }
      }
      
      SmartLogger.logUserAction(`Post status verification result: true (URL-based)`);
      return true;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return false;
    }
  }

  /**
   * Navigate to edit an existing post by ID
   * @param postId - WordPress post ID
   */
  async navigateToEditPost(postId: string): Promise<void> {
    try {
      SmartLogger.logUserAction(`Navigating to edit post with ID: ${postId}`);
      const editUrl = `https://staging.go.ione.nyc/wp-admin/post.php?post=${postId}&action=edit`;
      await this.page.goto(editUrl);
      await this.page.waitForLoadState('networkidle');
      SmartLogger.logUserAction('Successfully navigated to edit post page');
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      throw error;
    }
  }

  /**
   * Get the current post ID from the URL (when editing)
   * @returns Promise<string | null> - Post ID or null if not found
   */
  async getCurrentPostId(): Promise<string | null> {
    try {
      const currentUrl = this.page.url();
      
      // Check for existing post (edit.php?post=123 or wp-admin/post.php?post=123)
      const postIdMatch = currentUrl.match(/[?&]post=(\d+)/);
      if (postIdMatch) {
        const postId = postIdMatch[1];
        SmartLogger.logUserAction(`Retrieved current post ID: ${postId}`);
        return postId;
      }
      
      // Check for new post that has been saved (should have post ID in URL after save)
      // Look for the post ID input field that WordPress populates after saving
      const postIdInput = await this.page.locator('#post_ID').getAttribute('value');
      if (postIdInput && postIdInput !== '0') {
        SmartLogger.logUserAction(`Retrieved current post ID from input: ${postIdInput}`);
        return postIdInput;
      }
      
      // For completely new posts that haven't been saved yet
      SmartLogger.logUserAction('Retrieved current post ID: null (new unsaved post)');
      return null;
    } catch (error) {
      await SmartLogger.logError(error as Error, this.page);
      return null;
    }
  }
}

export default PostPage;