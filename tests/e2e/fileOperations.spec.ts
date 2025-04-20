import { test, expect } from '@playwright/test';

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cm-editor');
    // テスト前にlocalStorageをクリア
    await page.evaluate(() => localStorage.clear());
    // 必要ならページをリロードしてクリアを反映
    await page.reload();
    await page.waitForSelector('.cm-editor');
  });

  test('should create a new file', async ({ page }) => {
    // ダイアログを自動承認するために confirm をスタブ
    await page.evaluate(() => { window.confirm = () => true; });
    // 編集エリアに何か入力する
    await page.locator('.cm-content').fill('# Initial Content\nHello');
    await expect(page.locator('.cm-content')).toHaveText(/# Initial Content/);

    // 新規ボタンをクリック
    await page.getByRole('button', { name: '新規' }).click();

    // 確認ダイアログはスタブにより自動承認される

    // 新規作成のトースト通知を待つ
    await page.waitForSelector('[data-sonner-toast][data-type="info"]'); // トースト要素が表示されるのを待つ
    await expect(page.locator('[data-sonner-toast][data-type="info"]')).toContainText('新規ファイルを作成しました');

    // エディタの内容がリセットされていることを確認
    await expect(page.locator('.cm-content')).toContainText('# 新しいドキュメント');

    // ステータスバーのリセットを確認
    await expect(page.getByRole('status')).toContainText(/\d+ 単語/); // 単語数が初期値に

    // localStorageのcurrentDraftIdがクリアされているか確認
    const currentDraftId = await page.evaluate(() => localStorage.getItem('currentDraftId'));
    expect(currentDraftId).toBeNull();
  });

  test('should save a draft manually', async ({ page }) => {
    const editorLocator = page.locator('.cm-content');
    const saveButton = page.getByRole('button', { name: '保存' });
    const testFileName = 'My Test Draft';
    const testContent = '# Saved Content\nThis is saved.';

    // 編集エリアに入力
    await editorLocator.fill(testContent);

    // プロンプトが表示されることをハンドル (テスト用ファイル名を入力)
    page.once('dialog', async dialog => {
      expect(dialog.type()).toContain('prompt');
      expect(dialog.message()).toContain('ファイル名を入力してください');
      await dialog.accept(testFileName);
    });

    // 状態更新のための短い待機時間
    await page.waitForTimeout(500);

    // 保存ボタンをクリック
    await saveButton.click();

    // 保存成功のトースト通知を待つ
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(`下書き "${testFileName}" を保存しました`);

    // localStorageに下書きが保存されていることを確認
    const savedDrafts = await page.evaluate(() => {
      const drafts = localStorage.getItem('markdownDrafts');
      return drafts ? JSON.parse(drafts) : {};
    });
    const draftIds = Object.keys(savedDrafts);
    expect(draftIds.length).toBeGreaterThan(0);
    const savedDraft = savedDrafts[draftIds[0]];
    expect(savedDraft.fileName).toBe(testFileName);
    expect(savedDraft.content).toBe(testContent);

    // currentDraftIdが設定されているか確認
    const currentDraftId = await page.evaluate(() => localStorage.getItem('currentDraftId'));
    expect(currentDraftId).toBe(draftIds[0]);

    // isSaved状態がtrueになっていることを確認（UI上での確認は難しいので省略、ストアの状態を確認するテストがあればそちらで）
  });

  test('should autosave a draft after editing', async ({ page }) => {
    const editorLocator = page.locator('.cm-content');
    const initialContent = await editorLocator.innerText();
    const editedContent = initialContent + '\nAppended for autosave.';

    // localStorageの初期状態を確認
    let initialDrafts = await page.evaluate(() => localStorage.getItem('markdownDrafts'));

    // 編集
    await editorLocator.press('End');
    await page.keyboard.press('Enter');
    await editorLocator.type('Appended for autosave.');

    // 自動保存の待機（3秒 + バッファ）
    await page.waitForTimeout(3500);

    // localStorageに下書きが保存されている（または更新されている）ことを確認
    const finalDraftsString = await page.evaluate(() => localStorage.getItem('markdownDrafts'));
    expect(finalDraftsString).not.toBeNull();
    const finalDrafts = JSON.parse(finalDraftsString!); // Not null asserted
    const draftIds = Object.keys(finalDrafts);
    expect(draftIds.length).toBeGreaterThan(0);
    const savedDraft = finalDrafts[draftIds[0]];
    expect(savedDraft.content).toContain('Appended for autosave.');

    // isSaved状態がtrueになっていることを確認（UI上での確認は難しい）
  });

  test('should load and delete a draft from the toolbar', async ({ page }) => {
    // 事前に下書きを2つ作成
    const draft1Name = 'Draft To Load';
    const draft1Content = '# Content of Draft 1';
    const draft2Name = 'Draft To Delete';
    const draft2Content = '## Content of Draft 2';

    await page.evaluate(([d1Name, d1Content, d2Name, d2Content]) => {
        const drafts = {
            draft1: { id: 'draft1', fileName: d1Name, content: d1Content, lastModified: Date.now() - 1000 },
            draft2: { id: 'draft2', fileName: d2Name, content: d2Content, lastModified: Date.now() },
        };
        localStorage.setItem('markdownDrafts', JSON.stringify(drafts));
        localStorage.setItem('currentDraftId', 'draft1'); // 初期はdraft1をロードした状態にする
    }, [draft1Name, draft1Content, draft2Name, draft2Content]);

    await page.reload(); // localStorageの変更を反映させるためにリロード
    await page.waitForSelector('.cm-editor');

    // 初期状態でDraft1がロードされていることを確認
    await expect(page.locator('.cm-content')).toContainText(draft1Content);

    // ツールバーの「開く」ボタンを取得しクリック
    await page.locator('[role="toolbar"] button:has-text("開く")').click({ force: true });

    // ドロップダウンメニューが表示されるのを待つ
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Draft2を読み込む
    await dropdownMenu.getByRole('menuitem', { name: draft2Name }).click();
    await expect(page.locator('.cm-content')).toContainText(draft2Content);
    await expect(page.locator('[data-sonner-toast][data-type="info"]')).toContainText(`下書き "${draft2Name}" を読み込みました`);

    // Draft2の削除アイコンをクリックし、AlertDialogで確認
    const deleteIcon = dropdownMenu.locator('button[aria-label="削除"]').first();
    await deleteIcon.click({ force: true });
    // カスタム確認ダイアログが表示されるのを待つ
    await page.waitForSelector('[role="alertdialog"]');
    // モーダル内の「削除」ボタンをクリックして確定
    await page.locator('[data-testid="confirm-delete-button"]').click();

    // 削除成功のトースト通知を待つ
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText(`下書き "${draft2Name}" を削除しました`);

    // Draft2が存在しないことを確認し、Draft1が存在する
    await expect(dropdownMenu.getByRole('menuitem', { name: draft2Name })).not.toBeVisible();
    await expect(dropdownMenu.getByRole('menuitem', { name: draft1Name })).toBeVisible();

    // （オプション）localStorageからも削除されていることを確認
     const remainingDrafts = await page.evaluate(() => {
        const drafts = localStorage.getItem('markdownDrafts');
        return drafts ? JSON.parse(drafts) : {};
     });
     expect(remainingDrafts['draft2']).toBeUndefined();
     expect(remainingDrafts['draft1']).toBeDefined();
  });

  test('should load the last opened draft on startup', async ({ page }) => {
     // 事前に下書きを作成し、currentDraftIdを設定
     const lastDraftName = 'Last Opened';
     const lastDraftContent = '# This was the last opened draft';
     await page.evaluate(([name, content]) => {
         const drafts = {
             last: { id: 'last', fileName: name, content: content, lastModified: Date.now() },
         };
         localStorage.setItem('markdownDrafts', JSON.stringify(drafts));
         localStorage.setItem('currentDraftId', 'last');
     }, [lastDraftName, lastDraftContent]);

     // ページをリロードして起動時の動作を確認
     await page.reload();
     await page.waitForSelector('.cm-editor');

     // lastDraftContentがロードされていることを確認
     await expect(page.locator('.cm-content')).toContainText(lastDraftContent);

     // ステータスバーの単語数なども確認できるとなお良い
     await expect(page.getByRole('status')).toContainText(/7 単語/); // 期待値を変更
  });
}); 