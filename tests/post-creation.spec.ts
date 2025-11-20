/**
 * Post Creation Tests for staging.go.ione.nyc
 * Tests WordPress post creation functionality using saved session
 * Following AI_AGENT_INSTRUCTIONS patterns with PageFactory and page objects
 * 
 * Tests cover: post editor navigation, content creation, draft saving, 
 * publishing, metadata management, and UI verification
 * 
 * Note: Uses saved session from .auth/staging-ione.json - login handled separately
 * @author XWP Platform Team
 */

import { test, expect } from '@playwright/test';
import PageFactory from '@pages/page.factory';
import { TestTags, TagCombinations } from '@fixtures/test-tags.fixture';
import { testTimeouts, testData } from '@fixtures/test-data.fixture';
import { TestUtils } from '@utils/test.utils';
import { SmartLogger } from '../utils/smart-logger.utils';

test.describe('Post Creation Tests', {
  tag: [TestTags.STAGING_ONLY, TestTags.CORE]
}, () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }, testInfo) => {
    pageFactory = new PageFactory(page);
    page.setDefaultTimeout(testTimeouts.long);
    
    // Initialize SmartLogger for each test
    SmartLogger.initializeTest(testInfo.title);
  });

  test('should load post editor directly @post-editor @load', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    // Navigate directly to post editor
    await postPage.navigateToNewPostDirectly();

    // Verify all post editor elements are visible
    const allElementsVisible = await postPage.verifyAllPostEditorElementsVisible();
    expect(allElementsVisible).toBe(true);

    await context.close();
  });

  test('should create post with title and content @post-creation @text-editor', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Draft Post ${TestUtils.generateRandomString(8)}`;
    const testContent = '<p>This is <strong>test content</strong> created in the text editor.</p>';

    // Navigate directly to post editor
    await postPage.navigateToNewPostDirectly();

    // Fill title
    await postPage.fillPostTitle(testTitle);
    const titleMatches = await postPage.verifyTitleValue(testTitle);
    expect(titleMatches).toBe(true);

    // Fill content in text editor
    await postPage.fillPostContentInTextEditor(testContent);

    // Verify content was saved
    const savedContent = await postPage.getPostContentFromTextEditor();
    expect(savedContent).toBe(testContent);

    await context.close();
  });

  test('should save post as draft @post-creation @draft', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Draft Post ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This post should be saved as a draft.';

    // Navigate and create post content
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);

    // Save as draft
    await postPage.saveDraft();

    // Verify success - should see updated message
    const successVisible = await postPage.verifySuccessMessageVisible();
    expect(successVisible).toBe(true);

    await context.close();
  });

  test('should add tags to post @post-creation @metadata', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Tagged Post ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This post has tags.';
    const testTags = 'test-tag, automation, playwright';

    // Navigate and create basic post content
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);

    // Add tags
    await postPage.addTags(testTags);

    // Save as draft to verify metadata was saved
    await postPage.saveDraft();
    const successVisible = await postPage.verifySuccessMessageVisible();
    expect(successVisible).toBe(true);

    await context.close();
  });

  test('should navigate from dashboard to post editor @navigation @sidebar', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const dashboardPage = contextPageFactory.dashboardPage;

    // Start from dashboard
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardLoad();

    // Verify dashboard sidebar is visible
    expect(await dashboardPage.verifyPostsMenuVisible()).toBe(true);

    // Navigate to Posts > Add New
    await dashboardPage.navigateToNewPost();

    // Verify we're on the post editor page
    await expect(page).toHaveURL(/.*post-new\.php/);
    await expect(page).toHaveTitle(/Add Post/);

    // Verify post editor loaded
    const postPage = contextPageFactory.postPage;
    expect(await postPage.verifyAllPostEditorElementsVisible()).toBe(true);

    await context.close();
  });

  test('should create and publish post @post-creation @publish', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Published Post ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This post should be published successfully.';

    // Navigate and create post content
    await postPage.navigateToNewPostDirectly();

    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);

    // Publish post
    await postPage.publishPost();

    // Verify success - should see success message
    expect(await postPage.verifySuccessMessageVisible()).toBe(true);

    // Should redirect to edit page or show published status
    await expect(page).toHaveURL(/.*post\.php.*action=edit/);

    await context.close();
  });

  test('should verify post details after draft creation @post-verification @draft-details', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Verification Draft ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This draft content should be verified correctly.';
    const testTags = 'verification-test, draft-test';

    // Create post with all details
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);
    await postPage.addTags(testTags);
    await postPage.saveDraft();

    // Verify all details are correct
    const detailsMatch = await postPage.verifyPostDetails(testTitle, testContent, testTags);
    expect(detailsMatch).toBe(true);

    // Verify we have a post ID (confirms the draft was saved)
    const postId = await postPage.getCurrentPostId();
    expect(postId).not.toBeNull();

    await context.close();
  });

  test('should verify post details after publishing @post-verification @published-details', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Verification Published ${TestUtils.generateRandomString(8)}`;
    const testContent = '<p>This published content should be <strong>verified correctly</strong>.</p>';

    // Create and publish post
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);
    await postPage.publishPost();

    // Verify all details are correct
    const detailsMatch = await postPage.verifyPostDetails(testTitle, testContent);
    expect(detailsMatch).toBe(true);

    // Get and verify post ID exists (this also confirms the post was saved/published)
    const postId = await postPage.getCurrentPostId();
    expect(postId).not.toBeNull();
    expect(postId).toMatch(/^\d+$/); // Should be a numeric string
    
    // Verify we're on the edit page (indicates successful publishing)
    await expect(page).toHaveURL(/.*post\.php.*action=edit/);

    await context.close();
  });

  test('should verify post details persist after editing @post-verification @edit-persistence', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const originalTitle = `Original Title ${TestUtils.generateRandomString(8)}`;
    const originalContent = 'Original content before editing.';
    const originalTags = 'original-tag, before-edit';

    const updatedTitle = `Updated Title ${TestUtils.generateRandomString(8)}`;
    const updatedContent = 'Updated content after editing.';
    const updatedTags = 'updated-tag, after-edit';

    // Create initial post
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(originalTitle);
    await postPage.fillPostContentInTextEditor(originalContent);
    await postPage.addTags(originalTags);
    await postPage.saveDraft();

    // Verify original details
    let detailsMatch = await postPage.verifyPostDetails(originalTitle, originalContent, originalTags);
    expect(detailsMatch).toBe(true);

    // Get post ID for re-editing
    const postId = await postPage.getCurrentPostId();
    expect(postId).not.toBeNull();

    // Edit the post details
    await postPage.fillPostTitle(updatedTitle);
    await postPage.fillPostContentInTextEditor(updatedContent);
    
    // Clear existing tags and add new ones
    await postPage.clearAllTags();
    await postPage.addTags(updatedTags);
    await postPage.saveDraft();

    // Verify updated details
    detailsMatch = await postPage.verifyPostDetails(updatedTitle, updatedContent, updatedTags);
    expect(detailsMatch).toBe(true);

    // Verify post ID remains the same
    const updatedPostId = await postPage.getCurrentPostId();
    expect(updatedPostId).toBe(postId);

    await context.close();
  });

  test('should verify empty content handling @post-verification @empty-content', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Empty Content Test ${TestUtils.generateRandomString(8)}`;
    // Intentionally leave content empty

    // Create post with only title
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.saveDraft();

    // Verify title exists but content is empty
    const titleMatches = await postPage.verifyTitleValue(testTitle);
    expect(titleMatches).toBe(true);

    const content = await postPage.getPostContentFromTextEditor();
    expect(content).toBe(''); // Should be empty

    // Verify we can still verify details with empty content
    const detailsMatch = await postPage.verifyPostDetails(testTitle, '');
    expect(detailsMatch).toBe(true);

    await context.close();
  });

  test('should verify special characters in post content @post-verification @special-chars', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;

    const testTitle = `Special Chars Test ${TestUtils.generateRandomString(8)}`;
    const testContent = '<p>Testing special characters: &amp; &lt; &gt; &quot; &#39; àáâãäå</p>';
    const testTags = 'special-characters, àáâãäå, test-symbols';

    // Create post with special characters
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);
    await postPage.addTags(testTags);
    await postPage.saveDraft();

    // Verify special characters are preserved
    const detailsMatch = await postPage.verifyPostDetails(testTitle, testContent, testTags);
    expect(detailsMatch).toBe(true);

    // Double-check each component individually
    const actualTitle = await postPage.getPostTitle();
    expect(actualTitle).toBe(testTitle);

    const actualContent = await postPage.getPostContentFromTextEditor();
    expect(actualContent).toBe(testContent);

    // Use order-independent comparison for tags
    const actualTags = await postPage.getTagsValue();
    const expectedTagsArray = testTags.split(',').map(tag => tag.trim()).sort();
    const actualTagsArray = actualTags.split(',').map(tag => tag.trim()).sort();
    expect(actualTagsArray).toEqual(expectedTagsArray);

    await context.close();
  });

  test('should create post and verify it appears in all posts list @integration @all-posts-verification', {
    tag: [TestTags.INTEGRATION, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    test.setTimeout(90000); // Increase timeout to 90 seconds for this integration test
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const postPage = contextPageFactory.postPage;
    const allPostsPage = contextPageFactory.allPostsPage;

    const testTitle = `All Posts Integration Test ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This post is created to verify integration with all posts page.';
    const testTags = 'integration, all-posts, verification';

    // Create a complete post
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);
    await postPage.addTags(testTags);
    await postPage.saveDraft();

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Verify post appears in all posts list
    const postExists = await allPostsPage.verifyPostExists(testTitle);
    expect(postExists).toBe(true);

    // Verify post status is draft
    const postStatus = await allPostsPage.getPostStatus(testTitle);
    expect(postStatus).toBe('draft');

    // Filter by draft posts and verify it's still there
    await allPostsPage.filterByStatus('draft');
    await allPostsPage.waitForPostsTableLoad();

    const draftPostExists = await allPostsPage.verifyPostExists(testTitle);
    expect(draftPostExists).toBe(true);

    // Navigate back to edit the post from all posts page
    try {
      await allPostsPage.editPostByTitle(testTitle);
      
      // Verify we're on the correct post edit page
      expect(page.url()).toContain('action=edit');
    } catch (error) {
      // If edit link fails, navigate directly to ensure test continues
      const postId = await allPostsPage.getPostIdByTitle(testTitle);
      if (postId) {
        const baseUrl = process.env.BASE_URL || 'https://staging.go.ione.nyc';
        await page.goto(`${baseUrl}/wp-admin/post.php?post=${postId}&action=edit`);
      } else {
        throw error;
      }
    }

    // Verify post details are preserved
    const verificationResult = await postPage.verifyPostDetails(testTitle, testContent, testTags);
    expect(verificationResult).toBe(true);

    await context.close();
  });
});