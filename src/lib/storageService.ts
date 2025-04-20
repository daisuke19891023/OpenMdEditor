import type { Draft } from '@/types/editor'; // Import the Draft type definition

// Constants for localStorage keys
const DRAFTS_KEY = 'ai_markdown_editor_drafts'; // Use a more specific key
const CURRENT_DRAFT_ID_KEY = 'ai_markdown_editor_current_draft_id';

/**
 * Helper function to safely parse JSON from localStorage.
 * @param key - The localStorage key.
 * @returns The parsed object or null if parsing fails or key doesn't exist.
 */
const safelyParseJson = <T>(key: string): T | null => {
  try {
    const jsonString = localStorage.getItem(key);
    if (!jsonString) return null;
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error(`Error parsing JSON from localStorage key "${key}":`, error);
    // Optionally remove the invalid item
    // localStorage.removeItem(key);
    return null;
  }
};

/**
 * Service object for interacting with localStorage to manage Markdown drafts.
 */
export const storageService = {
  /**
   * Saves a draft to localStorage. Updates existing draft if existingId is provided.
   * @param content - The Markdown content.
   * @param fileName - The optional file name for the draft.
   * @param existingId - The ID of an existing draft to update.
   * @returns The ID of the saved/updated draft, or null on failure.
   */
  saveDraft(
    content: string,
    fileName: string | null = null,
    existingId?: string
  ): string | null {
    try {
      const timestamp = new Date().toISOString();
      // Generate ID: Use existing, or create based on filename/timestamp
      const id =
        existingId ||
        (fileName ? `file_${fileName}_${timestamp}` : `draft_${timestamp}`);

      const draft: Draft = { id, content, lastModified: timestamp, fileName };

      // Load existing drafts safely
      const drafts = safelyParseJson<Record<string, Draft>>(DRAFTS_KEY) || {};

      drafts[id] = draft; // Add or update the draft

      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      localStorage.setItem(CURRENT_DRAFT_ID_KEY, id); // Mark as currently edited

      console.debug(`[storageService] Saved draft: ${id}`);
      return id;
    } catch (e) {
      console.error('[storageService] Error saving draft:', e);
      // Consider user notification here (e.g., using toast)
      return null;
    }
  },

  /**
   * Loads a specific draft by its ID. Sets it as the current draft if found.
   * @param id - The ID of the draft to load.
   * @returns The loaded Draft object, or null if not found or on error.
   */
  loadDraft(id: string): Draft | null {
    try {
      const drafts = safelyParseJson<Record<string, Draft>>(DRAFTS_KEY);
      const draft = drafts?.[id] || null;
      if (draft) {
        localStorage.setItem(CURRENT_DRAFT_ID_KEY, id); // Set as current
        console.debug(`[storageService] Loaded draft: ${id}`);
      } else {
        console.warn(`[storageService] Draft not found: ${id}`);
      }
      return draft;
    } catch (e) {
      console.error(`[storageService] Error loading draft ${id}:`, e);
      return null;
    }
  },

  /**
   * Loads the draft that was last being edited (based on stored ID).
   * @returns The last edited Draft object, or null if none or on error.
   */
  loadLastDraft(): Draft | null {
    try {
      const currentId = localStorage.getItem(CURRENT_DRAFT_ID_KEY);
      if (!currentId) return null;
      console.debug(
        `[storageService] Attempting to load last draft: ${currentId}`
      );
      return this.loadDraft(currentId); // Use loadDraft to also set current ID
    } catch (e) {
      console.error('[storageService] Error loading last draft:', e);
      return null;
    }
  },

  /**
   * Retrieves all saved drafts, sorted by last modified date (newest first).
   * @returns An array of Draft objects, or an empty array on error.
   */
  getAllDrafts(): Draft[] {
    try {
      const drafts = safelyParseJson<Record<string, Draft>>(DRAFTS_KEY);
      if (!drafts) return [];

      return Object.values(drafts).sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      );
    } catch (e) {
      console.error('[storageService] Error getting all drafts:', e);
      return [];
    }
  },

  /**
   * Deletes a draft by its ID. Clears the current draft ID if it matches.
   * @param id - The ID of the draft to delete.
   * @returns True if deletion was successful, false otherwise.
   */
  deleteDraft(id: string): boolean {
    try {
      const drafts = safelyParseJson<Record<string, Draft>>(DRAFTS_KEY);
      if (!drafts || !drafts[id]) {
        console.warn(
          `[storageService] Attempted to delete non-existent draft: ${id}`
        );
        return false; // Draft doesn't exist
      }

      delete drafts[id]; // Remove the draft
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

      // If the deleted draft was the current one, clear the current ID
      if (localStorage.getItem(CURRENT_DRAFT_ID_KEY) === id) {
        this.clearCurrentDraftId();
      }
      console.debug(`[storageService] Deleted draft: ${id}`);
      return true;
    } catch (e) {
      console.error(`[storageService] Error deleting draft ${id}:`, e);
      return false;
    }
  },

  /**
   * Gets the ID of the currently marked draft.
   * @returns The current draft ID string, or null if not set.
   */
  getCurrentDraftId(): string | null {
    return localStorage.getItem(CURRENT_DRAFT_ID_KEY);
  },

  /**
   * Sets the ID of the currently marked draft.
   * Used internally by loadDraft, but can be called externally if needed.
   * @param id - The ID to set as current.
   */
  setCurrentDraftId(id: string): void {
    try {
      localStorage.setItem(CURRENT_DRAFT_ID_KEY, id);
    } catch (e) {
      console.error(
        `[storageService] Error setting current draft ID to ${id}:`,
        e
      );
    }
  },

  /**
   * Clears the currently marked draft ID from localStorage.
   */
  clearCurrentDraftId(): void {
    try {
      localStorage.removeItem(CURRENT_DRAFT_ID_KEY);
      console.debug(`[storageService] Cleared current draft ID.`);
    } catch (e) {
      console.error('[storageService] Error clearing current draft ID:', e);
    }
  },
};
