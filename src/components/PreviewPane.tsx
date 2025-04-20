import React, {
  useEffect,
  useState,
  useRef,
  UIEvent,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { useEditorStore } from '@/store/editorStore';
import { parseMarkdown } from '@/lib/markdownParser';
import type { ScrollInfo } from '@/types/editor'; // Import shared type

// --- Props Definition ---
interface PreviewPaneProps {
  onScroll?: (info: ScrollInfo) => void; // Callback to notify parent about scrolling
  scrollToPercent?: number | null; // Instruction from parent to scroll to a percentage
}

// --- Ref Handle Definition ---
// Defines functions that can be called on this component's ref by the parent
export interface PreviewPaneRef {
  scrollToHeading: (id: string) => void; // Scrolls to the heading with the given ID
  getContainer: () => HTMLDivElement | null; // Returns the scrollable container element
}

// --- Component Definition using forwardRef ---
export const PreviewPane = forwardRef<PreviewPaneRef, PreviewPaneProps>(
  ({ onScroll, scrollToPercent }, ref) => {
    // --- Zustand Store Hook ---
    // Get markdown content and heading update action from the store
    const markdown = useEditorStore((state) => state.markdown);
    const setHeadings = useEditorStore((state) => state.setHeadings);

    // --- Local State ---
    // State to hold the rendered HTML string
    const [html, setHtml] = useState<string>('');

    // --- Refs ---
    // Ref for the scrollable container div
    const previewContainerRef = useRef<HTMLDivElement>(null);
    // Ref to store the latest onScroll callback to prevent effect re-runs
    const onScrollRef = useRef(onScroll);
    // Ref to track if scrolling is currently being done programmatically
    const isProgrammaticScroll = useRef(false);

    // Keep the onScroll callback ref up-to-date
    useEffect(() => {
      onScrollRef.current = onScroll;
    }, [onScroll]);

    // --- Effect for Parsing Markdown ---
    // Re-parse markdown whenever the markdown content changes
    useEffect(() => {
      // Parse the markdown using the utility function
      const { html: parsedHtml, headings: parsedHeadings } =
        parseMarkdown(markdown);
      setHtml(parsedHtml); // Update the local HTML state
      setHeadings(parsedHeadings); // Update the headings list in the Zustand store
    }, [markdown, setHeadings]); // Dependencies: run when markdown or setHeadings changes

    // --- Effect for Handling Programmatic Scrolling ---
    // Scroll the preview pane when the scrollToPercent prop changes
    useEffect(() => {
      // Check if scrolling is requested and the container ref is available
      if (scrollToPercent !== null && previewContainerRef.current) {
        const container = previewContainerRef.current;
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        // Calculate target scroll position based on percentage
        const targetScrollTop = maxScrollTop * scrollToPercent;

        // Mark that this scroll is programmatic
        isProgrammaticScroll.current = true;
        // Set the scroll position (ensure it's not negative)
        container.scrollTop = Math.max(0, targetScrollTop);

        // Reset the programmatic scroll flag after a short delay
        // This prevents the scroll event handler from ignoring subsequent user scrolls too soon
        const timer = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 150); // Adjust delay as needed (should be > scroll event debounce/throttle time)
        return () => clearTimeout(timer); // Cleanup timer on effect re-run or unmount
      }
    }, [scrollToPercent]); // Dependency: run when scrollToPercent changes

    // --- Scroll Event Handler ---
    // Notify the parent component about user-initiated scrolls
    const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
      // If the scroll was triggered programmatically, ignore this event
      if (isProgrammaticScroll.current) {
        return;
      }
      // If an onScroll callback is provided, call it with current scroll info
      if (onScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        onScrollRef.current({ scrollTop, scrollHeight, clientHeight });
      }
    }, []); // No dependencies, relies on refs

    // --- Imperative Handle ---
    // Expose functions (like scrollToHeading) to the parent component via the ref
    const scrollToHeading = useCallback((id: string) => {
      // Find the heading element by its ID within the preview container
      const element = document.getElementById(id);
      if (element && previewContainerRef.current) {
        // Use the native scrollIntoView method for smooth scrolling
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn(
          `[PreviewPane] Heading element with id "${id}" not found.`
        );
      }
    }, []); // No dependencies

    // Define the methods exposed by the ref
    useImperativeHandle(
      ref,
      () => ({
        scrollToHeading,
        getContainer: () => previewContainerRef.current,
      }),
      [scrollToHeading]
    ); // Dependency: ensure scrollToHeading is stable

    // --- Render ---
    return (
      // Assign the ref to the scrollable container
      <div
        ref={previewContainerRef}
        className="preview-pane overflow-y-auto h-full bg-background" // Use theme background
        onScroll={handleScroll} // Attach the scroll event handler
      >
        {/* Render the HTML content using dangerouslySetInnerHTML */}
        <div
          // Apply Tailwind Typography styles for nice Markdown rendering
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none p-6 md:p-8" // Adjust padding
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }
);
// Set display name for better debugging in React DevTools
PreviewPane.displayName = 'PreviewPane';
