import { test, expect } from '@playwright/test';

test.describe('Movie Review & Finder E2E Automation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL before each test
    await page.goto('/');
  });

  test('should display the correct login header and subtitle', async ({ page }) => {
    // Verify header exists and says "Login for Movie Review & Finder"
    const header = page.locator('h1');
    await expect(header).toContainText('Login for Movie Review & Finder');
    
    // Ensure the older "SQLite Profile Engine" title and "Secure Database Credentials Hub" are removed
    await expect(page.locator('text=SQLite Profile Engine')).not.toBeVisible();
    await expect(page.locator('text=Secure Database Credentials Hub')).not.toBeVisible();
  });

  test('should fail authentication on incorrect credentials', async ({ page }) => {
    // Input incorrect credentials
    await page.getByPlaceholder('username').fill('nonexistentuser');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    // Click Sign In
    const signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Verify error feedback
    const errorMessage = page.locator('div:has-text("User does not exist")');
    await expect(errorMessage).toBeVisible();
  });

  test('should toggle tabs between Sign In and Create Account', async ({ page }) => {
    // Sign In should be selected by default, verify Display Name field is not visible
    await expect(page.getByPlaceholder('E.g. Elon Musk')).not.toBeVisible();

    // Switch to Create Account
    const createAccountTab = page.getByRole('button', { name: 'Create Account' });
    await createAccountTab.click();

    // Verify fields for signup appear
    await expect(page.getByPlaceholder('E.g. Elon Musk')).toBeVisible();
    await expect(page.getByPlaceholder('name@email.com')).toBeVisible();

    // Switch back to Sign In
    const signInTab = page.getByRole('button', { name: 'Sign In', exact: true });
    await signInTab.click();
    await expect(page.getByPlaceholder('E.g. Elon Musk')).not.toBeVisible();
  });

  test('should pre-fill sandbox accounts and successfully log in', async ({ page }) => {
    // Click on the administrator sandbox quick-credentials button
    const adminSandboxButton = page.locator('button:has-text("admin (Admin)")');
    await expect(adminSandboxButton).toBeVisible();
    await adminSandboxButton.click();

    // Verify that username and password got filled
    await expect(page.getByPlaceholder('username')).toHaveValue('admin');

    // Click Sign In
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Verify we have successfully logged in by checking the main header "Movie Review & Finder"
    const dashboardHeader = page.locator('h1:has-text("Movie Review & Finder")');
    await expect(dashboardHeader).toBeVisible();

    // Verify that "Catalog Collection" section is present
    await expect(page.locator('text=Catalog Collection')).toBeVisible();

    // Verify that the obsolete header "CineManage" and subtitle are removed
    await expect(page.locator('text=CineManage')).not.toBeVisible();
    await expect(page.locator('text=Secure SQLite persistence layer active')).not.toBeVisible();
  });

  test('should allow a logged-in user to view the list of movies and profile', async ({ page }) => {
    // Login
    await page.locator('button:has-text("admin (Admin)")').click();
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Wait for catalog collection view
    await expect(page.locator('text=Catalog Collection')).toBeVisible();

    // Navigate to user profile tab
    const profileTab = page.getByRole('button', { name: 'User Profile' });
    await expect(profileTab).toBeVisible();
    await profileTab.click();

    // Verify user profile details are displayed
    await expect(page.locator('text=Profile Details')).toBeVisible();
    await expect(page.locator('text=Administrator')).toBeVisible();

    // Navigate back to Catalog Collection
    await page.getByRole('button', { name: 'Movie Catalog' }).click();
    await expect(page.locator('text=Catalog Collection')).toBeVisible();
  });
});
