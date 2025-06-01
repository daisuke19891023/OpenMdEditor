import { useCallback, useState, useEffect } from 'react';
import type { FC } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useUIStore } from '@/store/uiStore';
// import { useAIStore } from '@/store/aiStore'; // Not directly needed here anymore
import { EditorTab, Draft } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FilePlus, FolderOpen, Save, Trash2, Search } from 'lucide-react'; // Added Search
import { storageService } from '@/lib/storageService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner'; // Import toast for notifications

export const EditorToolbar: FC = () => {
  // --- Zustand Store Hooks ---
  // Get state and actions from stores
  const {
    isSaved,
    createNewFile: createAction,
    saveCurrentDraft: saveAction,
    loadDraft: loadAction,
  } = useEditorStore();
  const { activeTab, setActiveTab, openSearchReplaceDialog } = useUIStore(); // Added openSearchReplaceDialog

  // --- Local State ---
  // State to hold the list of drafts for the "Open" dropdown
  const [drafts, setDrafts] = useState<Draft[]>([]);
  // State to hold the draft selected for deletion confirmation
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);

  // --- Action Wrappers (using useCallback for stability) ---
  const handleCreateNewFile = useCallback(() => createAction(), [createAction]);
  const handleSave = useCallback(() => {
    saveAction().catch((err) => console.error('Manual save failed', err)); // Handle potential async errors
  }, [saveAction]);
  const handleLoadDraft = useCallback(
    (id: string) => loadAction(id),
    [loadAction]
  );

  // --- Draft List Management ---
  // Fetch drafts from storage when the "Open" menu is about to open
  const fetchDrafts = useCallback(() => {
    setDrafts(storageService.getAllDrafts());
  }, []);

  // Handle deletion of a draft after confirmation
  const handleDeleteDraft = useCallback(() => {
    if (draftToDelete) {
      const success = storageService.deleteDraft(draftToDelete.id);
      if (success) {
        toast.success(
          `下書き "${draftToDelete.fileName || draftToDelete.id}" を削除しました`
        );
        setDraftToDelete(null); // Clear deletion target
        fetchDrafts(); // Refresh the draft list
        // Check if the currently loaded draft was deleted
        if (storageService.getCurrentDraftId() === null) {
          // Optional: Automatically create a new file if the current one was deleted
          // handleCreateNewFile();
        }
      } else {
        toast.error('下書きの削除に失敗しました');
      }
    }
  }, [draftToDelete, fetchDrafts /* handleCreateNewFile */]); // Include create if used

  // --- View Mode Toggle Handler ---
  const handleTabChange = (value: string) => {
    if (value) {
      // Ensure a value was selected
      setActiveTab(value as EditorTab);
    }
  };

  // --- Render ---
  return (
    // Use Shadcn UI theme variables for background and borders
    <div
      role="toolbar" // Add role="toolbar" for accessibility and testing
      className="bg-muted/40 p-2 flex justify-between items-center border-b flex-shrink-0 h-12"
    >
      {' '}
      {/* Fixed height */}
      {/* Left Section: File Actions */}
      <div className="flex space-x-1">
        {/* New File Button */}
        <Button variant="ghost" size="sm" onClick={handleCreateNewFile}>
          <FilePlus className="h-4 w-4 mr-1" /> 新規
        </Button>

        {/* Open Draft Dropdown */}
        <DropdownMenu onOpenChange={(open: boolean) => open && fetchDrafts()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <FolderOpen className="h-4 w-4 mr-1" /> 開く
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {' '}
            {/* Adjust width */}
            <DropdownMenuLabel>最近の下書き</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {drafts.length === 0 && (
              <DropdownMenuItem disabled>下書きはありません</DropdownMenuItem>
            )}
            {/* Map through fetched drafts */}
            {drafts.map((draft) => (
              <DropdownMenuItem
                key={draft.id}
                className="flex justify-between items-center pr-2" // Adjust padding
                onSelect={(e: Event) => e.preventDefault()} // Prevent closing on item click itself
              >
                {/* Clickable area to load the draft */}
                <span
                  onClick={() => handleLoadDraft(draft.id)}
                  className="flex-grow cursor-pointer truncate pr-2" // Truncate long names
                  title={
                    draft.fileName ||
                    `無題 (${new Date(draft.lastModified).toLocaleString()})`
                  }
                >
                  {draft.fileName ||
                    `無題 (${new Date(draft.lastModified).toLocaleDateString()})`}{' '}
                  {/* Shorter date */}
                </span>
                {/* Delete Button with Confirmation Dialog */}
                <AlertDialog
                  onOpenChange={(open: boolean) =>
                    !open && setDraftToDelete(null)
                  }
                >
                  <AlertDialogTrigger asChild>
                    {/* Make delete button less prominent until hover */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="削除"
                      className="h-6 w-6 ml-auto opacity-50 hover:opacity-100 focus-visible:opacity-100 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftToDelete(draft);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>下書きの削除</AlertDialogTitle>
                      <AlertDialogDescription>
                        「{draft.fileName || draft.id}
                        」を削除しますか？この操作は元に戻せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="confirm-delete-button"
                        onClick={handleDeleteDraft}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        削除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save Button */}
        <Button variant="ghost" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" /> 保存
          {/* Unsaved indicator dot */}
          {!isSaved && (
            <span className="ml-1 text-xs text-blue-500 dark:text-blue-400">
              •
            </span>
          )}
        </Button>

        {/* Search and Replace Button - NEW */}
        <Button variant="ghost" size="sm" onClick={openSearchReplaceDialog}>
          <Search className="h-4 w-4 mr-1" /> 検索
        </Button>
      </div>
      {/* Center Section: View Mode Toggle */}
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={handleTabChange}
        size="sm"
        variant="outline" // Use outline variant
      >
        <ToggleGroupItem value="edit" aria-label="編集モード" role="tab">
          編集
        </ToggleGroupItem>
        <ToggleGroupItem value="split" aria-label="分割モード" role="tab">
          分割
        </ToggleGroupItem>
        <ToggleGroupItem
          value="preview"
          aria-label="プレビューモード"
          role="tab"
        >
          プレビュー
        </ToggleGroupItem>
      </ToggleGroup>
      {/* Right Section: Placeholder */}
      <div className="w-[100px]"></div>{' '}
      {/* Adjust width as needed for balance */}
    </div>
  );
};
