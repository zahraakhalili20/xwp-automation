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
    const element = '#user_login';
    return element;
  }

  get password(): string {
    const element = '#user_pass';
    return element;
  }

  get loginBtn(): string {
    const element = '#wp-submit';
    return element;
  }

  async clickLogin(): Promise<void> {
    await elementHelper.clickElement(this.page, this.loginBtn);
    // await elementHelper.waitForButtonEnabled(this.page, this.signInButton);
  }
  async enterUsername(username: string): Promise<void> {
    await elementHelper.enterValue(this.page, this.username, username);
  }
  async enterPassword(password: string): Promise<void> {
    await elementHelper.enterValue(this.page, this.password, password);
  }
}

export default LoginPage;
