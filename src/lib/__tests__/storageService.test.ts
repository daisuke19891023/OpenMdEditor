import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageService } from '../storageService'; // Adjust path as needed
import type { Draft } from '@/types/editor';

// --- Mock localStorage ---
// Simple in-memory mock for localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    // Helper to inspect the store (for debugging tests)
    getStore: (): Record<string, string> => store,
  };
})();

// Stub the global localStorage object before tests run
vi.stubGlobal('localStorage', localStorageMock);

// --- Tests ---
describe('storageService', () => {
  // Clear the mock localStorage before each test
  beforeEach(() => {
    localStorageMock.clear();
    // Ensure timers are faked for consistent timestamp generation if needed
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-20T10:00:00.000Z')); // Set a fixed time
  });

  // Restore mocks and timers after each test
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // --- saveDraft Tests ---
  it('saveDraft: should save a new draft with filename and return ID', () => {
    const content = 'Test content';
    const fileName = 'test.md';
    const draftId = storageService.saveDraft(content, fileName);

    // Expect a specific ID format based on current implementation
    expect(draftId).toBe(`file_test.md_2024-04-20T10:00:00.000Z`);
    const drafts = storageService.getAllDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].content).toBe(content);
    expect(drafts[0].fileName).toBe(fileName);
    expect(drafts[0].id).toBe(draftId);
    expect(storageService.getCurrentDraftId()).toBe(draftId);
  });

  it('saveDraft: should save a new draft without filename and return ID', () => {
    const content = 'Draft without name';
    const draftId = storageService.saveDraft(content);

    expect(draftId).toBe(`draft_2024-04-20T10:00:00.000Z`);
    const drafts = storageService.getAllDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].content).toBe(content);
    expect(drafts[0].fileName).toBeNull();
    expect(storageService.getCurrentDraftId()).toBe(draftId);
  });

  it('saveDraft: should update an existing draft when existingId is provided', () => {
    const initialContent = 'Initial version';
    const fileName = 'update-test.md';
    const initialId = storageService.saveDraft(initialContent, fileName);
    expect(initialId).toBeDefined();

    vi.advanceTimersByTime(1000); // Advance time for different lastModified
    const updatedContent = 'Updated version';
    const updatedId = storageService.saveDraft(
      updatedContent,
      fileName,
      initialId!
    );

    expect(updatedId).toBe(initialId); // ID should remain the same
    const drafts = storageService.getAllDrafts();
    expect(drafts).toHaveLength(1); // Should still only be one draft
    expect(drafts[0].content).toBe(updatedContent);
    expect(drafts[0].lastModified).not.toBe('2024-04-20T10:00:00.000Z'); // Timestamp updated
    expect(storageService.getCurrentDraftId()).toBe(updatedId);
  });

  // --- loadDraft Tests ---
  it('loadDraft: should load an existing draft by ID and set it as current', () => {
    const content = 'Content to load';
    const id = storageService.saveDraft(content, 'load-me.md');
    expect(id).toBeDefined();
    storageService.clearCurrentDraftId(); // Clear current ID first

    const loadedDraft = storageService.loadDraft(id!);
    expect(loadedDraft).not.toBeNull();
    expect(loadedDraft?.id).toBe(id);
    expect(loadedDraft?.content).toBe(content);
    expect(storageService.getCurrentDraftId()).toBe(id); // Should be set as current
  });

  it('loadDraft: should return null for a non-existent ID', () => {
    expect(storageService.loadDraft('invalid-id')).toBeNull();
    expect(storageService.getCurrentDraftId()).toBeNull(); // Current ID should not change
  });

  // --- loadLastDraft Tests ---
  it('loadLastDraft: should load the most recently saved/loaded draft', () => {
    storageService.saveDraft('First draft');
    vi.advanceTimersByTime(1000);
    const secondId = storageService.saveDraft('Second draft'); // This sets current ID
    vi.advanceTimersByTime(1000);
    storageService.saveDraft('Third draft'); // This sets current ID

    const loaded = storageService.loadLastDraft();
    expect(loaded).not.toBeNull();
    expect(loaded?.content).toBe('Third draft');

    // Simulate loading an older draft
    storageService.loadDraft(secondId!);
    const reloaded = storageService.loadLastDraft();
    expect(reloaded).not.toBeNull();
    expect(reloaded?.content).toBe('Second draft'); // Now the second one is the last loaded
  });

  it('loadLastDraft: should return null if no current draft ID is set', () => {
    storageService.clearCurrentDraftId();
    expect(storageService.loadLastDraft()).toBeNull();
  });

  // --- getAllDrafts Tests ---
  it('getAllDrafts: should return all drafts sorted by lastModified descending', () => {
    const id1 = storageService.saveDraft('Draft 1');
    vi.advanceTimersByTime(1000);
    const id2 = storageService.saveDraft('Draft 2');
    vi.advanceTimersByTime(1000);
    const id3 = storageService.saveDraft('Draft 3');

    const drafts = storageService.getAllDrafts();
    expect(drafts).toHaveLength(3);
    expect(drafts[0].id).toBe(id3);
    expect(drafts[1].id).toBe(id2);
    expect(drafts[2].id).toBe(id1);
  });

  it('getAllDrafts: should return an empty array when no drafts exist', () => {
    expect(storageService.getAllDrafts()).toEqual([]);
  });

  // --- deleteDraft Tests ---
  it('deleteDraft: should delete a draft by ID and return true', () => {
    const id1 = storageService.saveDraft('To keep');
    const id2 = storageService.saveDraft('To delete'); // This is now current
    expect(storageService.getAllDrafts()).toHaveLength(2);
    expect(storageService.getCurrentDraftId()).toBe(id2);

    const result = storageService.deleteDraft(id2!);
    expect(result).toBe(true);
    expect(storageService.getAllDrafts()).toHaveLength(1);
    expect(storageService.getAllDrafts()[0].id).toBe(id1);
    expect(storageService.getCurrentDraftId()).toBeNull(); // Current ID should be cleared
  });

  it('deleteDraft: should delete a draft that is not the current draft', () => {
    const id1 = storageService.saveDraft('Draft 1');
    const id2 = storageService.saveDraft('Draft 2'); // Current is id2
    const result = storageService.deleteDraft(id1!);
    expect(result).toBe(true);
    expect(storageService.getAllDrafts()).toHaveLength(1);
    expect(storageService.getCurrentDraftId()).toBe(id2); // Current ID should remain id2
  });

  it('deleteDraft: should return false for a non-existent ID', () => {
    expect(storageService.deleteDraft('invalid-id')).toBe(false);
  });

  // --- getCurrentDraftId / setCurrentDraftId / clearCurrentDraftId Tests ---
  it('should manage the current draft ID correctly', () => {
    expect(storageService.getCurrentDraftId()).toBeNull();
    storageService.setCurrentDraftId('test-id-1');
    expect(storageService.getCurrentDraftId()).toBe('test-id-1');
    storageService.clearCurrentDraftId();
    expect(storageService.getCurrentDraftId()).toBeNull();
  });

  // --- Error Handling Test ---
  it('should handle localStorage errors gracefully', () => {
    // Spy on console.error
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Simulate setItem error
    vi.spyOn(localStorageMock, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage full');
    });
    expect(storageService.saveDraft('error test')).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[storageService] Error saving draft:'),
      expect.any(Error)
    );

    // Simulate getItem error (returning invalid JSON)
    localStorageMock.setItem('ai_markdown_editor_drafts', '{"bad json'); // Set invalid JSON directly
    expect(storageService.getAllDrafts()).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing JSON'),
      expect.any(Error)
    );

    // Simulate removeItem error
    vi.spyOn(localStorageMock, 'removeItem').mockImplementationOnce(() => {
      throw new Error('Remove failed');
    });
    storageService.clearCurrentDraftId(); // Should log an error but not crash
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error clearing current draft ID'),
      expect.any(Error)
    );

    // Restore mocks
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks(); // Restore localStorage methods too
  });
});
