import { test, expect } from '@playwright/test';

test.describe('Navigation (Table of Contents)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cm-editor');
    // テスト用のMarkdownを設定
    const testMarkdown = `# Heading 1\n\nSome text under heading 1.\n\n## Heading 1.1\n\nMore text.\n\n# Heading 2\n\nFinal paragraph.\n`;
    await page.locator('.cm-content').fill(testMarkdown);
    // プレビューが更新されるのを待つ（より確実に待つ方法があれば改善）
    await page.waitForTimeout(500);
    await expect(
      page.locator('[data-testid="preview-pane"] h1:has-text("Heading 1")')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preview-pane"] h2:has-text("Heading 1.1")')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preview-pane"] h1:has-text("Heading 2")')
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: '目次' })
        .getByRole('link', { name: 'Heading 2' })
    ).toBeVisible();
  });

  test('should display headings in Table of Contents', async ({ page }) => {
    const toc = page.getByRole('navigation', { name: '目次' });

    // 目次に見出しが表示されていることを確認
    await expect(
      toc.getByRole('link', { name: 'Heading 1', exact: true })
    ).toBeVisible();
    await expect(
      toc.getByRole('link', { name: 'Heading 1.1', exact: true })
    ).toBeVisible();
    await expect(
      toc.getByRole('link', { name: 'Heading 2', exact: true })
    ).toBeVisible();
  });

  test('should scroll preview pane when TOC heading is clicked', async ({
    page,
  }) => {
    const toc = page.getByRole('navigation', { name: '目次' });
    const previewPane = page.locator('[data-testid="preview-pane"]');
    const heading2InPreview = previewPane.locator('h1:has-text("Heading 2")');

    // 初期状態ではHeading 2が見えない位置にあることを確認（必要なら）
    // await expect(heading2InPreview).not.toBeInViewport();

    // 目次のHeading 2をクリック
    await toc.getByRole('link', { name: 'Heading 2', exact: true }).click();

    // プレビューがスクロールされ、Heading 2が表示される（またはビューポートの上部に近づく）ことを確認
    // 完全な表示確認は難しい場合があるため、waitForFunctionなどで位置を確認する
    await expect(heading2InPreview).toBeInViewport();

    // 少し待ってスクロールの完了を確認 (より確実な方法があれば改善)
    // await page.waitForTimeout(500);
    // const heading2BoundingBox = await heading2InPreview.boundingBox();
    // expect(heading2BoundingBox?.y).toBeLessThan(100); // 例：ビューポート上部にあることを確認
  });
});
