import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useUIStore } from '@/store/uiStore';

export const EditorStatusBar: FC = () => {
  // Get word and character counts from the editor store
  const { wordCount, charCount } = useEditorStore();

  return (
    // Use Shadcn UI theme variables for colors and borders
    <div
      role="status"
      className="bg-muted/40 px-4 py-1 flex justify-end items-center border-t flex-shrink-0 text-sm text-muted-foreground h-8"
    >
      {' '}
      {/* Fixed height */}
      {/* Display word count */}
      <span>{wordCount} 単語</span>
      {/* Separator */}
      <span className="mx-2">|</span>
      {/* Display character count */}
      <span>{charCount} 文字</span>
      {/* Placeholder for other potential status indicators (e.g., autosave status, cursor position) */}
    </div>
  );
};
