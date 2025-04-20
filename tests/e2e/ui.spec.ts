import { test, expect } from '@playwright/test';

test.describe('UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cm-editor');
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggleButton = page.getByRole('button', { name: 'Toggle theme' });
    const htmlElement = page.locator('html');

    // 1. Get initial theme class
    const initialClass = await htmlElement.getAttribute('class') || '';
    const isInitiallyDark = initialClass.includes('dark');
    console.log(`Initial theme class: "${initialClass}", isInitiallyDark: ${isInitiallyDark}`);

    // Function to check if theme is light
    const expectLightTheme = async () => {
      await expect(htmlElement).toHaveClass(/light/, { timeout: 3000 });
      await expect(htmlElement).not.toHaveClass(/dark/);
      console.log('Theme is now light');
    };

    // Function to check if theme is dark
    const expectDarkTheme = async () => {
      await expect(htmlElement).toHaveClass(/dark/, { timeout: 3000 });
      await expect(htmlElement).not.toHaveClass(/light/);
      console.log('Theme is now dark');
    };

    // 2. Click once and assert the theme toggled
    await themeToggleButton.click();
    if (isInitiallyDark) {
      await expectLightTheme();
    } else {
      await expectDarkTheme();
    }

    // 3. Click again and assert the theme toggled back
    await themeToggleButton.click();
    if (isInitiallyDark) {
      await expectDarkTheme(); // Should toggle back to dark
    } else {
      await expectLightTheme(); // Should toggle back to light
    }
  });

  test('should update status bar on edit', async ({ page }) => {
    const statusBar = page.getByRole('status');
    const editorLocator = page.locator('.cm-content');

    // 初期状態の単語数・文字数を確認
    await expect(statusBar).toContainText(/6 単語/);
    await expect(statusBar).toContainText(/38 文字/);

    // テキストを追加
    await editorLocator.press('End');
    await page.keyboard.press('Enter'); // 新しい行
    await editorLocator.type(' New words added.');

    // ステータスバーが更新されるのを待つ（debounceなどがあれば考慮）
    await page.waitForTimeout(500); // 少し待機

    // 更新後の単語数・文字数を確認
    await expect(statusBar).toContainText(/9 単語/); // 6 + 3 = 9
    await expect(statusBar).toContainText(/56 文字/); // 38 + 1 (改行) + 17 = 56

    // テキストを削除
    await page.keyboard.press('Control+A'); // 全選択 (macOSならMeta+A)
    await page.keyboard.press('Backspace');

    await page.waitForTimeout(500); // 少し待機

    // 更新後の単語数・文字数を確認
    await expect(statusBar).toContainText(/0 単語/);
    await expect(statusBar).toContainText(/0 文字/);
  });
}); 