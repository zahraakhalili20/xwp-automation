import { TestUser, UserRole, TestData } from '../types/base.types';

/**
 * Test users fixture data
 */
export const testUsers: Record<string, TestUser> = {
  admin: {
    username: 'qa_administrator',
    password: 'qa_administrator',
    email: 'admin@xwp.test',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User'
  },
  editor: {
    username: 'editor',
    password: 'editor123',
    email: 'editor@xwp.test',
    role: UserRole.EDITOR,
    firstName: 'Editor',
    lastName: 'User'
  },
  author: {
    username: 'author',
    password: 'author123',
    email: 'author@xwp.test',
    role: UserRole.AUTHOR,
    firstName: 'Author',
    lastName: 'User'
  },
  subscriber: {
    username: 'subscriber',
    password: 'subscriber123',
    email: 'subscriber@xwp.test',
    role: UserRole.SUBSCRIBER,
    firstName: 'Subscriber',
    lastName: 'User'
  },
  guest: {
    username: 'guest',
    password: 'guest123',
    email: 'guest@xwp.test',
    role: UserRole.GUEST,
    firstName: 'Guest',
    lastName: 'User'
  }
};

/**
 * Test URLs fixture data
 */
export const testUrls = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings'
};

/**
 * Test timeouts fixture data
 */
export const testTimeouts = {
  short: 5000,
  medium: 15000,
  long: 30000,
  extraLong: 60000
};

/**
 * Complete test data fixture
 */
export const testData: TestData = {
  users: testUsers,
  urls: testUrls,
  timeouts: testTimeouts
};