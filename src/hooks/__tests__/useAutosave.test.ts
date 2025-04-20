import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutosave } from '../useAutosave'; // Adjust path as needed

describe('useAutosave Hook', () => {
  // Use Vitest's fake timers to control setTimeout
  vi.useFakeTimers();

  let mockOnSave: vi.Mock; // Mock function for the save callback

  beforeEach(() => {
    // Reset the mock function before each test
    mockOnSave = vi.fn(async () => {
      // Simulate an async save operation if needed
      // await new Promise(resolve => setTimeout(resolve, 50));
    });
  });

  afterEach(() => {
    // Clear any pending timers after each test
    vi.clearAllTimers();
    // Restore any mocks
    vi.restoreAllMocks();
  });

  it('should not call onSave initially when isSaved is true', () => {
    // Render the hook with initial saved state
    renderHook(() =>
      useAutosave('initial value', mockOnSave, { isSaved: true, delay: 500 })
    );
    // Ensure onSave is not called immediately
    expect(mockOnSave).not.toHaveBeenCalled();
    // Advance timers past the delay period
    vi.advanceTimersByTime(600);
    // Ensure onSave is still not called because isSaved was initially true
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not call onSave initially when isSaved is false due to skipInitialCall', () => {
    // Render the hook with initial unsaved state
    renderHook(() =>
      useAutosave('initial value', mockOnSave, { isSaved: false, delay: 500 })
    );
    // Ensure onSave is not called immediately
    expect(mockOnSave).not.toHaveBeenCalled();
    // Advance timers past the delay period
    vi.advanceTimersByTime(600);
    // Ensure onSave is still not called because skipInitialCall defaults to true
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave after delay when value changes and isSaved is false', () => {
    // Initial render with saved state
    const { rerender } = renderHook(
      ({ value, isSaved }) =>
        useAutosave(value, mockOnSave, { isSaved, delay: 500 }),
      { initialProps: { value: 'value1', isSaved: true } }
    );

    // Rerender with new value but still saved - should not schedule save
    rerender({ value: 'value2', isSaved: true });
    vi.advanceTimersByTime(600);
    expect(mockOnSave).not.toHaveBeenCalled();

    // Rerender with new value and unsaved state - should schedule save
    rerender({ value: 'value3', isSaved: false });
    expect(mockOnSave).not.toHaveBeenCalled(); // Not called immediately
    vi.advanceTimersByTime(499); // Advance time just before delay ends
    expect(mockOnSave).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); // Advance time past the delay
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith('value3'); // Called with the latest value
  });

  it('should debounce calls when value changes rapidly while unsaved', () => {
    // Initial render with unsaved state
    const { rerender } = renderHook(
      ({ value, isSaved }) =>
        useAutosave(value, mockOnSave, { isSaved, delay: 500 }),
      { initialProps: { value: 'val1', isSaved: false } }
    );

    // Simulate rapid value changes
    rerender({ value: 'val2', isSaved: false });
    vi.advanceTimersByTime(200); // Less than delay
    rerender({ value: 'val3', isSaved: false });
    vi.advanceTimersByTime(200); // Less than delay
    rerender({ value: 'val4', isSaved: false }); // Final value change

    expect(mockOnSave).not.toHaveBeenCalled(); // Save shouldn't be called yet

    // Advance time past the delay *after* the last change
    vi.advanceTimersByTime(500);
    expect(mockOnSave).toHaveBeenCalledTimes(1); // Should only be called once
    expect(mockOnSave).toHaveBeenCalledWith('val4'); // Called with the final value
  });

  it('should not call onSave if isSaved becomes true before delay ends', () => {
    // Initial render with unsaved state
    const { rerender } = renderHook(
      ({ value, isSaved }) =>
        useAutosave(value, mockOnSave, { isSaved, delay: 500 }),
      { initialProps: { value: 'val1', isSaved: false } }
    );

    // Change value, scheduling a save
    rerender({ value: 'val2', isSaved: false });
    vi.advanceTimersByTime(300); // Part way through delay
    expect(mockOnSave).not.toHaveBeenCalled();

    // Mark as saved before the timer completes
    rerender({ value: 'val2', isSaved: true });

    // Advance time past the original delay
    vi.advanceTimersByTime(300);
    // onSave should not have been called because isSaved became true
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with the latest value even if rerender happens without value change', () => {
    // Initial render, unsaved, scheduling save
    const { rerender } = renderHook(
      ({ value, isSaved }) =>
        useAutosave(value, mockOnSave, { isSaved, delay: 500 }),
      { initialProps: { value: 'value1', isSaved: false } }
    );

    vi.advanceTimersByTime(300);
    // Rerender the hook, potentially due to parent update, but value and isSaved are the same
    rerender({ value: 'value1', isSaved: false });

    vi.advanceTimersByTime(201); // Advance past original delay
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    // Should be called with the value that was present when the timer was initially set
    expect(mockOnSave).toHaveBeenCalledWith('value1');
  });

  it('should handle async onSave function correctly', async () => {
    let resolveSave: () => void;
    // Create an async mock function that waits for a promise
    const asyncSave = vi.fn(async () => {
      await new Promise<void>((res) => {
        resolveSave = res;
      });
      console.log('Async save completed');
    });

    const { rerender } = renderHook(
      ({ value, isSaved }) =>
        useAutosave(value, asyncSave, { isSaved, delay: 500 }),
      { initialProps: { value: 'val1', isSaved: false } }
    );

    // Trigger the save
    rerender({ value: 'val2', isSaved: false });
    vi.advanceTimersByTime(600); // Advance past delay

    // Check that the async function was called
    expect(asyncSave).toHaveBeenCalledTimes(1);
    expect(asyncSave).toHaveBeenCalledWith('val2');

    // Simulate completion of the async operation
    await act(async () => {
      resolveSave(); // Resolve the promise inside the mock
      // Allow microtasks to settle
      await Promise.resolve();
    });
    // Add assertions here if the hook had internal loading state, etc.
    // For now, just ensures the async function can be awaited.
  });
});
