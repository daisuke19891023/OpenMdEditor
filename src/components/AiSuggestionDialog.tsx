import React, { useCallback } from 'react';
import { useUIStore } from '@/store/uiStore'; // Dialog state from uiStore
import { useEditorStore } from '@/store/editorStore';
import { getDiffHtml } from '@/lib/diffUtils';
import { parseMarkdown } from '@/lib/markdownParser';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner'; // For notifications

export const AiSuggestionDialog: React.FC = () => {
  // --- Zustand Store Hooks ---
  // Get dialog state and actions from uiStore
  const {
    isPreviewOpen,
    aiSuggestion,
    originalMarkdownForDiff,
    diffView,
    closePreviewDialog,
    toggleDiffView,
  } = useUIStore();
  // Get editor state and actions needed for applying suggestions
  const { selectedText, selectionRange, setMarkdown, updateSelection } =
    useEditorStore();

  // --- Event Handlers ---
  // Apply the entire AI suggestion to the editor
  const applyAiSuggestion = useCallback((): void => {
    if (aiSuggestion?.markdown) {
      setMarkdown(aiSuggestion.markdown); // Update editor content
      closePreviewDialog(); // Close the dialog via store action
      toast.success('AIの提案を適用しました'); // Show success notification
    }
  }, [aiSuggestion, setMarkdown, closePreviewDialog]);

  // Apply the AI suggestion only to the currently selected text range
  const applyToSelectedOnly = useCallback((): void => {
    // Check if suggestion exists, text is selected, and suggestion type is for selection edit
    if (
      aiSuggestion?.markdown &&
      selectedText &&
      aiSuggestion.type === 'edit_selection'
    ) {
      const editedSelection = aiSuggestion.markdown;
      const { from, to } = selectionRange; // Get selection range from editorStore
      const originalFullMarkdown = useEditorStore.getState().markdown; // Get current full markdown

      // Construct new markdown by replacing the selected part
      const newMarkdown =
        originalFullMarkdown.substring(0, from) +
        editedSelection +
        originalFullMarkdown.substring(to);

      setMarkdown(newMarkdown); // Update editor content
      updateSelection('', { from: 0, to: 0 }); // Clear selection
      closePreviewDialog(); // Close the dialog
      toast.success('選択部分にAIの提案を適用しました');
    } else {
      // Show warning if conditions for partial apply are not met
      toast.warning(
        '部分適用を行うには、テキストを選択し、AIが選択範囲の編集提案を返す必要があります。'
      );
    }
  }, [
    aiSuggestion,
    selectedText,
    selectionRange,
    setMarkdown,
    updateSelection,
    closePreviewDialog,
  ]);

  // Handle dialog open/close state changes (sync with store)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closePreviewDialog(); // Call store action to close
    }
    // Opening is handled by the openPreviewDialog action in the store
  };

  // --- Render ---
  // Do not render if the dialog should not be open or there's no suggestion
  if (!isPreviewOpen || !aiSuggestion) {
    return null;
  }

  return (
    <Dialog open={isPreviewOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[80vw] w-auto h-[80vh] flex flex-col">
        {/* Dialog Header */}
        <DialogHeader>
          <DialogTitle>AIの提案プレビュー</DialogTitle>
        </DialogHeader>

        {/* Dialog Content (Preview or Diff) */}
        <div className="flex-grow overflow-auto p-4 -mx-6 px-6 border-y">
          {diffView ? (
            // Show diff view if diffView state is true
            <div
              className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: getDiffHtml(
                  originalMarkdownForDiff,
                  aiSuggestion.markdown
                ),
              }}
            />
          ) : (
            // Show normal preview otherwise
            <div
              // Apply Tailwind Typography styles for Markdown rendering
              className={`prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none`}
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(aiSuggestion.markdown),
              }}
            />
          )}
        </div>

        {/* Dialog Footer with Action Buttons */}
        <DialogFooter className="mt-auto pt-4">
          <div className="flex justify-between w-full items-center">
            {/* Toggle Diff/Preview Button */}
            <Button variant="outline" size="sm" onClick={toggleDiffView}>
              {diffView ? '通常プレビュー' : '差分表示'}
            </Button>
            {/* Action Buttons */}
            <div className="flex space-x-2">
              {/* Apply to Selection Button (conditional) */}
              {selectedText && aiSuggestion.type === 'edit_selection' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={applyToSelectedOnly}
                >
                  選択部分に適用
                </Button>
              )}
              {/* Cancel Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                キャンセル
              </Button>
              {/* Apply Full Suggestion Button */}
              <Button size="sm" onClick={applyAiSuggestion}>
                {aiSuggestion.type === 'create'
                  ? 'エディタに挿入'
                  : '全体に適用'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
