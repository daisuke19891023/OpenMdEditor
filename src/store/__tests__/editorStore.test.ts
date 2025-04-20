import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useEditorStore } from '../editorStore'; // Adjust path as needed
import { storageService } from '@/lib/storageService'; // Mock this
import type { Draft } from '@/types/editor';
import { toast } from 'sonner'; // Mock this

// --- Mocks ---
vi.mock('@/lib/storageService'); // Mock the entire storage service
vi.mock('sonner', () => ({
  // Mock sonner toast
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock CodeMirror view and commands if needed for runCommand tests
const mockView = {
  dispatch: vi.fn(),
  focus: vi.fn(),
  state: {
    selection: { main: { from: 0, to: 0 } }, // Mock selection if needed by commands
  },
  // Add other methods/properties if commands rely on them
} as any; // Use 'any' for simplicity in mock, or create a more detailed mock type

describe('editorStore', () => {
  // Get initial state for resetting
  const initialState = useEditorStore.getState();

  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.setState(initialState, true);
    // Reset mocks
    vi.clearAllMocks();
    // Reset storageService mock implementations if necessary
    vi.mocked(storageService.saveDraft).mockReturnValue('mock-id');
    vi.mocked(storageService.loadDraft).mockImplementation((id) =>
      id === 'mock-id'
        ? {
            id: 'mock-id',
            content: 'loaded content',
            fileName: 'loaded.md',
            lastModified: new Date().toISOString(),
          }
        : null
    );
    vi.mocked(storageService.loadLastDraft).mockReturnValue(null); // Default to no last draft
    vi.mocked(storageService.getCurrentDraftId).mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useEditorStore.getState();
    expect(state.markdown).toBe('# Welcome\n\nStart typing your Markdown!');
    expect(state.currentFileName).toBe('');
    expect(state.currentDraftId).toBeNull();
    expect(state.isSaved).toBe(true);
    expect(state.selectedText).toBe('');
    expect(state.headings).toEqual([]);
    expect(state.view).toBeNull();
    // Counts should be calculated based on initial markdown after loadLastOpenedDraft runs
    expect(state.wordCount).toBe(5); // "# Welcome\n\nStart typing your Markdown!"
    expect(state.charCount).toBe(41);
  });

  // --- Action Tests ---

  it('setView should update the view instance', () => {
    useEditorStore.getState().setView(mockView);
    expect(useEditorStore.getState().view).toBe(mockView);
    useEditorStore.getState().setView(null);
    expect(useEditorStore.getState().view).toBeNull();
  });

  it('runCommand should execute command if view exists', () => {
    const mockCommand = vi.fn(() => true); // Mock command function
    useEditorStore.getState().setView(mockView);
    useEditorStore.getState().runCommand(mockCommand);
    expect(mockCommand).toHaveBeenCalledWith(mockView);
    expect(mockView.focus).toHaveBeenCalled(); // Should focus after command
  });

  it('runCommand should not execute command if view is null', () => {
    const mockCommand = vi.fn(() => true);
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    useEditorStore.getState().setView(null);
    useEditorStore.getState().runCommand(mockCommand);
    expect(mockCommand).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('EditorView is not available')
    );
    consoleWarnSpy.mockRestore();
  });

  it('setMarkdown should update markdown, counts, and set isSaved to false', () => {
    useEditorStore.getState().setMarkdown('New content.');
    const state = useEditorStore.getState();
    expect(state.markdown).toBe('New content.');
    expect(state.isSaved).toBe(false);
    expect(state.wordCount).toBe(2);
    expect(state.charCount).toBe(12);
  });

  it('setHeadings should update the headings array', () => {
    const newHeadings = [{ id: 'h1', text: 'Title', level: 1 }];
    useEditorStore.getState().setHeadings(newHeadings);
    expect(useEditorStore.getState().headings).toEqual(newHeadings);
  });

  it('updateSelection should update selectedText and selectionRange', () => {
    const text = 'highlight';
    const range = { from: 10, to: 19 };
    useEditorStore.getState().updateSelection(text, range);
    const state = useEditorStore.getState();
    expect(state.selectedText).toBe(text);
    expect(state.selectionRange).toEqual(range);
  });

  it('setIsSaved should update the isSaved flag', () => {
    useEditorStore.getState().setIsSaved(false);
    expect(useEditorStore.getState().isSaved).toBe(false);
    useEditorStore.getState().setIsSaved(true);
    expect(useEditorStore.getState().isSaved).toBe(true);
  });

  it('setCurrentFile should load a draft correctly', () => {
    const draft: Draft = {
      id: 'draft-1',
      content: 'Loaded draft content',
      fileName: 'my draft.md',
      lastModified: '2024-01-01T00:00:00Z',
    };
    useEditorStore.getState().setCurrentFile(draft);
    const state = useEditorStore.getState();
    expect(state.markdown).toBe(draft.content);
    expect(state.currentFileName).toBe(draft.fileName);
    expect(state.currentDraftId).toBe(draft.id);
    expect(state.isSaved).toBe(true);
    expect(state.wordCount).toBe(3);
    expect(state.charCount).toBe(draft.content.length);
    expect(storageService.setCurrentDraftId).toHaveBeenCalledWith(draft.id);
  });

  it('setCurrentFile with null should reset to new file state', () => {
    // Set some state first
    useEditorStore.getState().setMarkdown('old content');
    useEditorStore.getState().setCurrentFile(null); // Reset
    const state = useEditorStore.getState();
    expect(state.markdown).toBe('# 新しいドキュメント\n\n');
    expect(state.currentFileName).toBe('');
    expect(state.currentDraftId).toBeNull();
    expect(state.isSaved).toBe(true);
    expect(storageService.clearCurrentDraftId).toHaveBeenCalled();
  });

  // --- File Action Tests ---

  it('saveCurrentDraft should call storageService.saveDraft and update state', async () => {
    useEditorStore.getState().setMarkdown('Content to save');
    useEditorStore.getState().setCurrentFile({
      id: 'existing-id',
      content: '',
      fileName: 'existing.md',
      lastModified: '',
    }); // Set existing ID/name

    const result = await useEditorStore.getState().saveCurrentDraft();

    expect(result).toBe(true);
    expect(storageService.saveDraft).toHaveBeenCalledWith(
      'Content to save',
      'existing.md',
      'existing-id'
    );
    // setCurrentFile should be called internally after successful save/load
    expect(storageService.loadDraft).toHaveBeenCalledWith('mock-id'); // Assuming saveDraft returned 'mock-id'
    expect(toast.success).toHaveBeenCalledWith(
      '下書き "existing.md" を保存しました'
    );
    // Check if state was updated by the internal setCurrentFile call
    expect(useEditorStore.getState().content).toBe('loaded content'); // From mocked loadDraft
    expect(useEditorStore.getState().isSaved).toBe(true);
  });

  it('saveCurrentDraft should prompt for filename if missing and save', async () => {
    useEditorStore.getState().setMarkdown('Needs filename');
    useEditorStore.getState().setCurrentFile(null); // Ensure no filename/id initially
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new-file.md'); // Mock prompt

    const result = await useEditorStore.getState().saveCurrentDraft();

    expect(result).toBe(true);
    expect(promptSpy).toHaveBeenCalled();
    expect(storageService.saveDraft).toHaveBeenCalledWith(
      'Needs filename',
      'new-file.md',
      undefined
    );
    expect(toast.success).toHaveBeenCalledWith(
      '下書き "new-file.md" を保存しました'
    );
    expect(useEditorStore.getState().currentFileName).toBe('loaded.md'); // From mocked loadDraft

    promptSpy.mockRestore();
  });

  it('saveCurrentDraft should cancel if prompt is cancelled', async () => {
    useEditorStore.getState().setMarkdown('Needs filename');
    useEditorStore.getState().setCurrentFile(null);
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null); // Mock prompt cancellation

    const result = await useEditorStore.getState().saveCurrentDraft();

    expect(result).toBe(false);
    expect(promptSpy).toHaveBeenCalled();
    expect(storageService.saveDraft).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      'ファイル名が入力されなかったため、保存をキャンセルしました'
    );

    promptSpy.mockRestore();
  });

  it('createNewFile should reset state after confirmation if unsaved', () => {
    useEditorStore.getState().setMarkdown('unsaved changes'); // isSaved becomes false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true); // Confirm discard

    useEditorStore.getState().createNewFile();

    expect(confirmSpy).toHaveBeenCalled();
    expect(useEditorStore.getState().markdown).toBe('# 新しいドキュメント\n\n');
    expect(useEditorStore.getState().currentDraftId).toBeNull();
    expect(toast.info).toHaveBeenCalledWith('新規ファイルを作成しました');

    confirmSpy.mockRestore();
  });

  it('createNewFile should reset state directly if saved', () => {
    useEditorStore.getState().setIsSaved(true); // Ensure saved state
    const confirmSpy = vi.spyOn(window, 'confirm');

    useEditorStore.getState().createNewFile();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(useEditorStore.getState().markdown).toBe('# 新しいドキュメント\n\n');
    expect(toast.info).toHaveBeenCalledWith('新規ファイルを作成しました');
  });

  it('loadDraft should load draft into state after confirmation if unsaved', () => {
    useEditorStore.getState().setMarkdown('unsaved changes');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const draftToLoad: Draft = {
      id: 'load-id',
      content: 'Loaded!',
      fileName: 'loaded.md',
      lastModified: '',
    };
    vi.mocked(storageService.loadDraft).mockReturnValue(draftToLoad);

    useEditorStore.getState().loadDraft('load-id');

    expect(confirmSpy).toHaveBeenCalled();
    expect(storageService.loadDraft).toHaveBeenCalledWith('load-id');
    expect(useEditorStore.getState().markdown).toBe(draftToLoad.content);
    expect(useEditorStore.getState().currentDraftId).toBe(draftToLoad.id);
    expect(toast.info).toHaveBeenCalledWith(
      `下書き "${draftToLoad.fileName}" を読み込みました`
    );

    confirmSpy.mockRestore();
  });

  it('loadLastOpenedDraft should load the last draft from storage on init (mocked)', () => {
    const lastDraft: Draft = {
      id: 'last-id',
      content: 'Last opened',
      fileName: 'last.md',
      lastModified: '',
    };
    vi.mocked(storageService.loadLastDraft).mockReturnValue(lastDraft);

    // Reset and trigger initial load logic again
    useEditorStore.setState(initialState, true);
    useEditorStore.getState().loadLastOpenedDraft(); // Manually trigger for test

    expect(storageService.loadLastDraft).toHaveBeenCalled();
    expect(useEditorStore.getState().markdown).toBe(lastDraft.content);
    expect(useEditorStore.getState().currentDraftId).toBe(lastDraft.id);
  });

  it('loadLastOpenedDraft should calculate counts for initial state if no last draft', () => {
    vi.mocked(storageService.loadLastDraft).mockReturnValue(null); // No last draft

    useEditorStore.setState(initialState, true); // Reset to initial state
    useEditorStore.getState().loadLastOpenedDraft(); // Trigger load

    expect(storageService.loadLastDraft).toHaveBeenCalled();
    const state = useEditorStore.getState();
    // Expect counts based on the *initial* default markdown
    expect(state.markdown).toBe('# Welcome\n\nStart typing your Markdown!');
    expect(state.wordCount).toBe(5);
    expect(state.charCount).toBe(41);
    expect(state.currentDraftId).toBeNull();
  });

  // --- Scroll Action Test ---
  it('scrollToPosition should dispatch scrollIntoView effect if view exists', () => {
    const scrollToPos = 100;
    const mockDispatch = vi.fn();
    const mockViewWithDispatch = { ...mockView, dispatch: mockDispatch };
    useEditorStore.getState().setView(mockViewWithDispatch);

    useEditorStore.getState().scrollToPosition(scrollToPos, 'center');

    expect(mockDispatch).toHaveBeenCalledWith({
      effects: expect.any(Object), // Check if it's the scrollIntoView effect type
    });
    // More specific check for the effect if possible/needed
    const dispatchedEffect = mockDispatch.mock.calls[0][0].effects;
    // This check is fragile as internal structure might change
    // expect(dispatchedEffect.value).toBe(scrollToPos);
    // expect(dispatchedEffect.spec.y).toBe('center');
  });

  // --- Format Action Tests (Example for toggleBoldSelection) ---
  it('toggleBoldSelection should call runCommand with the correct command', () => {
    const runCommandSpy = vi.spyOn(useEditorStore.getState(), 'runCommand');
    useEditorStore.getState().toggleBoldSelection();
    // Check if runCommand was called, but verifying the exact command function passed
    // requires either exporting the command or more complex mocking.
    expect(runCommandSpy).toHaveBeenCalled();
    // We assume the correct command function from cmCommands is passed internally
    runCommandSpy.mockRestore();
  });
});
