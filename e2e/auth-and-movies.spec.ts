import { test, expect } from '@playwright/test';

test.describe('Movie Finder & Review E2E Automation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL before each test
    await page.goto('/');

    // Wait for the initial loading screen to disappear (resolved state)
    await Promise.race([
      page.locator('#btn-prefill-admin').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.locator('#btn-logout').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);

    // Self-healing: If a previous test left an active session, click Logout to clean the state
    const logoutBtn = page.locator('#btn-logout');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      // Ensure we are back on the login screen
      await expect(page.locator('h1')).toContainText('Login for Movie Finder & Review');
    }
  });

  test('should display the correct login header and subtitle', async ({ page }) => {
    // Verify header exists and says "Login for Movie Finder & Review"
    const header = page.locator('h1');
    await expect(header).toContainText('Login for Movie Finder & Review');
    
    // Ensure the older "SQLite Profile Engine" title and "Secure Database Credentials Hub" are removed
    await expect(page.locator('text=SQLite Profile Engine')).not.toBeVisible();
    await expect(page.locator('text=Secure Database Credentials Hub')).not.toBeVisible();
  });

  test('should fail authentication on incorrect credentials', async ({ page }) => {
    // Input incorrect credentials
    await page.getByPlaceholder('username').fill('nonexistentuser');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    // Click Sign In (submit button of the form)
    const signInButton = page.locator('form button[type="submit"]');
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Verify error feedback
    const errorMessage = page.locator('div.text-red-300:has-text("User does not exist")');
    await expect(errorMessage).toBeVisible();
  });

  test('should toggle tabs between Sign In and Create Account', async ({ page }) => {
    // Sign In should be selected by default, verify Display Name field is not visible
    await expect(page.getByPlaceholder('E.g. Elon Musk')).not.toBeVisible();

    // Switch to Create Account
    const createAccountTab = page.locator('div[role="tablist"] button').filter({ hasText: 'Create Account' });
    await createAccountTab.click();

    // Verify fields for signup appear
    await expect(page.getByPlaceholder('E.g. Elon Musk')).toBeVisible();
    await expect(page.getByPlaceholder('name@email.com')).toBeVisible();

    // Switch back to Sign In
    const signInTab = page.locator('div[role="tablist"] button').filter({ hasText: 'Sign In' });
    await signInTab.click();
    await expect(page.getByPlaceholder('E.g. Elon Musk')).not.toBeVisible();
  });

  test('should pre-fill sandbox accounts and successfully log in', async ({ page }) => {
    // Click on the administrator sandbox quick-credentials button
    const adminSandboxButton = page.locator('button:has-text("@admin")');
    await expect(adminSandboxButton).toBeVisible();
    await adminSandboxButton.click();

    // Verify that username and password got filled
    await expect(page.getByPlaceholder('username')).toHaveValue('admin');

    // Click Sign In submit button
    await page.locator('form button[type="submit"]').click();

    // Verify we have successfully logged in by checking the main header "Movie Finder & Review"
    const dashboardHeader = page.locator('h1:has-text("Movie Finder & Review")');
    await expect(dashboardHeader).toBeVisible();

    // Verify that "Movie Finder & Review Database" section is present
    await expect(page.locator('text=Movie Finder & Review Database')).toBeVisible();

    // Verify that the obsolete header "CineManage" and subtitle are removed
    await expect(page.locator('text=CineManage')).not.toBeVisible();
    await expect(page.locator('text=Secure SQLite persistence layer active')).not.toBeVisible();
  });

  test('should allow a logged-in user to view the list of movies and profile', async ({ page }) => {
    // Login using pre-fill
    await page.locator('button:has-text("@admin")').click();
    await page.locator('form button[type="submit"]').click();

    // Wait for catalog collection view
    await expect(page.locator('text=Movie Finder & Review Database')).toBeVisible();

    // Navigate to user profile tab
    const profileTab = page.getByRole('button', { name: 'Profile & Logs' });
    await expect(profileTab).toBeVisible();
    await profileTab.click();

    // Verify user profile details are displayed
    await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Administrator' })).toBeVisible();

    // Navigate back to Catalog Collection
    await page.getByRole('button', { name: 'Movie Finder' }).click();
    await expect(page.locator('text=Movie Finder & Review Database')).toBeVisible();
  });

  test('should support high-precision automation using custom IDs and label bindings', async ({ page }) => {
    // 1. Sign in using admin prefill
    await page.locator('#btn-prefill-admin').click();
    await page.locator('#btn-submit-auth').click();

    // 2. Add a new movie using the ID-equipped fields
    await page.locator('#btn-add-movie-trigger').click();
    await page.locator('#movie-title').fill('The Matrix Resurrections');
    await page.locator('#movie-year').fill('2021');
    await page.locator('#movie-rating').fill('6.5');
    await page.locator('#movie-genre').fill('Sci-Fi, Action');
    await page.locator('#movie-duration').fill('148 min');
    await page.locator('#movie-director').fill('Lana Wachowski');
    await page.locator('#movie-cover').fill('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400');
    await page.locator('#movie-description').fill('Return to the world of two realities...');
    await page.locator('#btn-movie-submit').click();

    // 3. Search for the movie using the search bar ID
    await page.locator('#movie-search').fill('Matrix');
    await expect(page.locator('text=The Matrix Resurrections').first()).toBeVisible();

    // 4. Navigate to profile and edit user bio using profile IDs
    await page.locator('#btn-nav-profile').click();
    await page.locator('#btn-edit-profile').click();
    await page.locator('#profile-bio').fill('A passionate movie automation testing engineer.');
    await page.locator('#btn-save-profile-changes').click();

    // 5. Verify edited bio is visible on the profile panel
    await expect(page.locator('text=A passionate movie automation testing engineer.')).toBeVisible();

    // 6. Navigate back to catalog and verify Matrix is still there
    await page.locator('#btn-nav-catalog').click();
    await page.locator('#movie-search').fill('Matrix');
    await expect(page.locator('text=The Matrix Resurrections').first()).toBeVisible();
  });

  test('should add a movie, verify it exists, delete it, and assert it is removed', async ({ page }) => {
    // 1. Sign in
    await page.locator('#btn-prefill-admin').click();
    await page.locator('#btn-submit-auth').click();

    // 2. Add "Interstellar Remastered"
    await page.locator('#btn-add-movie-trigger').click();
    await page.locator('#movie-title').fill('Interstellar Remastered');
    await page.locator('#movie-year').fill('2014');
    await page.locator('#movie-rating').fill('8.6');
    await page.locator('#movie-genre').fill('Sci-Fi, Adventure');
    await page.locator('#movie-duration').fill('169 min');
    await page.locator('#movie-director').fill('Christopher Nolan');
    await page.locator('#movie-cover').fill('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400');
    await page.locator('#movie-description').fill('Mankind was born on Earth. It was never meant to die here.');
    await page.locator('#btn-movie-submit').click();

    // 3. Search and verify it exists
    await page.locator('#movie-search').fill('Interstellar');
    const movieCard = page.locator('.test-movie-card').filter({ hasText: 'Interstellar Remastered' });
    await expect(movieCard).toBeVisible();

    // 4. Setup browser alert dialog handler to accept deletion confirm dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete film "Interstellar Remastered"?');
      await dialog.accept();
    });

    // 5. Delete the movie
    const deleteBtn = movieCard.locator('.test-btn-delete-movie');
    await deleteBtn.click();

    // 6. Assert it is gone
    await expect(movieCard).not.toBeVisible();
  });

  test('should validate invalid entries on the add movie form', async ({ page }) => {
    // 1. Sign in
    await page.locator('#btn-prefill-admin').click();
    await page.locator('#btn-submit-auth').click();

    // 2. Open the add movie tab
    await page.locator('#btn-add-movie-trigger').click();

    // 3. Test rating too high validation (rating max = 10)
    await page.locator('#movie-title').fill('Temp Title');
    await page.locator('#movie-rating').fill('15'); // Exceeds max="10"

    // Evaluate HTML5 input validation
    const isRatingValid = await page.locator('#movie-rating').evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isRatingValid).toBe(false);

    // 4. Test required title validation (title cannot be empty)
    await page.locator('#movie-title').fill(''); // Empty

    // Evaluate HTML5 input validation for title
    const isTitleValid = await page.locator('#movie-title').evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isTitleValid).toBe(false);
  });
});
