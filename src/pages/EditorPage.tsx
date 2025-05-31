import React, { useEffect, useRef, useCallback } from 'react';
import { EditorHeader } from '@/components/EditorHeader';
import { EditorToolbar } from '@/components/EditorToolbar';
import { EditorLayoutContent } from '@/components/EditorLayoutContent'; // Renamed from EditorLayout
import { EditorStatusBar } from '@/components/EditorStatusBar';
import React, { useEffect, useRef, useCallback } from 'react';
import { EditorHeader } from '@/components/EditorHeader';
import { EditorToolbar } from '@/components/EditorToolbar';
import { EditorLayoutContent } from '@/components/EditorLayoutContent'; // Renamed from EditorLayout
import { EditorStatusBar } from '@/components/EditorStatusBar';
import { AiChatPanel } from '@/components/AiChatPanel';
import { AiSuggestionDialog } from '@/components/AiSuggestionDialog';
import { SearchReplaceDialog } from '@/components/SearchReplaceDialog'; // <-- Import here
import { Toaster } from '@/components/ui/sonner'; // Use Shadcn Sonner for notifications
import { TableOfContents } from '@/components/TableOfContents';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'; // Import Resizable components
import { EditorContextMenu } from '@/components/EditorContextMenu'; // Import Context Menu
import { useEditorStore } from '@/store/editorStore'; // Import stores
import { useUIStore } from '@/store/uiStore';
import type { PreviewPaneRef } from '@/components/PreviewPane'; // Import Ref type

/**
 * Main application page component that orchestrates the editor layout and features.
 */
const EditorPage: React.FC = () => {
  // Ref for accessing PreviewPane methods (like scrolling)
  const previewPaneRef = useRef<PreviewPaneRef>(null);
  // Get actions from Zustand stores needed for global shortcuts or coordination
  const {
    saveCurrentDraft: saveAction,
    createNewFile: createAction,
    loadLastOpenedDraft,
  } = useEditorStore();
  const { isChatOpen, setChatOpen, setActiveTab } = useUIStore();

  // --- Effects ---
  // Load the last opened draft when the application mounts
  useEffect(() => {
    loadLastOpenedDraft();
  }, [loadLastOpenedDraft]); // Dependency: loadLastOpenedDraft action

  // --- Global Shortcut Actions (memoized with useCallback) ---
  // Wrapper for save action to be used in shortcuts
  const saveCurrentDraft = useCallback(() => {
    saveAction().catch((err) =>
      console.error('Save failed from shortcut', err)
    );
  }, [saveAction]);

  // Wrapper for new file action
  const createNewFile = useCallback(() => {
    createAction();
  }, [createAction]);

  // --- Global Keyboard Shortcut Handler ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if focus is inside an input/textarea to avoid overriding typing
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow specific shortcuts even in inputs (like Cmd+Enter in chat)
        if (
          !(
            (event.metaKey || event.ctrlKey) &&
            event.key === 'Enter' &&
            target.tagName === 'TEXTAREA'
          )
        ) {
          // return; // Uncomment this line to disable most global shortcuts when typing
        }
      }

      // File Operations
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        saveCurrentDraft();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        createNewFile();
      }
      // Add Cmd/Ctrl+O later if needed for "Open" modal

      // UI Toggles
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault();
        setChatOpen(!isChatOpen);
      }

      // View Mode Switching (Example: Cmd/Ctrl+Alt+1/2/3)
      if ((event.metaKey || event.ctrlKey) && event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setActiveTab('edit');
            break;
          case '2':
            event.preventDefault();
            setActiveTab('split');
            break;
          case '3':
            event.preventDefault();
            setActiveTab('preview');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Cleanup listener on unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentDraft, createNewFile, isChatOpen, setChatOpen, setActiveTab]); // Dependencies for the effect

  // --- Table of Contents Click Handler ---
  // Scrolls the preview pane to the clicked heading
  const handleTocHeadingClick = useCallback((id: string) => {
    previewPaneRef.current?.scrollToHeading(id); // Call method on PreviewPane ref
  }, []); // No dependencies needed as ref access is stable

  // --- Render ---
  return (
    // Main container with flex column layout and theme background/foreground
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {' '}
      {/* Prevent body scroll */}
      {/* Header Component */}
      <EditorHeader />
      {/* Toolbar Component */}
      <EditorToolbar />
      {/* Resizable Main Content Area */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow border-t overflow-hidden"
      >
        {' '}
        {/* flex-grow and overflow */}
        {/* Left Panel: Table of Contents */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          className="h-full overflow-y-auto bg-muted/20"
        >
          {' '}
          {/* Added bg and scroll */}
          <TableOfContents onHeadingClick={handleTocHeadingClick} />
        </ResizablePanel>
        {/* Handle for resizing */}
        <ResizableHandle withHandle />
        {/* Right Panel: Editor and Preview */}
        <ResizablePanel defaultSize={80} className="h-full flex flex-col">
          {' '}
          {/* flex-col needed for layout content */}
          {/* Component containing Editor/Preview layout logic */}
          <EditorLayoutContent previewPaneRef={previewPaneRef} />
        </ResizablePanel>
      </ResizablePanelGroup>
      {/* Status Bar Component */}
      <EditorStatusBar />
      {/* AI Chat Panel Component (includes FAB) */}
      <AiChatPanel />
      {/* AI Suggestion Dialog Component (conditionally rendered) */}
      <AiSuggestionDialog />
      {/* Context Menu Component (conditionally rendered based on store state) */}
      <EditorContextMenu />
      {/* Search and Replace Dialog (conditionally rendered based on store state) */}
      <SearchReplaceDialog />
      {/* Notification Toaster Component */}
      <Toaster richColors position="top-right" closeButton />{' '}
      {/* Added closeButton */}
    </div>
  );
};

export default EditorPage;
