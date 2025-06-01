import { useCallback, useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { PreviewPane, PreviewPaneRef } from '@/components/PreviewPane'; // Import PreviewPaneRef type
import { useEditorStore } from '@/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { useAIStore } from '@/store/aiStore';
import { useAutosave } from '@/hooks/useAutosave';
import { storageService } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import type { ScrollInfo } from '@/types/editor'; // Import ScrollInfo type
import { useTheme } from '@/components/providers/ThemeProvider'; // Import useTheme
import { toast } from 'sonner'; // Import toast for notifications

// Props definition including the ref for PreviewPane
interface EditorLayoutContentProps {
  previewPaneRef: React.RefObject<PreviewPaneRef>;
}

export const EditorLayoutContent: React.FC<EditorLayoutContentProps> = ({
  previewPaneRef,
}) => {
  // --- Zustand Store Hooks ---
  const {
    markdown,
    selectedText,
    isSaved,
    setMarkdown,
    updateSelection,
    setIsSaved,
    setScrollToPercent: setEditorScrollToPercent,
  } = useEditorStore();
  const {
    activeTab,
    isChatOpen,
    setChatOpen,
    setPreviewScrollToPercent,
    previewScrollToPercent,
  } = useUIStore(); // Get scroll state/setter for preview
  const { setChatMode } = useAIStore();
  // --- Theme Hook ---
  const { theme } = useTheme();
  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // --- Refs for scroll sync logic ---
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isEditorScrolling = useRef(false);
  const isPreviewScrolling = useRef(false);
  const editorScrollInfoRef = useRef<ScrollInfo | null>(null); // Store latest scroll info
  const previewScrollInfoRef = useRef<ScrollInfo | null>(null);

  // --- Callbacks ---
  // Update markdown state in store when CodeMirror content changes
  const handleMarkdownChange = useCallback(
    (value: string): void => {
      setMarkdown(value);
    },
    [setMarkdown]
  );

  // Update selection state in store when CodeMirror selection changes
  const handleEditorSelectionChange = useCallback(
    (selected: string, from: number, to: number): void => {
      updateSelection(selected, { from, to });
    },
    [updateSelection]
  );

  // Handle click on the floating "AI Edit" button
  const handleAiEditClick = useCallback(() => {
    setChatMode('edit'); // Set AI mode
    setChatOpen(true); // Open chat panel
    toast.info('選択テキストについてAIに指示できます'); // Notify user
  }, [setChatMode, setChatOpen]);

  // --- Autosave Logic ---
  const handleAutoSave = useCallback(
    async (currentValue: string) => {
      const currentId = storageService.getCurrentDraftId();
      const fileNameToSave = useEditorStore.getState().currentFileName; // Get latest filename

      console.log('Autosaving draft...', {
        id: currentId,
        fileName: fileNameToSave,
      });

      const savedId = storageService.saveDraft(
        currentValue,
        fileNameToSave || null,
        currentId || undefined
      );

      if (savedId) {
        setIsSaved(true); // Update saved status in store
        // Optionally update filename in store if it was generated during save
        // if (!currentFileName && fileNameToSave) { setCurrentFileName(fileNameToSave); }
        console.log('Autosave successful, ID:', savedId);
        // Optionally show a subtle autosave indicator (e.g., in status bar)
        // toast.success('自動保存しました', { duration: 1500 });
      } else {
        console.error('Autosave failed');
        toast.error('自動保存に失敗しました');
      }
    },
    [setIsSaved /* setCurrentFileName */]
  ); // Dependencies for autosave callback

  // Activate autosave hook
  useAutosave(markdown, handleAutoSave, { isSaved, delay: 3000 }); // Autosave after 3s of inactivity if not saved

  // --- Scroll Sync Logic ---
  // Debounce function for scroll synchronization
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
  ) => {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<F>): void => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), waitFor);
    };
  };

  // Function to synchronize scrolls based on percentage
  const syncScroll = useCallback(
    (source: 'editor' | 'preview') => {
      const editorInfo = editorScrollInfoRef.current;
      const previewInfo = previewScrollInfoRef.current;

      if (!editorInfo || !previewInfo) return; // Need info from both

      const editorMaxScroll = editorInfo.scrollHeight - editorInfo.clientHeight;
      const previewMaxScroll =
        previewInfo.scrollHeight - previewInfo.clientHeight;

      // Avoid division by zero and unnecessary sync
      if (editorMaxScroll <= 0 || previewMaxScroll <= 0) return;

      if (source === 'editor' && !isPreviewScrolling.current) {
        const editorPercent = editorInfo.scrollTop / editorMaxScroll;
        // Check if preview scroll is already close enough
        const currentPreviewPercent = previewInfo.scrollTop / previewMaxScroll;
        if (Math.abs(editorPercent - currentPreviewPercent) > 0.01) {
          // Tolerance
          // console.log(`Syncing Preview to ${editorPercent.toFixed(2)}`);
          setPreviewScrollToPercent(editorPercent); // Trigger preview scroll via state/prop
        }
      } else if (source === 'preview' && !isEditorScrolling.current) {
        const previewPercent = previewInfo.scrollTop / previewMaxScroll;
        // Check if editor scroll is already close enough
        const currentEditorPercent = editorInfo.scrollTop / editorMaxScroll;
        if (Math.abs(previewPercent - currentEditorPercent) > 0.01) {
          // Tolerance
          // console.log(`Syncing Editor to ${previewPercent.toFixed(2)}`);
          // Trigger editor scroll via store action
          useEditorStore.getState().setScrollToPercent(previewPercent);
        }
      }
    },
    [setPreviewScrollToPercent]
  ); // Dependencies

  // Debounced version of the sync function
  const debouncedSyncScroll = useCallback(debounce(syncScroll, 50), [
    syncScroll,
  ]); // 50ms debounce

  // Editor scroll handler
  const handleEditorScroll = useCallback(
    (info: ScrollInfo) => {
      editorScrollInfoRef.current = info; // Update latest info
      // If the other pane is programmatically scrolling, ignore this event briefly
      if (isPreviewScrolling.current) return;

      isEditorScrolling.current = true; // Mark editor as the source of scroll
      isPreviewScrolling.current = false;
      debouncedSyncScroll('editor'); // Trigger debounced sync

      // Reset the scrolling source flag after a short delay
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        isEditorScrolling.current = false;
        syncTimeoutRef.current = null;
      }, 150); // Adjust delay as needed
    },
    [debouncedSyncScroll]
  );

  // Preview scroll handler
  const handlePreviewScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      // Extract scroll info from event target
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const info: ScrollInfo = { scrollTop, scrollHeight, clientHeight }; // Create ScrollInfo object

      previewScrollInfoRef.current = info; // Update latest info
      // If the other pane is programmatically scrolling, ignore this event briefly
      if (isEditorScrolling.current) return;

      isPreviewScrolling.current = true; // Mark preview as the source
      isEditorScrolling.current = false;
      debouncedSyncScroll('preview'); // Trigger debounced sync

      // Reset the scrolling source flag after a short delay
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        isPreviewScrolling.current = false;
        syncTimeoutRef.current = null;
      }, 150);
    },
    [debouncedSyncScroll]
  );

  // --- Context Menu Handler (Moved from EditorPage for better context) ---
  const { openContextMenu, closeContextMenu } = useUIStore();
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      // Prevent default only if clicking inside CodeMirror or potentially Preview
      const target = event.target as HTMLElement;
      const codeMirrorContainer = (
        event.currentTarget as HTMLDivElement
      ).querySelector('.codemirror-container');
      // Only open custom menu if right-clicking within the editor area
      if (codeMirrorContainer?.contains(target)) {
        event.preventDefault();
        closeContextMenu(); // Close any existing menu first

        const position = { x: event.clientX, y: event.clientY };
        const currentSelectedText = useEditorStore.getState().selectedText; // Get latest selection
        const context = {
          hasSelection: currentSelectedText.length > 0,
        };

        setTimeout(() => {
          openContextMenu(position, context);
        }, 50);
      }
      // Allow default context menu for other areas (like preview pane)
    },
    [openContextMenu, closeContextMenu]
  );

  // --- Render ---
  return (
    // Attach context menu handler to the main container
    <div
      className="flex-grow flex h-full overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      {/* Editor Pane */}
      {(activeTab === 'edit' || activeTab === 'split') && (
        // Use Shadcn border variable
        <div
          data-testid="editor-pane"
          className={`relative ${activeTab === 'split' ? 'w-1/2' : 'w-full'} h-full border-r border-border`}
        >
          <CodeMirrorEditor
            // Use isDarkMode for key to ensure theme re-renders correctly on change
            key={isDarkMode ? 'dark-mode' : 'light-mode'}
            value={markdown}
            onChange={handleMarkdownChange}
            isDarkMode={isDarkMode}
            onSelectionChange={handleEditorSelectionChange}
            // Only attach scroll handler in split view
            onScroll={activeTab === 'split' ? handleEditorScroll : undefined}
          />
          {/* Floating AI Edit Button */}
          {selectedText && !isChatOpen && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="xs" // Use predefined small size
                onClick={handleAiEditClick}
                className="shadow-md h-6 px-2" // Adjust padding/height if needed
                title="選択部分についてAIに指示する"
              >
                <Bot className="h-3 w-3 mr-1" /> AIで編集
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Preview Pane */}
      {(activeTab === 'preview' || activeTab === 'split') && (
        <div className={`${activeTab === 'split' ? 'w-1/2' : 'w-full'} h-full`}>
          <PreviewPane
            ref={previewPaneRef} // Pass the ref for TOC scrolling
            // Only attach scroll handler in split view
            onScroll={activeTab === 'split' ? handlePreviewScroll : undefined}
          />
        </div>
      )}
    </div>
  );
};
