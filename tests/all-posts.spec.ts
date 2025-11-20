/**
 * All Posts Page Tests for staging.go.ione.nyc
 * Tests WordPress all posts page functionality (edit.php) using saved session
 * Following AI_AGENT_INSTRUCTIONS patterns with PageFactory and page objects
 * 
 * Tests cover: posts list navigation, search functionality, filtering, 
 * post management actions, and integration with post creation flows
 * 
 * Note: Uses saved session from .auth/staging-ione.json - login handled separately
 * Based on live site inspection of staging.go.ione.nyc/wp-admin/edit.php
 * 
 * @author XWP Platform Team
 */

import { test, expect } from '@playwright/test';
import PageFactory from '@pages/page.factory';
import { TestTags, TagCombinations } from '@fixtures/test-tags.fixture';
import { testTimeouts } from '@fixtures/test-data.fixture';
import { TestUtils } from '@utils/test.utils';
import { SmartLogger } from '../utils/smart-logger.utils';

test.describe('All Posts Page Tests', {
  tag: [TestTags.STAGING_ONLY, TestTags.CORE]
}, () => {
  let pageFactory: PageFactory;

  test.beforeEach(async ({ page }, testInfo) => {
    pageFactory = new PageFactory(page);
    page.setDefaultTimeout(testTimeouts.long);
    
    // Initialize SmartLogger for each test
    SmartLogger.initializeTest(testInfo.title);
  });

  test('should load all posts page successfully @all-posts @load', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;

    // Navigate directly to all posts page
    await allPostsPage.navigate();

    // Verify page is loaded
    const isLoaded = await allPostsPage.isAllPostsPageLoaded();
    expect(isLoaded).toBe(true);

    // Verify page title
    const pageTitle = await allPostsPage.getPageTitle();
    expect(pageTitle).toContain('Posts');

    await context.close();
  });

  test('should navigate from dashboard to all posts page @navigation @dashboard-integration', {
    tag: [TestTags.NAVIGATION, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const dashboardPage = contextPageFactory.dashboardPage;
    const allPostsPage = contextPageFactory.allPostsPage;

    // Start from dashboard
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardLoad();

    // Navigate to Posts page via sidebar
    await dashboardPage.navigateToPosts();

    // Verify we're on all posts page
    const isLoaded = await allPostsPage.isAllPostsPageLoaded();
    expect(isLoaded).toBe(true);

    // Verify URL contains edit.php
    expect(page.url()).toContain('edit.php');

    await context.close();
  });

  test('should navigate to add new post from all posts page @navigation @add-new', {
    tag: [TestTags.NAVIGATION, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Click "Add New" button
    await allPostsPage.navigateToAddNew();

    // Verify we're on post editor page
    expect(page.url()).toContain('post-new.php');

    await context.close();
  });

  test('should display posts list and retrieve post titles @posts-list @content', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Get all post titles
    const postTitles = await allPostsPage.getAllPostTitles();
    expect(postTitles.length).toBeGreaterThan(0);

    // Verify titles are not empty
    for (const title of postTitles) {
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    }

    // Get total post count
    const totalCount = await allPostsPage.getTotalPostCount();
    expect(totalCount).toBe(postTitles.length);

    await context.close();
  });

  test('should filter posts by status @posts-filtering @status', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this test
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Get initial all posts count
    const allPostsCount = await allPostsPage.getTotalPostCount();

    // Filter by published posts
    await allPostsPage.filterByStatus('published');
    await allPostsPage.waitForPostsTableLoad();

    const publishedCount = await allPostsPage.getTotalPostCount();
    expect(publishedCount).toBeGreaterThanOrEqual(0);

    // Filter by draft posts
    await allPostsPage.filterByStatus('draft');
    await allPostsPage.waitForPostsTableLoad();

    const draftCount = await allPostsPage.getTotalPostCount();
    expect(draftCount).toBeGreaterThanOrEqual(0);

    // Return to all posts
    await allPostsPage.filterByStatus('all');
    await allPostsPage.waitForPostsTableLoad();

    const finalAllCount = await allPostsPage.getTotalPostCount();
    expect(finalAllCount).toBe(allPostsCount);

    await context.close();
  });

  test('should search for posts by title @posts-search @functionality', {
    tag: [TestTags.CORE, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Get first post title to search for
    const allTitles = await allPostsPage.getAllPostTitles();
    
    if (allTitles.length > 0) {
      const searchTerm = allTitles[0].split(' ')[0]; // Use first word of first title
      
      // Search for the term
      await allPostsPage.searchPosts(searchTerm);
      await allPostsPage.waitForPostsTableLoad();
      
      // Verify search results
      const searchResults = await allPostsPage.getAllPostTitles();
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      
      // At least one result should contain the search term (case insensitive)
      const hasMatchingResult = searchResults.some(title => 
        title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(hasMatchingResult).toBe(true);
    }

    await context.close();
  });

  test('should create post and verify it appears in all posts list @integration @post-creation-flow', {
    tag: [TestTags.INTEGRATION, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;
    const postPage = contextPageFactory.postPage;

    const testTitle = `Integration Test Post ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This post was created in an integration test to verify all posts page functionality.';

    // Create a new post
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);
    await postPage.saveDraft();

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Verify the post appears in the list
    const postExists = await allPostsPage.verifyPostExists(testTitle);
    expect(postExists).toBe(true);

    // Verify post status is draft
    const postStatus = await allPostsPage.getPostStatus(testTitle);
    expect(postStatus).toBe('draft');

    // Verify we can find the post in the list
    const allTitles = await allPostsPage.getAllPostTitles();
    const foundPost = allTitles.find(title => title === testTitle);
    expect(foundPost).toBe(testTitle);

    await context.close();
  });

  test('should edit post from all posts page @integration @post-editing-flow', {
    tag: [TestTags.INTEGRATION, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;
    const postPage = contextPageFactory.postPage;

    const originalTitle = `Edit Flow Test ${TestUtils.generateRandomString(8)}`;
    const originalContent = 'Original content for edit flow test.';
    const updatedTitle = `Updated Edit Flow Test ${TestUtils.generateRandomString(8)}`;

    // Create a post first
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(originalTitle);
    await postPage.fillPostContentInTextEditor(originalContent);
    await postPage.saveDraft();

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Verify post exists
    const postExists = await allPostsPage.verifyPostExists(originalTitle);
    expect(postExists).toBe(true);

    // Edit the post via all posts page
    await allPostsPage.editPostByTitle(originalTitle);

    // Verify we're on the edit page
    expect(page.url()).toContain('action=edit');

    // Update the post title
    await postPage.fillPostTitle(updatedTitle);
    await postPage.saveDraft();

    // Return to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Verify updated post exists with new title
    const updatedPostExists = await allPostsPage.verifyPostExists(updatedTitle);
    expect(updatedPostExists).toBe(true);

    // Verify original title no longer exists
    const originalStillExists = await allPostsPage.verifyPostExists(originalTitle);
    expect(originalStillExists).toBe(false);

    await context.close();
  });

  test('should verify publish post workflow integration @integration @publish-flow', {
    tag: [TestTags.INTEGRATION, TestTags.STAGING_ONLY]
  }, async ({ browser }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this integration test
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staging-ione.json'
    });
    const page = await context.newPage();
    const contextPageFactory = new PageFactory(page);
    const allPostsPage = contextPageFactory.allPostsPage;
    const postPage = contextPageFactory.postPage;

    const testTitle = `Publish Flow Test ${TestUtils.generateRandomString(8)}`;
    const testContent = 'This post will be published to test the workflow integration.';

    // Create and publish a post
    await postPage.navigateToNewPostDirectly();
    await postPage.fillPostTitle(testTitle);
    await postPage.fillPostContentInTextEditor(testContent);
    await postPage.publishPost();

    // Navigate to all posts page
    await allPostsPage.navigate();
    await allPostsPage.waitForPostsTableLoad();

    // Verify post exists
    const postExists = await allPostsPage.verifyPostExists(testTitle);
    expect(postExists).toBe(true);

    // Verify post status is published
    const postStatus = await allPostsPage.getPostStatus(testTitle);
    expect(postStatus).toBe('published');

    // Filter by published posts and verify it's still there
    await allPostsPage.filterByStatus('published');
    await allPostsPage.waitForPostsTableLoad();

    const publishedPostExists = await allPostsPage.verifyPostExists(testTitle);
    expect(publishedPostExists).toBe(true);

    await context.close();
  });

});