// src/components/SearchReplaceDialog.tsx
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // DialogClose, // DialogClose is implicitly handled by onOpenChange or can be explicit
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/store/uiStore';
import { useEditorStore } from '@/store/editorStore';
import {
  findNextCommand,
  findPreviousCommand,
  replaceCurrentCommand,
  replaceAllCommand,
  SearchOptions, // Import SearchOptions type
} from '@/lib/cmCommands';

// No props needed if all interactions are via store
// interface SearchReplaceDialogProps {}

export const SearchReplaceDialog: React.FC = () => {
  const {
    isSearchReplaceDialogOpen,
    closeSearchReplaceDialog,
    searchTerm,
    setSearchTerm,
    replaceTerm,
    setReplaceTerm,
    searchOptions,
    setSearchOptions,
  } = useUIStore();

  const { view } = useEditorStore();
  const [message, setMessage] = React.useState('');

  const handleFindNext = () => {
    setMessage('');
    if (!view || !searchTerm) {
      setMessage(searchTerm ? 'Editor view not available.' : 'Please enter a search term.');
      return;
    }
    const found = findNextCommand(view, searchTerm, searchOptions as SearchOptions);
    if (!found) {
      setMessage('Text not found');
    }
  };

  const handleFindPrevious = () => {
    setMessage('');
    if (!view || !searchTerm) {
      setMessage(searchTerm ? 'Editor view not available.' : 'Please enter a search term.');
      return;
    }
    const found = findPreviousCommand(view, searchTerm, searchOptions as SearchOptions);
    if (!found) {
      setMessage('Text not found');
    }
  };

  const handleReplace = () => {
    setMessage('');
    if (!view || !searchTerm) {
      setMessage(searchTerm ? 'Editor view not available.' : 'Please enter a search term.');
      return;
    }
    const replaced = replaceCurrentCommand(view, searchTerm, replaceTerm, searchOptions as SearchOptions);
    if (replaced) {
      setMessage('Replaced current occurrence.');
      // Optionally find next after replace
      // handleFindNext();
    } else {
      setMessage('Text not found to replace, or no match selected.');
    }
  };

  const handleReplaceAll = () => {
    setMessage('');
    if (!view || !searchTerm) {
      setMessage(searchTerm ? 'Editor view not available.' : 'Please enter a search term.');
      return;
    }
    const count = replaceAllCommand(view, searchTerm, replaceTerm, searchOptions as SearchOptions);
    if (count > 0) {
      setMessage(`${count} occurrence(s) replaced.`);
    } else {
      setMessage('No occurrences found to replace.');
    }
  };

  // This effect clears the message when the dialog is closed or search term changes
  React.useEffect(() => {
    if (!isSearchReplaceDialogOpen) {
      setMessage('');
    }
  }, [isSearchReplaceDialogOpen]);

  React.useEffect(() => {
    setMessage('');
  }, [searchTerm, replaceTerm, searchOptions]);


  if (!isSearchReplaceDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isSearchReplaceDialogOpen} onOpenChange={(open) => {
      if (!open) {
        closeSearchReplaceDialog();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={closeSearchReplaceDialog}>
        <DialogHeader>
          <DialogTitle>Search and Replace</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search-term" className="text-right">
              Search
            </Label>
            <Input
              id="search-term"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-3"
              aria-label="Search term"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="replace-term" className="text-right">
              Replace
            </Label>
            <Input
              id="replace-term"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="col-span-3"
              aria-label="Replace term"
            />
          </div>
          <div className="flex items-center space-x-2 col-start-2 col-span-3">
            <Checkbox
              id="regex"
              checked={searchOptions.isRegex}
              onCheckedChange={(checked) => setSearchOptions({ isRegex: Boolean(checked) })}
              aria-label="Regular expression"
            />
            <Label htmlFor="regex" className="font-normal cursor-pointer">
              Regular Expression
            </Label>
          </div>
          <div className="flex items-center space-x-2 col-start-2 col-span-3">
            <Checkbox
              id="case-sensitive"
              checked={searchOptions.caseSensitive}
              onCheckedChange={(checked) => setSearchOptions({ caseSensitive: Boolean(checked) })}
              aria-label="Case sensitive"
            />
            <Label htmlFor="case-sensitive" className="font-normal cursor-pointer">
              Case Sensitive
            </Label>
          </div>
          {/* Optional: Whole Word (if implemented in cmCommands)
          <div className="flex items-center space-x-2 col-start-2 col-span-3">
            <Checkbox
              id="whole-word"
              checked={searchOptions.wholeWord} // Assuming wholeWord is added to store's searchOptions
              onCheckedChange={(checked) => setSearchOptions({ wholeWord: Boolean(checked) })}
              aria-label="Whole word"
            />
            <Label htmlFor="whole-word" className="font-normal cursor-pointer">
              Whole Word
            </Label>
          </div>
          */}
          {message && (
            <div className="col-span-4 text-sm text-muted-foreground p-1 text-center">
              {message}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleFindNext}>
              Find Next
            </Button>
            <Button type="button" variant="outline" onClick={handleFindPrevious}>
              Find Prev
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="default" onClick={handleReplace}>
              Replace
            </Button>
            <Button type="button" variant="default" onClick={handleReplaceAll}>
              Replace All
            </Button>
          </div>
        </DialogFooter>
        {/* The DialogClose is part of DialogContent in shadcn/ui and handles the X button.
            The onOpenChange on Dialog root handles closing via overlay click/escape. */}
      </DialogContent>
    </Dialog>
  );
};
