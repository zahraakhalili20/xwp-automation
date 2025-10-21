/**
 * Login Feature Test Data Fixture
 * Contains all test data for login and authentication functionality
 */

export interface LoginTestData {
  username: string;
  password: string;
  expectedUrl?: string;
  expectedError?: string;
  description: string;
}

export interface LoginValidationData {
  fieldName: string;
  inputValue: string;
  expectedValidation: boolean;
  expectedMessage?: string;
}

/**
 * Valid login scenarios
 */
export const loginData = {
  validAdmin: {
    username: process.env.ADMIN_USERNAME || 'qa_administrator',
    password: process.env.ADMIN_PASSWORD || 'qa_administrator', 
    expectedUrl: '/wp-admin/',
    description: 'Valid admin user login credentials'
  } as LoginTestData,

  validEditor: {
    username: process.env.EDITOR_USERNAME || 'editor',
    password: process.env.EDITOR_PASSWORD || 'editor123',
    expectedUrl: '/wp-admin/',
    description: 'Valid editor user login credentials'
  } as LoginTestData,

  // Invalid scenarios
  invalidCredentials: {
    username: 'nonexistent_user',
    password: 'wrong_password',
    expectedError: 'Invalid username or password',
    description: 'Invalid credentials should show error'
  } as LoginTestData,

  emptyUsername: {
    username: '',
    password: 'any_password',
    expectedError: 'Please enter your username',
    description: 'Empty username should show validation error'
  } as LoginTestData,

  emptyPassword: {
    username: 'any_username',
    password: '',
    expectedError: 'Please enter your password',
    description: 'Empty password should show validation error'
  } as LoginTestData,

  // Security test scenarios
  sqlInjection: {
    username: "admin'; DROP TABLE users; --",
    password: 'password',
    expectedError: 'Invalid username or password',
    description: 'SQL injection attempt should be blocked'
  } as LoginTestData,

  xssAttempt: {
    username: '<script>alert("xss")</script>',
    password: 'password',
    expectedError: 'Invalid username or password', 
    description: 'XSS attempt should be sanitized'
  } as LoginTestData
};

/**
 * Field validation test data
 */
export const loginValidation = {
  username: {
    maxLength: {
      fieldName: 'username',
      inputValue: 'a'.repeat(256), // Assuming 255 char limit
      expectedValidation: false,
      expectedMessage: 'Username too long'
    } as LoginValidationData,

    specialCharacters: {
      fieldName: 'username', 
      inputValue: 'user@domain.com',
      expectedValidation: true,
      expectedMessage: 'Email format should be accepted'
    } as LoginValidationData
  },

  password: {
    maxLength: {
      fieldName: 'password',
      inputValue: 'p'.repeat(256),
      expectedValidation: false,
      expectedMessage: 'Password too long'
    } as LoginValidationData,

    minLength: {
      fieldName: 'password',
      inputValue: '1',
      expectedValidation: true, // WordPress typically accepts short passwords
      expectedMessage: 'Short password should be accepted'
    } as LoginValidationData
  }
};

/**
 * Login flow test scenarios
 */
export const loginFlows = {
  normalFlow: {
    steps: [
      'Navigate to login page',
      'Enter valid credentials', 
      'Click login button',
      'Verify dashboard loads',
      'Verify user is authenticated'
    ],
    expectedDuration: 5000, // 5 seconds max
    description: 'Standard login flow should complete quickly'
  },

  redirectFlow: {
    initialUrl: '/wp-admin/posts.php',
    expectedRedirect: '/wp-login.php',
    finalUrl: '/wp-admin/posts.php',
    description: 'User should be redirected to original page after login'
  },

  logoutFlow: {
    steps: [
      'Login successfully',
      'Navigate to logout',
      'Confirm logout',
      'Verify redirect to login page',
      'Verify session is cleared'
    ],
    description: 'Logout should clear session and redirect properly'
  }
};

/**
 * Error message mappings
 */
export const loginErrors = {
  INVALID_CREDENTIALS: 'ERROR: The username or password you entered is incorrect.',
  EMPTY_USERNAME: 'ERROR: The username field is empty.',
  EMPTY_PASSWORD: 'ERROR: The password field is empty.',
  ACCOUNT_LOCKED: 'ERROR: This account has been locked.',
  TOO_MANY_ATTEMPTS: 'ERROR: Too many failed login attempts.',
  MAINTENANCE_MODE: 'ERROR: Site is temporarily unavailable.'
};

/**
 * Helper function to get environment-specific login data
 */
export function getLoginDataForEnvironment(): LoginTestData {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return loginData.validAdmin; // Use production credentials
    case 'staging':
      return loginData.validAdmin; // Use staging credentials
    default:
      return loginData.validAdmin; // Use development credentials
  }
}