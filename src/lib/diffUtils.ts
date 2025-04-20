import { diffLines, type Change } from 'diff'; // Import Change type from 'diff'

/**
 * Escapes HTML special characters in a string.
 * @param text - The input string (or potentially null/undefined).
 * @returns The escaped HTML string, or an empty string if input is invalid.
 */
const escapeHtml = (text: string | undefined | null): string => {
  // Ensure input is a string before attempting to replace
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Calculates the line-by-line difference between two strings and returns
 * an HTML representation of the diff with additions and deletions highlighted.
 * @param original - The original string. Defaults to empty string.
 * @param modified - The modified string. Defaults to empty string.
 * @returns An HTML string representing the diff, or an error message string on failure.
 */
export const getDiffHtml = (
  original: string = '',
  modified: string = ''
): string => {
  try {
    // Calculate the differences between lines using 'diff' library
    // newlineIsToken: treats newlines as significant tokens for comparison
    const diffResult: Change[] = diffLines(original, modified, {
      newlineIsToken: true,
    });

    let diffHtml = ''; // Initialize the HTML output string

    // Iterate over each part (change chunk) in the diff result
    diffResult.forEach((part: Change) => {
      // Escape HTML characters in the value of the part
      const escapedValue = escapeHtml(part.value);
      // Split the escaped value into lines
      const lines = escapedValue.split('\n');

      // The diff library might include a trailing empty string if the part ends
      // with a newline; remove it for cleaner rendering.
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }

      // Process each line within the part
      lines.forEach((line) => {
        // Determine the CSS class and prefix based on whether the part was added, removed, or unchanged
        if (part.added) {
          // Added line: Green background, '+' prefix
          diffHtml += `<div class="py-0.5 px-2 bg-green-100 dark:bg-green-900 dark:bg-opacity-30 whitespace-pre-wrap"><span class="font-bold mr-1 select-none text-green-700 dark:text-green-400">+</span>${line}</div>`;
        } else if (part.removed) {
          // Removed line: Red background, '-' prefix
          diffHtml += `<div class="py-0.5 px-2 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 whitespace-pre-wrap"><span class="font-bold mr-1 select-none text-red-700 dark:text-red-400">-</span>${line}</div>`;
        } else {
          // Unchanged line: No background, no prefix
          // Use whitespace-pre-wrap to preserve whitespace and wrap long lines
          // Render empty lines with a minimum height for visual spacing
          if (line.trim()) {
            diffHtml += `<div class="py-0.5 px-2 whitespace-pre-wrap text-muted-foreground">${line}</div>`; // Dim unchanged lines slightly
          } else {
            diffHtml += `<div class="py-0.5 px-2 h-4"></div>`; // Placeholder for empty line height
          }
        }
      });
    });

    return diffHtml; // Return the generated HTML string
  } catch (e) {
    console.error('Diff calculation error:', e);
    // Return an error message wrapped in a div on failure
    return '<div class="p-4 text-destructive">差分の計算中にエラーが発生しました。</div>';
  }
};
