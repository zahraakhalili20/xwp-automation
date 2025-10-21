/**
 * Category Test Data Fixture
 * Contains test data for WordPress category management tests
 * Following AI_AGENT_INSTRUCTIONS patterns for test data organization
 * 
 * @author XWP Platform Team
 */

import { TestUtils } from '../utils/test.utils';

export const categoryTestData = {
  // Basic category data
  basicCategory: {
    name: 'Test Category',
    slug: 'test-category',
    description: 'This is a test category for automation testing'
  },

  // Dynamic category data with unique identifiers
  dynamicCategory: () => ({
    name: `Automation Category ${TestUtils.generateRandomString(6)}`,
    slug: `auto-category-${TestUtils.generateRandomString(6).toLowerCase()}`,
    description: `Test category created by automation at ${new Date().toISOString()}`
  }),

  // Category with parent relationship
  parentCategory: {
    name: 'Parent Category',
    slug: 'parent-category',
    description: 'Parent category for testing hierarchy'
  },

  childCategory: () => ({
    name: `Child Category ${TestUtils.generateRandomString(6)}`,
    slug: `child-category-${TestUtils.generateRandomString(6).toLowerCase()}`,
    description: 'Child category for testing hierarchy',
    parent: 'Parent Category'
  }),

  // Categories for bulk operations
  bulkCategories: () => [
    {
      name: `Bulk Test 1 ${TestUtils.generateRandomString(6)}`,
      slug: `bulk-test-1-${TestUtils.generateRandomString(6).toLowerCase()}`,
      description: 'First category for bulk operations testing'
    },
    {
      name: `Bulk Test 2 ${TestUtils.generateRandomString(6)}`,
      slug: `bulk-test-2-${TestUtils.generateRandomString(6).toLowerCase()}`,
      description: 'Second category for bulk operations testing'
    },
    {
      name: `Bulk Test 3 ${TestUtils.generateRandomString(6)}`,
      slug: `bulk-test-3-${TestUtils.generateRandomString(6).toLowerCase()}`,
      description: 'Third category for bulk operations testing'
    }
  ],

  // Categories with special characters
  specialCharCategory: () => ({
    name: `Special Chars Test àáâãäå ${TestUtils.generateRandomString(6)}`,
    slug: `special-chars-test-${TestUtils.generateRandomString(6).toLowerCase()}`,
    description: 'Category with special characters: àáâãäå çñü ñ & @#$%'
  }),

  // Long content category
  longContentCategory: () => ({
    name: `Long Name Test Category ${TestUtils.generateRandomString(6)}`.substring(0, 100), // WordPress limit
    slug: `long-name-test-${TestUtils.generateRandomString(6).toLowerCase()}`,
    description: 'This is a very long description that tests how the category form handles extended content. '.repeat(5)
  }),

  // Empty/minimal category
  minimalCategory: () => ({
    name: `Minimal ${TestUtils.generateRandomString(6)}`,
    slug: '',
    description: ''
  }),

  // Update data for edit tests
  updateData: {
    newName: 'Updated Category Name',
    newSlug: 'updated-category-slug',
    newDescription: 'This category has been updated by automation testing'
  },

  // Search terms
  searchTerms: {
    existing: 'Test',
    nonExisting: 'NonExistentCategory12345',
    partial: 'Auto',
    specialChars: 'àáâãäå'
  },

  // WordPress default categories (might exist on fresh installs)
  defaultCategories: {
    uncategorized: 'Uncategorized'
  }
};

// Category validation rules (WordPress limits and constraints)
export const categoryValidation = {
  nameMaxLength: 200,
  slugMaxLength: 200,
  descriptionMaxLength: 2000,
  reservedSlugs: ['uncategorized', 'category', 'tag'],
  allowedCharacters: /^[a-zA-Z0-9\s\-_.àáâãäåçñüÀÁÂÃÄÅÇÑÜ]+$/
};

// Test scenarios configuration
export const categoryTestScenarios = {
  // Timeouts for different operations
  timeouts: {
    create: 10000,
    edit: 10000,
    delete: 5000,
    search: 5000,
    bulkAction: 15000
  },

  // Expected success messages (WordPress standard)
  successMessages: {
    created: 'Category added.',
    updated: 'Category updated.',
    deleted: 'Category deleted.'
  },

  // Expected error scenarios
  errorScenarios: {
    duplicateName: 'A category with the name provided already exists.',
    invalidSlug: 'The slug must be unique.',
    emptyName: 'The name field is required.'
  }
};