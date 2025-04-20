import React, { useEffect, useRef } from 'react';
import {
  EditorState,
  Extension,
  EditorSelection,
  Transaction,
  StateEffect,
} from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  ViewUpdate,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  toggleComment,
  indentLess,
  indentMore,
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark'; // Default dark theme
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { useEditorStore } from '@/store/editorStore';
import { markdownKeymap } from '@/lib/cmCommands'; // Import custom keymap
import type { ScrollInfo } from '@/types/editor'; // Import shared type

// --- Component Props ---
interface CodeMirrorEditorProps {
  value: string; // Current markdown value
  onChange: (value: string) => void; // Callback when content changes
  isDarkMode: boolean; // Theme control
  onSelectionChange: (selectedText: string, from: number, to: number) => void; // Callback for selection changes
  onScroll?: (info: ScrollInfo) => void; // Callback for scroll events (for sync)
}

// --- CodeMirror Setup (Moved outside component for clarity) ---

// Basic setup extensions (consider customizing or using @codemirror/basic-setup)
const basicExtensions: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(), // Undo/redo
  foldGutter(), // Code folding
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }), // Default syntax highlighting
  bracketMatching(), // Highlight matching brackets
  closeBrackets(), // Auto-close brackets
  autocompletion(), // Basic autocompletion
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(), // Highlight matching search terms
];

// Keymap extensions (combining standard and custom)
const editorKeymap: Extension = keymap.of([
  ...defaultKeymap, // Standard keybindings (cut, copy, paste, etc.)
  ...historyKeymap,
  ...closeBracketsKeymap,
  ...completionKeymap,
  ...searchKeymap,
  ...foldKeymap,
  ...lintKeymap, // If using linting extensions
  indentWithTab, // Use Tab for indentation
  ...markdownKeymap, // Custom markdown formatting shortcuts
]);

// Markdown language support
const markdownSupport: Extension = markdown({
  base: markdownLanguage,
  codeLanguages: languages, // Highlight code blocks based on language (e.g., ```js)
  addKeymap: true, // Add default markdown keybindings (like * for italic)
});

// --- Component Definition ---
const CodeMirrorEditor = ({
  value,
  onChange,
  isDarkMode,
  onSelectionChange,
  onScroll,
}: CodeMirrorEditorProps): React.ReactElement => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { setView } = useEditorStore(); // Get action to register the view instance
  const onScrollRef = useRef(onScroll); // Use ref for scroll callback to avoid effect re-runs

  // Keep the onScroll callback ref up-to-date
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  // --- Initialize CodeMirror ---
  useEffect(() => {
    let view: EditorView | null = null; // Local variable for cleanup

    if (editorRef.current && !viewRef.current) {
      // Only initialize once
      const themeExtension = isDarkMode
        ? oneDark // Use One Dark theme if dark mode is enabled
        : syntaxHighlighting(defaultHighlightStyle, { fallback: true }); // Use default light theme otherwise

      const extensions: Extension[] = [
        basicExtensions,
        markdownSupport,
        // Listener for document and selection changes
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
          if (update.selectionSet) {
            const selection = update.state.selection.main;
            const selectedText = update.state.doc.sliceString(
              selection.from,
              selection.to
            );
            onSelectionChange(selectedText, selection.from, selection.to);
          }
        }),
        // Listener for scroll events using domEventHandlers
        EditorView.domEventHandlers({
          scroll(event: Event, view: EditorView) {
            if (onScrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM;
              onScrollRef.current({ scrollTop, scrollHeight, clientHeight });
            }
          },
        }),
        themeExtension, // Apply the selected theme
        editorKeymap, // Apply combined keymaps
      ]
        .flat()
        .filter((ext): ext is Extension => !!ext); // Flatten and filter out null/undefined

      const startState = EditorState.create({
        doc: value, // Initial document content
        extensions: extensions,
      });

      view = new EditorView({
        state: startState,
        parent: editorRef.current, // Attach to the ref div
      });

      viewRef.current = view; // Store the view instance in a ref
      setView(view); // Register the view instance in the Zustand store
      console.log('CodeMirror view initialized and set to store.');
    }

    // --- Cleanup on unmount ---
    return () => {
      if (viewRef.current) {
        console.log('Destroying CodeMirror view and clearing from store.');
        viewRef.current.destroy(); // Destroy the CodeMirror instance
        viewRef.current = null;
        setView(null); // Clear the view instance from the store
      }
    };
    // Dependencies: Only run on initial mount. Theme/value changes are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handle external value changes ---
  // Update CodeMirror if the 'value' prop changes from outside
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      const currentDoc = view.state.doc.toString();
      if (value !== currentDoc) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value },
          // Avoid resetting selection/cursor on external changes if possible
          // selection: view.state.selection,
          // scrollIntoView: true,
        });
      }
    }
  }, [value]); // Re-run only when the external 'value' prop changes

  // --- Handle external scroll commands via Zustand store ---
  useEffect(() => {
    // Subscribe to changes in the editor store
    const unsubscribe = useEditorStore.subscribe(
      // Listener function triggered on every state change
      (state, prevState) => {
        // Check if scrollToPercent has changed and is not null
        if (
          state.scrollToPercent !== prevState.scrollToPercent &&
          state.scrollToPercent !== null
        ) {
          const percent = state.scrollToPercent;
          const view = viewRef.current;
          if (view) {
            const maxScrollTop =
              view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight;
            if (maxScrollTop <= 0) return; // Cannot scroll

            const targetScrollTop = maxScrollTop * percent;

            // Find the approximate position to scroll to
            // Use posAtCoords({ x: view.contentDOM.getBoundingClientRect().left, y: targetScrollTop }) for better accuracy
            const coords = view.coordsAtPos(0); // Get coords at the start
            if (!coords) return;
            const position = view.posAtCoords({
              x: coords.left,
              y: targetScrollTop,
            });

            if (position === null) return;

            // Dispatch a scroll command to CodeMirror using StateEffect
            view.dispatch({
              effects: StateEffect.define().of({
                scrollIntoView: true,
                pos: position,
                y: 'start',
              }),
            });

            // Reset the scroll command state in the store immediately after dispatching
            // Use setTimeout to avoid potential state update loops if dispatch triggers subscription
            setTimeout(
              () => useEditorStore.getState().setScrollToPercent(null),
              0
            );
          }
        }
      }
    );
    // Cleanup the subscription on unmount
    return unsubscribe;
  }, []); // Run only once on mount to set up the subscription

  // --- Render the container div for CodeMirror ---
  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-auto codemirror-container"
    />
  );
};

export default CodeMirrorEditor;
