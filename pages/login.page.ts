import { Page } from '@playwright/test';

import { BasePage } from './base.page';
import elementHelper from '../utils/element.helper';
/* /wp-login.php */
class LoginPage extends BasePage {
  constructor(page: Page) {
    const element = '#loginform';
    super(page, element);
  }

  get username(): string {
    const element = 'input[name="log"], #user_login';
    return element;
  }

  get password(): string {
    const element = 'input[name="pwd"], #user_pass';
    return element;
  }

  get loginBtn(): string {
    const element = 'button[type="submit"], #wp-submit';
    return element;
  }

  get loginWithUsernameBtn(): string {
    const element = 'a[href*="skip_sso"], .login-link-username, .wp-login-username';
    return element;
  }

  async clickLoginWithUsername(): Promise<void> {
    try {
      // Try multiple approaches to find and click the login with username button
      const selectors = [
        'a[href*="skip_sso"]',
        '.login-link-username', 
        '.wp-login-username',
        'text=Log in',
        'text="Log in with username"',
        'text="Continue with username"'
      ];
      
      for (const selector of selectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            await element.click();
            console.log(`Successfully clicked login button with selector: ${selector}`);
            return;
          }
        } catch (err) {
          // Continue to next selector
        }
      }
      
      // If no button found, try to make the form visible by clicking somewhere on the page
      console.log('No login with username button found, trying to activate form');
      
    } catch (error) {
      // Optional step - if button doesn't exist, continue with normal login
      console.log('Login with username button not found, proceeding with direct login');
    }
  }

  async clickLogin(): Promise<void> {
    await elementHelper.clickElement(this.page, this.loginBtn);
    // await elementHelper.waitForButtonEnabled(this.page, this.signInButton);
  }
  async enterUsername(username: string): Promise<void> {
    // Wait a moment for any potential form animations
    await this.page.waitForTimeout(500);
    
    // Force the interaction even if the element is hidden initially
    const usernameField = this.page.locator(this.username).first();
    await usernameField.fill(username, { force: true });
  }
  
  async enterPassword(password: string): Promise<void> {
    const passwordField = this.page.locator(this.password).first();
    await passwordField.fill(password, { force: true });
  }
}

export default LoginPage;
