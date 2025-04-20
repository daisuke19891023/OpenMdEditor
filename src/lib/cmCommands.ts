import { EditorView, KeyBinding } from '@codemirror/view';
import { EditorSelection, Transaction, Line } from '@codemirror/state';
import { indentMore, indentLess } from '@codemirror/commands';

/**
 * Helper function to toggle surrounding characters around the selection.
 * If the selection is already surrounded, it removes the surrounding characters.
 * Otherwise, it adds them.
 * @param chars - The characters to surround the selection with (e.g., "**", "_", "`").
 * @returns A CodeMirror command function.
 */
export const toggleSurroundingCharacters = (
  chars: string
): ((view: EditorView) => boolean) => {
  return (view: EditorView): boolean => {
    const { state, dispatch } = view;
    // Use changeByRange to handle multiple selections correctly
    const changes = state.changeByRange(
      (
        range: EditorSelection.Range
      ): {
        changes: { from: number; to?: number; insert: string }[];
        range: EditorSelection.Range;
      } => {
        const charsLength = chars.length;
        const changeList: { from: number; to?: number; insert: string }[] = [];
        let newRange = range;

        // Check if the selection is already surrounded
        const isSurrounded =
          range.from >= charsLength &&
          range.to <= state.doc.length - charsLength &&
          state.sliceDoc(range.from - charsLength, range.from) === chars &&
          state.sliceDoc(range.to, range.to + charsLength) === chars;

        if (isSurrounded) {
          // Remove surrounding characters
          changeList.push({
            from: range.from - charsLength,
            to: range.from,
            insert: '',
          });
          changeList.push({
            from: range.to,
            to: range.to + charsLength,
            insert: '',
          });
          // Adjust selection range after removal
          newRange = EditorSelection.range(
            range.from - charsLength,
            range.to - charsLength
          );
        } else {
          // Add surrounding characters
          changeList.push({ from: range.from, insert: chars });
          changeList.push({ from: range.to, insert: chars }); // Insert after selection
          // Adjust selection range after insertion
          newRange = EditorSelection.range(
            range.from + charsLength,
            range.to + charsLength
          );
        }
        return { changes: changeList, range: newRange };
      }
    );

    if (changes.changes.empty) return false; // No changes made

    // Dispatch the transaction
    dispatch(
      state.update(changes, { scrollIntoView: true, userEvent: 'input' })
    );
    return true; // Indicate command was handled
  };
};

/**
 * CodeMirror command to insert a Markdown link `[selected text](url)`
 * and place the cursor inside the parentheses.
 */
export const insertLinkCommand: (view: EditorView) => boolean = (view) => {
  const { state, dispatch } = view;
  const changes = state.changeByRange(
    (
      range: EditorSelection.Range
    ): {
      changes: { from: number; to: number; insert: string }[];
      range: EditorSelection.Range;
    } => {
      // Use selected text or default placeholder
      const linkText = state.sliceDoc(range.from, range.to) || 'リンクテキスト';
      const insert = `[${linkText}](url)`;
      const change = { from: range.from, to: range.to, insert };
      // Calculate cursor position inside the parentheses ('url' part)
      const cursorPosition = range.from + insert.length - 4; // Place cursor before 'url'
      // Set the new selection to be just the cursor position
      const newRange = EditorSelection.cursor(cursorPosition);
      return { changes: [change], range: newRange };
    }
  );
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
  return true;
};

/**
 * Helper function to toggle a prefix (like '>', '-', '1.') at the beginning of selected lines.
 * Determines whether to add or remove based on the first selected line.
 * @param prefix - The prefix string to toggle.
 * @returns A CodeMirror command function.
 */
export const toggleLinePrefix = (
  prefix: string
): ((view: EditorView) => boolean) => {
  return (view: EditorView): boolean => {
    const { state, dispatch } = view;
    // Use changeByRange to handle potential multiple selections correctly,
    // although the logic here mainly focuses on line-based changes within the main selection.
    const changes = state.changeByRange(
      (
        range: EditorSelection.Range
      ): { changes: Transaction['changes']; range: EditorSelection.Range } => {
        const currentChanges: { from: number; to?: number; insert: string }[] =
          [];
        const prefixLength = prefix.length;
        let linesModified = false;
        let overallLengthChange = 0; // Track the total change in document length

        const fromLine = state.doc.lineAt(range.from);
        const toLine = state.doc.lineAt(range.to);

        // Decide whether to add or remove based on the first line
        const firstLineHasPrefix = fromLine.text.startsWith(prefix);
        const shouldRemove = firstLineHasPrefix;

        // Iterate through all lines touched by the selection
        for (let i = fromLine.number; i <= toLine.number; i++) {
          const line = state.doc.line(i);

          // Skip processing the last line if the selection ends exactly at its beginning
          if (
            i === toLine.number &&
            range.to === line.from &&
            range.from !== range.to
          ) {
            continue;
          }

          if (shouldRemove) {
            // If removing, check if the line actually has the prefix
            if (line.text.startsWith(prefix)) {
              currentChanges.push({
                from: line.from,
                to: line.from + prefixLength,
                insert: '',
              });
              overallLengthChange -= prefixLength;
              linesModified = true;
            }
          } else {
            // If adding
            // Add prefix to non-empty lines, or to an empty line if it's the only one selected
            if (
              line.length > 0 ||
              (fromLine.number === toLine.number && range.empty)
            ) {
              currentChanges.push({ from: line.from, insert: prefix });
              overallLengthChange += prefixLength;
              linesModified = true;
            }
          }
        }

        if (!linesModified) return { changes: [], range }; // No actual changes made

        // Adjust the selection range based on the changes
        let newFrom = range.from;
        let newTo = range.to;

        // Adjust 'from' only if the selection started at the beginning of the first line
        if (range.from === fromLine.from) {
          newFrom += shouldRemove ? -prefixLength : prefixLength;
          newFrom = Math.max(fromLine.from, newFrom); // Ensure 'from' doesn't go before line start
        }

        // Adjust 'to' based on the total length change and the adjustment made to 'from'
        newTo += overallLengthChange + (newFrom - range.from);
        newTo = Math.max(newFrom, newTo); // Ensure 'to' is not before 'from'

        // If the original selection was empty (just a cursor), place the cursor after the prefix change
        if (range.empty) {
          newFrom = Math.max(
            fromLine.from,
            range.from + (shouldRemove ? -prefixLength : prefixLength)
          );
          newTo = newFrom;
        }

        return {
          changes: currentChanges,
          range: EditorSelection.range(newFrom, newTo),
        };
      }
    );

    if (changes.changes.empty) return false;
    // Dispatch transaction with user event annotation
    dispatch(
      state.update(changes, {
        scrollIntoView: true,
        userEvent: 'input',
        annotations: Transaction.userEvent.of('input'),
      })
    );
    return true;
  };
};

/**
 * CodeMirror command to toggle a code block (```) around the selection.
 */
export const toggleCodeBlock: (view: EditorView) => boolean = (view) => {
  const { state, dispatch } = view;
  const changes = state.changeByRange(
    (
      range: EditorSelection.Range
    ): { changes: Transaction['changes']; range: EditorSelection.Range } => {
      const fence = '```';
      const text = state.sliceDoc(range.from, range.to);
      let newRange = range;
      const changeList: { from: number; to?: number; insert: string }[] = [];

      // Check lines before and after to see if it's already a code block
      const lineBefore =
        range.from > 0 ? state.doc.lineAt(range.from - 1) : null;
      const lineAfter =
        range.to < state.doc.length ? state.doc.lineAt(range.to + 1) : null; // Check line *after* selection end

      // A more robust check might be needed, e.g., checking if lineBefore ONLY contains ```
      const isAlreadyCodeBlock =
        lineBefore &&
        lineBefore.text.trim() === fence && // Line before is exactly ```
        lineAfter &&
        lineAfter.text.trim().startsWith(fence); // Line after starts with ```

      if (isAlreadyCodeBlock && lineBefore && lineAfter) {
        // --- Remove code block fences ---
        // Remove the line before (``` and its newline)
        changeList.push({
          from: lineBefore.from,
          to: lineBefore.to + 1,
          insert: '',
        });
        // Remove the line after (``` and potentially lang identifier and its newline)
        changeList.push({
          from: lineAfter.from,
          to: lineAfter.to + 1,
          insert: '',
        });

        // Adjust selection range
        const removedLengthBefore = lineBefore.length + 1;
        newRange = EditorSelection.range(
          Math.max(0, range.from - removedLengthBefore),
          Math.max(0, range.to - removedLengthBefore)
        );
      } else {
        // --- Add code block fences ---
        const lang = ''; // Placeholder for language identifier
        const fenceStart = fence + lang + '\n';
        const fenceEnd = '\n' + fence;

        // Ensure there are newlines around the selected text if needed
        const needsNewlineBefore =
          range.from > 0 &&
          state.doc.lineAt(range.from).number ===
            state.doc.lineAt(range.from - 1).number + 1;
        const needsNewlineAfter =
          range.to < state.doc.length &&
          state.doc.lineAt(range.to).number ===
            state.doc.lineAt(range.to + 1).number - 1;

        let insertText = text;
        // If selection is empty, insert a newline for the cursor
        if (insertText.length === 0) insertText = '\n';

        // Construct the full text to insert, adding surrounding newlines if necessary
        const finalInsert =
          (needsNewlineBefore ? '' : '\n') +
          fenceStart +
          insertText +
          fenceEnd +
          (needsNewlineAfter ? '' : '\n');
        const insertFrom = needsNewlineBefore
          ? range.from
          : range.from > 0
            ? state.doc.lineAt(range.from - 1).to + 1
            : 0; // Insert after previous line or at start

        // Replace the selection (or insert at cursor) with the fenced block
        changeList.push({
          from: range.from,
          to: range.to,
          insert: finalInsert,
        });

        // Place cursor inside the block after the opening fence
        const cursorPos =
          range.from + (needsNewlineBefore ? 0 : 1) + fenceStart.length; // Adjust based on added newline
        newRange = EditorSelection.cursor(cursorPos);
      }

      return { changes: changeList, range: newRange };
    }
  );

  if (changes.changes.empty) return false;
  dispatch(
    state.update(changes, {
      scrollIntoView: true,
      userEvent: 'input',
      annotations: Transaction.userEvent.of('input'),
    })
  );
  return true;
};

// --- Specific Command Exports ---
export const toggleBulletListCommand = toggleLinePrefix('- ');
export const toggleOrderedListCommand = toggleLinePrefix('1. '); // Basic implementation
export const toggleQuoteCommand = toggleLinePrefix('> ');
export const toggleCodeBlockCommand = toggleCodeBlock;

// --- Combined Keymap for Editor ---
export const markdownKeymap: readonly KeyBinding[] = [
  { key: 'Mod-b', run: toggleSurroundingCharacters('**') },
  { key: 'Mod-i', run: toggleSurroundingCharacters('_') },
  { key: 'Mod-Shift-x', run: toggleSurroundingCharacters('~~') }, // Example for strikethrough
  { key: 'Mod-e', run: toggleSurroundingCharacters('`') }, // Example for inline code
  { key: 'Mod-k', run: insertLinkCommand },
  // { key: "Mod-/", run: toggleComment }, // Often included in defaultKeymap
  // { key: "Tab", run: indentMore }, // Included in defaultKeymap or indentWithTab
  // { key: "Shift-Tab", run: indentLess }, // Included in defaultKeymap
  // New block formatting shortcuts
  { key: 'Mod-l', run: toggleBulletListCommand }, // Cmd/Ctrl + L for bullet list
  { key: "Mod-'", run: toggleQuoteCommand }, // Cmd/Ctrl + ' for quote
  { key: 'Mod-Alt-c', run: toggleCodeBlockCommand }, // Cmd/Ctrl + Alt + C for code block
];
