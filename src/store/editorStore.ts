import { create } from 'zustand';
import type { HeadingItem, SelectionRange, Draft } from '@/types/editor'; // Import types
import { EditorView, ViewPlugin } from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
import { storageService } from '@/lib/storageService'; // Import storage service
// Import commands from the dedicated file
import {
  toggleBulletListCommand,
  toggleOrderedListCommand,
  toggleQuoteCommand,
  toggleCodeBlockCommand,
  toggleSurroundingCharacters,
  insertLinkCommand,
} from '@/lib/cmCommands';
import { toast } from 'sonner'; // Import toast for notifications

// Define the shape of the editor state and its actions
interface EditorState {
  // Core editor content and file info
  markdown: string;
  currentFileName: string;
  currentDraftId: string | null; // ID of the draft currently loaded/saved
  isSaved: boolean; // Whether the current content matches the saved version

  // Selection and derived info
  selectedText: string;
  selectionRange: SelectionRange;
  headings: HeadingItem[]; // For Table of Contents
  wordCount: number;
  charCount: number;

  // CodeMirror instance reference
  view: EditorView | null;

  // State for external scroll control (used by scroll sync)
  scrollToPercent: number | null;

  // --- Actions ---
  setView: (view: EditorView | null) => void; // Set/clear the CodeMirror view instance
  runCommand: (command: (view: EditorView) => boolean, focus?: boolean) => void; // Execute a CodeMirror command
  setMarkdown: (value: string) => void; // Update markdown content (and set isSaved=false)
  setHeadings: (headings: HeadingItem[]) => void; // Update the extracted headings list
  updateSelection: (text: string, range: SelectionRange) => void; // Update selection info
  setIsSaved: (saved: boolean) => void; // Manually set the saved status
  setCurrentFile: (draft: Draft | null) => void; // Load a draft or reset for a new file
  setScrollToPercent: (percent: number | null) => void; // Action used by scroll sync

  // --- File Actions ---
  saveCurrentDraft: () => Promise<boolean>; // Save the current content as a draft
  createNewFile: () => void; // Reset editor state for a new file
  loadDraft: (id: string) => void; // Load a specific draft by ID
  loadLastOpenedDraft: () => void; // Load the last opened/saved draft on startup

  // --- Scroll Action ---
  scrollToPosition: (pos: number, yAlign?: 'start' | 'center' | 'end') => void; // Scroll editor to a specific position

  // --- Formatting Actions ---
  toggleBoldSelection: () => void;
  toggleItalicSelection: () => void;
  toggleCodeSelection: () => void;
  insertLink: () => void;
  toggleBulletList: () => void;
  toggleQuote: () => void;
  toggleCodeBlock: () => void;
}

// Helper function to calculate word and character counts
const calculateCounts = (
  text: string
): { wordCount: number; charCount: number } => {
  const cleanedText = text || '';
  const words = cleanedText.trim().split(/\s+/).filter(Boolean);
  return {
    wordCount: words.length,
    charCount: cleanedText.length,
  };
};

// Create the Zustand store
export const useEditorStore = create<EditorState>((set, get) => ({
  // --- Initial State ---
  markdown: '# Welcome\n\nStart typing your Markdown!', // Default content
  currentFileName: '',
  currentDraftId: null,
  isSaved: true,
  selectedText: '',
  selectionRange: { from: 0, to: 0 },
  headings: [],
  view: null,
  wordCount: 0, // Will be calculated after initial load
  charCount: 0, // Will be calculated after initial load
  scrollToPercent: null,

  // --- Actions Implementation ---
  setView: (view) => set({ view }),

  runCommand: (command, focus = true) => {
    const view = get().view;
    if (view) {
      command(view); // Execute the CodeMirror command
      if (focus) view.focus(); // Refocus the editor afterwards
    } else {
      console.warn('[editorStore] EditorView is not available to run command.');
    }
  },

  setMarkdown: (value) => {
    const { wordCount, charCount } = calculateCounts(value);
    set({ markdown: value, isSaved: false, wordCount, charCount }); // Update state, mark as unsaved
  },

  setHeadings: (headings) => set({ headings }),

  updateSelection: (text, range) =>
    set({ selectedText: text, selectionRange: range }),

  setIsSaved: (saved) => set({ isSaved: saved }),

  setCurrentFile: (draft) => {
    if (draft) {
      // Loading an existing draft
      const { wordCount, charCount } = calculateCounts(draft.content);
      set({
        markdown: draft.content,
        currentFileName: draft.fileName || `無題 (${draft.id.substring(0, 6)})`,
        currentDraftId: draft.id,
        isSaved: true, // Assume loaded content is "saved" initially
        selectedText: '',
        selectionRange: { from: 0, to: 0 },
        wordCount,
        charCount,
        headings: [], // Headings will be recalculated by PreviewPane
      });
      storageService.setCurrentDraftId(draft.id); // Update the last opened ID in storage
    } else {
      // Resetting for a new file
      const initialMarkdown = '# 新しいドキュメント\n\n';
      const { wordCount, charCount } = calculateCounts(initialMarkdown);
      set({
        markdown: initialMarkdown,
        currentFileName: '', // No filename initially
        currentDraftId: null,
        isSaved: true,
        selectedText: '',
        selectionRange: { from: 0, to: 0 },
        wordCount,
        charCount,
        headings: [],
      });
      storageService.clearCurrentDraftId(); // Clear the last opened ID
    }
  },

  setScrollToPercent: (percent) => set({ scrollToPercent: percent }),

  // --- File Actions Implementation ---
  saveCurrentDraft: async () => {
    const {
      markdown,
      currentFileName,
      currentDraftId,
      setIsSaved,
      setCurrentFile,
    } = get();
    let fileNameToSave = currentFileName;

    // Prompt for filename if it's missing
    if (!fileNameToSave) {
      const defaultName = `無題_${new Date().toLocaleDateString()}.md`;
      const name = window.prompt('ファイル名を入力してください:', defaultName);
      if (name) {
        fileNameToSave = name;
        // No need to set filename here, setCurrentFile will do it after save
      } else {
        toast.warning(
          'ファイル名が入力されなかったため、保存をキャンセルしました'
        );
        return false; // Cancel save if no filename provided
      }
    }

    try {
      // Call storage service to save
      const savedId = storageService.saveDraft(
        markdown,
        fileNameToSave,
        currentDraftId || undefined
      );
      if (savedId) {
        // Reload the saved draft into the store to ensure consistency
        const savedDraft = storageService.loadDraft(savedId);
        if (savedDraft) {
          setCurrentFile(savedDraft); // This updates state including isSaved=true
          toast.success(`下書き "${fileNameToSave}" を保存しました`);
          return true; // Indicate success
        }
      }
      // Throw error if save ID or re-load fails
      throw new Error(
        'Failed to get saved draft ID or load draft after saving.'
      );
    } catch (error) {
      console.error('[editorStore] Save draft error:', error);
      toast.error('下書きの保存に失敗しました');
      return false; // Indicate failure
    }
  },

  createNewFile: () => {
    const { setCurrentFile } = get(); // Get only the action to reset state
    // 常に確認ダイアログを表示
    if (!window.confirm('編集中の内容は破棄されます。新しいファイルを作成しますか？')) {
      return; // User cancelled
    }
    setCurrentFile(null); // Reset state for a new file
    // Clearing chat history should be handled by aiStore or component if needed
    // useAIStore.getState().clearChatHistory();
    toast.info('新規ファイルを作成しました');
  },

  loadDraft: (id: string) => {
    const { isSaved, setCurrentFile } = get();
    // Check for unsaved changes before loading
    if (!isSaved) {
      if (
        !window.confirm('編集中の内容は破棄されます。下書きを読み込みますか？')
      ) {
        return;
      }
    }
    const draft = storageService.loadDraft(id); // Load from storage
    if (draft) {
      setCurrentFile(draft); // Update store state
      toast.info(`下書き "${draft.fileName || draft.id}" を読み込みました`);
    } else {
      toast.error('下書きの読み込みに失敗しました');
    }
  },

  loadLastOpenedDraft: () => {
    const { setCurrentFile } = get();
    const lastDraft = storageService.loadLastDraft(); // Get last draft from storage
    if (lastDraft) {
      setCurrentFile(lastDraft); // Load it into the store
      console.info('[editorStore] Loaded last opened draft:', lastDraft.id);
    } else {
      // If no last draft, calculate counts for the initial default markdown
      const { markdown } = get();
      const { wordCount, charCount } = calculateCounts(markdown);
      set({ wordCount, charCount, currentDraftId: null }); // Ensure counts are set and ID is null
      console.info('[editorStore] No last draft found, using initial content.');
    }
  },

  // --- Scroll Action Implementation ---
  scrollToPosition: (pos, yAlign = 'start') => {
    const view = get().view;
    if (view) {
      // Use native scrollTo or dispatch a direct scroll command
      const line = view.state.doc.lineAt(pos);
      const coords = view.coordsAtPos(pos);
      if (coords) {
        view.scrollDOM.scrollTop = coords.top;
      }
    }
  },

  // --- Format Actions Implementation ---
  // These call runCommand with the specific command functions from cmCommands
  toggleBoldSelection: () =>
    get().runCommand(toggleSurroundingCharacters('**')),
  toggleItalicSelection: () =>
    get().runCommand(toggleSurroundingCharacters('_')),
  toggleCodeSelection: () => get().runCommand(toggleSurroundingCharacters('`')),
  insertLink: () => get().runCommand(insertLinkCommand),
  toggleBulletList: () => get().runCommand(toggleBulletListCommand),
  toggleQuote: () => get().runCommand(toggleQuoteCommand),
  toggleCodeBlock: () => get().runCommand(toggleCodeBlockCommand),
}));

// --- Initial Load ---
// Trigger loading the last opened draft immediately after the store is created
// This ensures the initial state reflects the last session if available.
useEditorStore.getState().loadLastOpenedDraft();
