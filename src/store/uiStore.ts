import { create } from 'zustand';
import type { EditorTab } from '@/types/editor'; // Import shared types
import type { AISuggestion } from '@/types/ai';

// Type definition for context menu context data
interface ContextMenuContext {
  hasSelection: boolean;
  // Add other contextual info if needed in the future
  // e.g., clickedElementType: 'text' | 'image' | 'link'
}

// Define the shape of the UI state and its actions
interface UIState {
  // Layout and Panel States
  activeTab: EditorTab; // Current view mode (edit, split, preview)
  isChatOpen: boolean; // Whether the AI chat panel is open

  // AI Suggestion Dialog State
  isPreviewOpen: boolean; // Whether the suggestion dialog is open
  aiSuggestion: AISuggestion | null; // The suggestion data to display
  originalMarkdownForDiff: string; // Original markdown for diff view in dialog
  diffView: boolean; // Whether the dialog is showing diff or preview

  // Context Menu State
  contextMenuOpen: boolean; // Whether the custom context menu is open
  contextMenuPosition: { x: number; y: number } | null; // Position to display the menu
  contextMenuContext: ContextMenuContext | null; // Contextual info for the menu

  // Scroll Sync State (for Preview Pane)
  previewScrollToPercent: number | null; // Instruction to scroll PreviewPane

  // --- Actions ---
  setActiveTab: (tab: EditorTab) => void;
  setChatOpen: (isOpen: boolean) => void;
  openPreviewDialog: (
    suggestion: AISuggestion,
    originalMarkdown: string
  ) => void;
  closePreviewDialog: () => void;
  toggleDiffView: () => void;
  openContextMenu: (
    position: { x: number; y: number },
    context: ContextMenuContext
  ) => void;
  closeContextMenu: () => void;
  setPreviewScrollToPercent: (percent: number | null) => void;
}

// Create the Zustand store for UI state
export const useUIStore = create<UIState>((set, get) => ({
  // --- Initial State ---
  activeTab: 'split', // Default to split view
  isChatOpen: false,
  isPreviewOpen: false,
  aiSuggestion: null,
  originalMarkdownForDiff: '',
  diffView: false,
  contextMenuOpen: false,
  contextMenuPosition: null,
  contextMenuContext: null,
  previewScrollToPercent: null,

  // --- Actions Implementation ---
  setActiveTab: (tab) => set({ activeTab: tab }),

  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

  openPreviewDialog: (suggestion, originalMarkdown) =>
    set({
      isPreviewOpen: true,
      aiSuggestion: suggestion,
      originalMarkdownForDiff: originalMarkdown,
      diffView: false, // Always start preview in normal mode
    }),

  closePreviewDialog: () =>
    set({
      isPreviewOpen: false,
      // Keep suggestion/originalMarkdown briefly for fade-out animations if needed,
      // or clear them immediately:
      // aiSuggestion: null,
      // originalMarkdownForDiff: '',
    }),

  toggleDiffView: () => set((state) => ({ diffView: !state.diffView })),

  openContextMenu: (position, context) =>
    set({
      contextMenuOpen: true,
      contextMenuPosition: position,
      contextMenuContext: context,
    }),

  closeContextMenu: () =>
    set({
      contextMenuOpen: false,
      // Optionally reset position and context when closing
      // contextMenuPosition: null,
      // contextMenuContext: null,
    }),

  setPreviewScrollToPercent: (percent) =>
    set({ previewScrollToPercent: percent }),
}));

// Note: Dark mode state is now managed by ThemeProvider and useTheme hook.
// Notification state was removed in favor of directly using sonner's toast function.
