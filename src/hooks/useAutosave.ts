import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce Hook: Executes a callback after a specified delay once the dependencies stop changing.
 * @template T The type of the value being debounced.
 * @param callback The function to execute after the delay.
 * @param delay The debounce delay in milliseconds.
 * @param skipInitialCall Whether to skip the callback execution on the initial mount. Defaults to true.
 * @returns A debounced version of the callback function.
 */
export function useDebouncedCallback<T>(
  callback: (value: T) => void,
  delay: number,
  skipInitialCall: boolean = true
): (value: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(skipInitialCall);
  const callbackRef = useRef(callback); // Store latest callback

  // Update callback ref if it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // The debounced function that gets returned
  const debouncedCallback = useCallback(
    (value: T) => {
      // Skip the very first call if skipInitialCall is true
      if (isInitialMount.current && skipInitialCall) {
        isInitialMount.current = false;
        return;
      }

      // Clear any existing timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timer to execute the callback
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(value); // Use the latest callback from ref
      }, delay);
    },
    [delay, skipInitialCall]
  ); // Dependencies: delay and skipInitialCall

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Add a cancel method to the debounced function if needed (optional)
  // (debouncedCallback as any).cancel = () => {
  //     if (timeoutRef.current) {
  //         clearTimeout(timeoutRef.current);
  //     }
  // };

  return debouncedCallback;
}

/**
 * Autosave Hook: Automatically triggers a save callback when a value changes,
 * after a specified delay, but only if the `isSaved` flag is false.
 * @template T The type of the value to autosave.
 * @param value The value to monitor for changes.
 * @param onSave The asynchronous or synchronous function to call for saving.
 * @param options Configuration options.
 * @param options.delay Autosave delay in milliseconds (default: 3000ms).
 * @param options.isSaved Boolean flag indicating if the current value is considered saved. Autosave is skipped if true.
 */
export function useAutosave<T>(
  value: T,
  onSave: (currentValue: T) => Promise<void> | void,
  options: { delay?: number; isSaved: boolean }
): void {
  // This hook doesn't return anything directly, it performs a side effect
  const { delay = 3000, isSaved } = options; // Default delay 3 seconds
  const valueRef = useRef(value); // Ref to hold the latest value
  const onSaveRef = useRef(onSave); // Ref to hold the latest save callback

  // Update refs when props change
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // The actual save action, wrapped for potential async handling
  const saveAction = useCallback(async () => {
    try {
      // console.debug('[useAutosave] Triggering save...');
      await onSaveRef.current(valueRef.current); // Use latest value from ref
    } catch (error) {
      console.error('[useAutosave] Autosave failed:', error);
      // Consider showing an error notification to the user
      // toast.error("自動保存に失敗しました");
    }
  }, []); // No dependencies needed as it uses refs

  // Create the debounced version of the save action
  // Skip the initial call because the initial value is likely already saved
  const debouncedSave = useDebouncedCallback(saveAction, delay, true);

  // Effect to trigger the debounced save when value changes and isSaved is false
  useEffect(() => {
    // Only schedule autosave if the content is marked as unsaved
    if (!isSaved) {
      // console.debug('[useAutosave] Value changed and not saved, scheduling autosave...');
      debouncedSave(value); // Trigger the debounce timer
    }
    // Note: We don't need to cancel the timer if isSaved becomes true,
    // because the saveAction itself might check isSaved again, or
    // the debouncedSave won't trigger if the component unmounts or deps change.
    // However, explicitly cancelling might be safer if the save action is expensive.
    // return () => { (debouncedSave as any).cancel?.(); }; // Optional cancel on cleanup
  }, [value, isSaved, debouncedSave]); // Rerun when value or isSaved changes

  // This hook primarily manages the side effect of autosaving,
  // so it doesn't need to return anything for the component to use directly.
  // If save status (e.g., "Saving...") was needed, it could return state.
}
