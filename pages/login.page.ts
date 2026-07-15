import { expect, Page } from '@playwright/test';
import { loginLocators } from '../locators/login.locator';
import { TIMEOUT } from '../utils/timeout';

export class LoginPage {
  constructor(private page: Page) {}

  async navigateToLogin(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string): Promise<void> {
    await this.navigateToLogin();
    await this.page.getByRole('textbox', { name: loginLocators.form.emailInput.name }).fill(email);
    await this.page.getByRole('textbox', { name: loginLocators.form.passwordInput.name }).fill(password);
    await this.page.getByRole('button', { name: loginLocators.form.loginButton.name }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async logout(): Promise<void> {
    const profileBtn = this.page.getByRole('button', { name: loginLocators.nav.profileDropdown.name });
    await profileBtn.click();
    await this.page.waitForTimeout(TIMEOUT.TINY);

    const logoutBtn = this.page.getByRole('button', { name: loginLocators.nav.logoutButton.name });
    await logoutBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(TIMEOUT.SHORT);
  }

  async isLoginPageVisible(): Promise<boolean> {
    return this.page.getByRole('button', { name: loginLocators.form.loginButton.name })
      .isVisible({ timeout: TIMEOUT.MEDIUM }).catch(() => false);
  }

  async isLoggedIn(): Promise<boolean> {
    return this.page.getByRole('button', { name: loginLocators.nav.profileDropdown.name })
      .isVisible({ timeout: TIMEOUT.SHORT }).catch(() => false);
  }
}
