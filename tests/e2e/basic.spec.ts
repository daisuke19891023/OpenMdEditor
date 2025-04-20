import { test, expect } from '@playwright/test';

test.describe('Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // 各テストの前にベースURLにアクセス
    await page.goto('/');
    // 起動時の初期化待ち（必要に応じて調整）
    await page.waitForSelector('.cm-editor'); // CodeMirrorエディタが表示されるのを待つ
    await page.waitForSelector('[data-testid="preview-pane"]'); // プレビューペインが表示されるのを待つ
  });

  test('should display the editor and preview panes', async ({ page }) => {
    // エディタペインが表示されているか確認
    const editorPane = page.locator('[data-testid="editor-pane"]');
    await expect(editorPane).toBeVisible();
    await expect(editorPane.locator('.cm-editor')).toBeVisible();

    // プレビューペインが表示されているか確認
    const previewPane = page.locator('[data-testid="preview-pane"]');
    await expect(previewPane).toBeVisible();

    // 初期状態（分割ビュー）では両方表示されるはず
    // (ビューモード切り替えテストはlayout.spec.tsで行う)

    // ツールバーを取得して表示されているか確認
    const toolbar = page.getByRole('toolbar');
    await expect(toolbar).toBeVisible();

    // ツールバー内のボタンを確認
    await expect(toolbar.getByRole('button', { name: '新規' })).toBeVisible();
    await expect(toolbar.getByRole('button', { name: '開く' })).toBeVisible(); // ツールバー内を明示
    await expect(toolbar.getByRole('button', { name: '保存' })).toBeVisible();

    // 目次パネルが表示されているか確認
    const tocPanel = page.getByRole('navigation', { name: '目次' });
    await expect(tocPanel).toBeVisible();

    // ステータスバーが表示されているか確認
    const statusBar = page.getByRole('status'); // EditorStatusBarにrole="status"があると仮定
    await expect(statusBar).toBeVisible();
  });

  test('should load initial content', async ({ page }) => {
    // CodeMirrorエディタ内の初期コンテンツを確認
    const editorContent = await page.locator('.cm-content').innerText();
    expect(editorContent).toContain('# Welcome');
    expect(editorContent).toContain('Start typing your Markdown!');

    // プレビューペイン内の初期コンテンツを確認
    // PreviewPaneコンポーネントにdata-testid="preview-pane"を追加する必要があるかもしれません
    const previewPane = page.locator('[data-testid="preview-pane"]');
    await expect(previewPane.locator('h1:has-text("Welcome")')).toBeVisible();
    await expect(
      previewPane.locator('p:has-text("Start typing your Markdown!")')
    ).toBeVisible();

    // 目次内の初期コンテンツを確認
    const toc = page.getByRole('navigation', { name: '目次' });
    await expect(toc.getByRole('link', { name: 'Welcome' })).toBeVisible();
  });
});
