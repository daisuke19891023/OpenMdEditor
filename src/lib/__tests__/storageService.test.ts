import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageService } from '../storageService';
import type { Draft } from '@/types/editor';

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

// vi.stubGlobalを使用してlocalStorageをモックに置き換える
beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  localStorage.clear(); // 各テスト前にクリア
});

afterEach(() => {
  vi.unstubAllGlobals(); // テスト後にモックを解除
});

// --- 定数 ---
const DRAFTS_KEY = 'ai_markdown_editor_drafts';
const CURRENT_DRAFT_ID_KEY = 'ai_markdown_editor_current_draft_id';

// --- テスト ---
describe('storageService', () => {
  describe('saveDraft', () => {
    it('should save a new draft without a filename', () => {
      const content = 'New draft content';
      const savedId = storageService.saveDraft(content);

      expect(savedId).toBeDefined();
      expect(savedId).toMatch(/^draft_/); // ID形式の確認

      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      expect(drafts[savedId!]).toBeDefined();
      expect(drafts[savedId!].content).toBe(content);
      expect(drafts[savedId!].fileName).toBeNull();
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBe(savedId);
    });

    it('should save a new draft with a filename', () => {
      const content = 'Another new draft';
      const fileName = 'MyFile';
      const savedId = storageService.saveDraft(content, fileName);

      expect(savedId).toBeDefined();
      expect(savedId).toMatch(/^file_MyFile_/); // ID形式の確認

      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      expect(drafts[savedId!]).toBeDefined();
      expect(drafts[savedId!].content).toBe(content);
      expect(drafts[savedId!].fileName).toBe(fileName);
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBe(savedId);
    });

    it('should update an existing draft', () => {
      // 既存の下書きを準備
      const initialContent = 'Initial content';
      const initialFileName = 'ExistingFile';
      const initialId = storageService.saveDraft(
        initialContent,
        initialFileName
      );
      expect(initialId).toBeDefined();

      const updatedContent = 'Updated content';
      const updatedFileName = 'ExistingFile_Renamed'; // ファイル名も変更してみる
      const updatedId = storageService.saveDraft(
        updatedContent,
        updatedFileName,
        initialId!
      );

      expect(updatedId).toBe(initialId); // IDは変わらないはず

      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      expect(Object.keys(drafts).length).toBe(1); // 下書きは1つのまま
      expect(drafts[updatedId!]).toBeDefined();
      expect(drafts[updatedId!].content).toBe(updatedContent);
      expect(drafts[updatedId!].fileName).toBe(updatedFileName); // ファイル名が更新されている
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBe(updatedId);
    });

    // TODO: Add error case test if possible (e.g., localStorage full)
  });

  describe('loadDraft', () => {
    let draft1: Draft;
    let draft2: Draft;

    beforeEach(() => {
      // テストデータを準備
      const id1 = storageService.saveDraft('Content 1', 'File1');
      const id2 = storageService.saveDraft('Content 2', 'File2');
      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      draft1 = drafts[id1!];
      draft2 = drafts[id2!];
      localStorage.removeItem(CURRENT_DRAFT_ID_KEY); // loadDraftで設定されるか確認するためクリア
    });

    it('should load an existing draft and set it as current', () => {
      const loadedDraft = storageService.loadDraft(draft1.id);
      expect(loadedDraft).toEqual(draft1);
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBe(draft1.id);
    });

    it('should return null for a non-existent draft ID', () => {
      const loadedDraft = storageService.loadDraft('non-existent-id');
      expect(loadedDraft).toBeNull();
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBeNull(); // current IDは設定されない
    });

    it('should handle errors during loading (e.g., corrupted data)', () => {
      // 不正なデータをlocalStorageに設定
      localStorage.setItem(DRAFTS_KEY, '{"invalid": "json"}');
      const loadedDraft = storageService.loadDraft('any-id');
      expect(loadedDraft).toBeNull();
      // console.errorが呼ばれたことを確認したいが、ここでは省略
    });
  });

  describe('loadLastDraft', () => {
    let draft1: Draft;
    let draft2: Draft;

    beforeEach(() => {
      // テストデータを準備
      const id1 = storageService.saveDraft('Content 1', 'File1');
      storageService.saveDraft('Content 2', 'File2'); // draft2を保存してcurrentを更新
      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      draft1 = drafts[id1!];
      draft2 = drafts[Object.keys(drafts).find((k) => k !== id1)!]; // draft2を取得
    });

    it('should load the last saved/updated draft', () => {
      const lastDraft = storageService.loadLastDraft();
      expect(lastDraft).toEqual(draft2); // 最後にsaveDraftされたdraft2がロードされる
    });

    it('should return null if current draft ID is not set', () => {
      localStorage.removeItem(CURRENT_DRAFT_ID_KEY);
      const lastDraft = storageService.loadLastDraft();
      expect(lastDraft).toBeNull();
    });

    it('should return null if the current draft ID points to a non-existent draft', () => {
      localStorage.setItem(CURRENT_DRAFT_ID_KEY, 'non-existent-id');
      const lastDraft = storageService.loadLastDraft();
      expect(lastDraft).toBeNull();
    });
  });

  describe('getAllDrafts', () => {
    it('should return an empty array when no drafts exist', () => {
      const drafts = storageService.getAllDrafts();
      expect(drafts).toEqual([]);
    });

    it('should return all drafts sorted by lastModified descending', async () => {
      // 異なる時間に下書きを作成
      const id1 = storageService.saveDraft('Content 1', 'File1'); // oldest
      await new Promise((resolve) => setTimeout(resolve, 10)); // 少し待機
      const id2 = storageService.saveDraft('Content 2', 'File2');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const id3 = storageService.saveDraft('Content 3', 'File3'); // newest

      const allDrafts = storageService.getAllDrafts();
      const storedDrafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');

      expect(allDrafts.length).toBe(3);
      expect(allDrafts[0]).toEqual(storedDrafts[id3!]); // newest first
      expect(allDrafts[1]).toEqual(storedDrafts[id2!]);
      expect(allDrafts[2]).toEqual(storedDrafts[id1!]); // oldest last
    });
  });

  describe('deleteDraft', () => {
    let id1: string;
    let id2: string;

    beforeEach(() => {
      id1 = storageService.saveDraft('Content 1', 'File1')!;
      id2 = storageService.saveDraft('Content 2', 'File2')!; // id2 is now current
    });

    it('should delete an existing draft', () => {
      const result = storageService.deleteDraft(id1);
      expect(result).toBe(true);

      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      expect(drafts[id1]).toBeUndefined();
      expect(drafts[id2]).toBeDefined();
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBe(id2); // current IDは変わらない
    });

    it('should delete the current draft and clear current ID', () => {
      const result = storageService.deleteDraft(id2);
      expect(result).toBe(true);

      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      expect(drafts[id1]).toBeDefined();
      expect(drafts[id2]).toBeUndefined();
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBeNull(); // current IDがクリアされる
    });

    it('should return false for a non-existent draft ID', () => {
      const result = storageService.deleteDraft('non-existent-id');
      expect(result).toBe(false);

      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      expect(Object.keys(drafts).length).toBe(2); // 下書き数は変わらない
    });
  });

  describe('Current Draft ID Management', () => {
    it('should get the current draft ID', () => {
      expect(storageService.getCurrentDraftId()).toBeNull(); // Initially null
      localStorage.setItem(CURRENT_DRAFT_ID_KEY, 'test-id');
      expect(storageService.getCurrentDraftId()).toBe('test-id');
    });

    it('should set the current draft ID', () => {
      storageService.setCurrentDraftId('new-test-id');
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBe('new-test-id');
    });

    it('should clear the current draft ID', () => {
      localStorage.setItem(CURRENT_DRAFT_ID_KEY, 'test-id');
      storageService.clearCurrentDraftId();
      expect(localStorage.getItem(CURRENT_DRAFT_ID_KEY)).toBeNull();
    });
  });
});
