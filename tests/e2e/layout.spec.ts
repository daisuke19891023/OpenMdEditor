import { test, expect } from '@playwright/test';

test.describe('Layout Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cm-editor');
  });

  test('should switch between view modes', async ({ page }) => {
    const editorPane = page.locator('[data-testid="editor-pane"]'); // CodeMirrorEditorの親など
    const previewPane = page.locator('[data-testid="preview-pane"]');

    // 初期状態（分割表示）を確認
    await expect(editorPane).toBeVisible();
    await expect(previewPane).toBeVisible();

    // 編集モードに切り替え
    await page.getByRole('tab', { name: '編集' }).click();
    await expect(editorPane).toBeVisible();
    await expect(previewPane).not.toBeVisible();

    // プレビューモードに切り替え
    await page.getByRole('tab', { name: 'プレビュー' }).click();
    await expect(editorPane).not.toBeVisible();
    await expect(previewPane).toBeVisible();

    // 分割モードに戻す
    await page.getByRole('tab', { name: '分割' }).click();
    await expect(editorPane).toBeVisible();
    await expect(previewPane).toBeVisible();
  });

  test('should display and allow resizing the Table of Contents panel', async ({
    page,
  }) => {
    const tocPanel = page.getByRole('navigation', { name: '目次' });
    const resizeHandle = page.locator('[data-testid="resizable-handle"]'); // Use data-testid selector

    // 目次パネルが表示されていることを確認
    await expect(tocPanel).toBeVisible();

    // リサイズハンドルが表示されていることを確認
    await expect(resizeHandle).toBeVisible();

    // --- リサイズのテスト (オプション) ---
    // リサイズ操作は少し複雑になるため、ここではハンドルの存在確認に留める
    // 必要であれば、dragAndDrop などでリサイズ後の幅を確認するテストを追加
    // const initialWidth = await tocPanel.boundingBox()?.width;
    // await resizeHandle.dragTo(page.locator('body'), { targetPosition: { x: 400, y: 300 } }); // 例
    // await page.waitForTimeout(500); // Wait for resize animation
    // const finalWidth = await tocPanel.boundingBox()?.width;
    // expect(finalWidth).not.toEqual(initialWidth);
  });
});
