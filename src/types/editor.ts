/**
 * Type definitions related to the editor state, drafts, UI elements, etc.
 */

// Possible view modes for the editor layout
export type EditorTab = 'edit' | 'split' | 'preview';

// Type for notifications (used by Sonner toast)
// We might not need a dedicated Notification type if we call toast directly
// export type NotificationType = 'info' | 'success' | 'error' | 'warning';
// export interface Notification {
//   id?: string | number; // Optional ID for managing toasts
//   message: string | React.ReactNode;
//   type?: NotificationType;
//   options?: object; // Additional options for sonner toast
// }

// Type for representing the text selection range in CodeMirror
export interface SelectionRange {
  from: number; // Start position (character index)
  to: number; // End position (character index)
}

// Type for representing an extracted heading for the Table of Contents
export interface HeadingItem {
  id: string; // URL-friendly ID generated from heading text
  text: string; // The plain text content of the heading
  level: number; // Heading level (1 for H1, 2 for H2, etc.)
}

// Type for representing a saved draft in localStorage
export interface Draft {
  id: string; // Unique identifier for the draft
  content: string; // The Markdown content of the draft
  lastModified: string; // ISO 8601 timestamp string of the last modification
  fileName: string | null; // Optional filename associated with the draft
}

// Type for scroll information passed between components
export interface ScrollInfo {
  scrollTop: number; // Current vertical scroll position
  scrollHeight: number; // Total scrollable height
  clientHeight: number; // Visible height of the scrollable area
}
