import React, { useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/store/uiStore';
import { useEditorStore } from '@/store/editorStore';
import { useAIStore } from '@/store/aiStore';
import {
  Clipboard,
  ClipboardX,
  List,
  Quote,
  Code,
  Link,
  Bot,
} from 'lucide-react'; // Import icons
import { toast } from 'sonner';

export const EditorContextMenu: React.FC = () => {
  // --- Zustand Store Hooks ---
  // Get context menu state and actions from uiStore
  const {
    contextMenuOpen,
    contextMenuPosition,
    contextMenuContext,
    closeContextMenu,
    toggleChatOpen,
  } = useUIStore();
  // Get editor actions and state needed for menu items
  const {
    selectedText,
    view,
    runCommand, // Need 'view' for cut operation
    toggleBoldSelection,
    toggleItalicSelection,
    toggleCodeSelection,
    insertLink,
    toggleBulletList,
    toggleQuote,
    toggleCodeBlock,
  } = useEditorStore();
  // Get AI related actions
  const { setChatMode } = useAIStore();

  // Determine if text is currently selected based on context
  const hasSelection = contextMenuContext?.hasSelection ?? false;

  // --- Event Handlers ---
  // Trigger AI edit mode for the selected text
  const handleAiEdit = useCallback(() => {
    if (selectedText) {
      setChatMode('edit'); // Set AI mode to edit
      toggleChatOpen(); // Open the chat panel
      toast.info('選択範囲についてAIに指示してください'); // Notify user
      closeContextMenu(); // Close the context menu
    }
  }, [selectedText, setChatMode, toggleChatOpen, closeContextMenu]);

  // Copy selected text to clipboard using Clipboard API
  const handleCopy = useCallback(async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        toast.success('コピーしました');
      } catch (err) {
        console.error('Failed to copy text: ', err);
        toast.error('コピーに失敗しました');
      }
    }
    closeContextMenu();
  }, [selectedText, closeContextMenu]);

  // Cut selected text using Clipboard API and CodeMirror dispatch
  const handleCut = useCallback(async () => {
    if (selectedText && view) {
      // Requires EditorView instance
      try {
        await navigator.clipboard.writeText(selectedText);
        // Use runCommand to dispatch a change that deletes the selection
        runCommand((v) => {
          v.dispatch({
            changes: {
              from: v.state.selection.main.from,
              to: v.state.selection.main.to,
              insert: '',
            },
          });
          return true; // Indicate command was handled
        }, false); // Don't necessarily refocus after cut
        toast.success('カットしました');
      } catch (err) {
        console.error('Failed to cut text: ', err);
        toast.error('カットに失敗しました');
      }
    }
    closeContextMenu();
  }, [selectedText, view, runCommand, closeContextMenu]);

  // Helper to run an action and then close the menu
  const handleSelectAndClose = (action?: () => void) => {
    action?.(); // Execute the action if provided
    closeContextMenu(); // Close the menu
  };

  // --- Render ---
  return (
    // Use DropdownMenu component, controlled by Zustand store state
    <DropdownMenu
      open={contextMenuOpen}
      onOpenChange={(open) => !open && closeContextMenu()}
    >
      {/* No trigger needed, opened programmatically */}
      <DropdownMenuContent
        className="w-52" // Adjust width as needed
        style={{
          position: 'fixed', // Use fixed positioning based on click coordinates
          left: `${contextMenuPosition?.x ?? 0}px`,
          top: `${contextMenuPosition?.y ?? 0}px`,
        }}
        // Prevent focus shift back to a trigger on close
        onCloseAutoFocus={(e) => e.preventDefault()}
        // Close menu if user clicks outside
        onInteractOutside={closeContextMenu}
      >
        {/* Formatting Options Group */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={!hasSelection}
            onSelect={() => handleSelectAndClose(toggleBoldSelection)}
          >
            太字 <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasSelection}
            onSelect={() => handleSelectAndClose(toggleItalicSelection)}
          >
            斜体 <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasSelection}
            onSelect={() => handleSelectAndClose(toggleCodeSelection)}
          >
            <Code className="mr-2 h-4 w-4" />
            コード <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSelectAndClose(insertLink)}>
            {' '}
            {/* Link doesn't strictly require selection */}
            <Link className="mr-2 h-4 w-4" />
            リンク挿入 <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Block Formatting Options Group */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => handleSelectAndClose(toggleBulletList)}
          >
            <List className="mr-2 h-4 w-4" />
            リスト
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSelectAndClose(toggleQuote)}>
            <Quote className="mr-2 h-4 w-4" />
            引用
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleSelectAndClose(toggleCodeBlock)}
          >
            <Code className="mr-2 h-4 w-4" />
            コードブロック
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* AI Actions Group */}
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={!hasSelection} onSelect={handleAiEdit}>
            <Bot className="mr-2 h-4 w-4" />
            AIで編集...
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Clipboard Actions Group */}
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleCut} disabled={!hasSelection}>
            <ClipboardX className="mr-2 h-4 w-4" />
            カット <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopy} disabled={!hasSelection}>
            <Clipboard className="mr-2 h-4 w-4" />
            コピー <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          {/* Paste is hard to implement reliably from context menu */}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
