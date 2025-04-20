import * as React from 'react';
import {
  useEffect,
  useState,
  useRef,
  UIEvent,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { useEditorStore } from '@/store/editorStore';
import { parseMarkdown } from '@/lib/markdownParser'; // Re-import parseMarkdown
import type { ScrollInfo, HeadingItem } from '@/types/editor'; // Keep ScrollInfo and HeadingItem
// Remove direct imports of marked, DOMPurify, hljs
// import { marked } from 'marked';
// import DOMPurify from 'dompurify';
// import hljs from 'highlight.js';
// import 'highlight.js/styles/github-dark.css';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// --- Props Definition ---
interface PreviewPaneProps {
  className?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  // Remove scrollRef as it was unused and causing warnings via viewportRef
  // scrollRef?: React.RefObject<HTMLDivElement>;
}

// --- Ref Handle Definition ---
export interface PreviewPaneRef {
  scrollToHeading: (id: string) => void;
  getContainer: () => HTMLDivElement | null;
}

// --- Component Definition using forwardRef ---
export const PreviewPane = forwardRef<PreviewPaneRef, PreviewPaneProps>(
  // Remove scrollRef from props destructuring
  ({ className, onScroll }, ref) => {
    // --- Zustand Store Hook ---
    const markdown = useEditorStore((state) => state.markdown);
    const setHeadings = useEditorStore((state) => state.setHeadings);

    // --- Local State ---
    const [html, setHtml] = useState<string>('');

    // --- Refs ---
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const onScrollRef = useRef(onScroll);
    // Remove isProgrammaticScroll ref as the effect using it is removed
    // const isProgrammaticScroll = useRef(false);

    // Keep the onScroll callback ref up-to-date
    useEffect(() => {
      onScrollRef.current = onScroll;
    }, [onScroll]);

    // --- Effect for Parsing Markdown ---
    // Re-parse markdown whenever the markdown content changes
    useEffect(() => {
      try {
        // Use the imported parseMarkdown function
        const { html: parsedHtml, headings: parsedHeadings } =
          parseMarkdown(markdown);
        setHtml(parsedHtml); // Update the local HTML state
        setHeadings(parsedHeadings); // Update the headings list in the Zustand store
      } catch (error) {
        console.error('Markdown parsing error:', error);
        setHtml('<p class="text-destructive">Error rendering Markdown.</p>'); // Display error message
        setHeadings([]); // Clear headings on error
      }
    }, [markdown, setHeadings]); // Dependencies

    // Remove the useEffect for programmatic scrolling based on scrollRef/scrollToPercent
    // useEffect(() => { ... }, [scrollRef]);

    // --- Scroll Event Handler ---
    // Keep the existing user scroll handler
    const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
      // Remove check for isProgrammaticScroll.current
      // if (isProgrammaticScroll.current) { return; }
      if (onScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        // Pass ScrollInfo object directly if that's the expected type
        onScrollRef.current({ scrollTop, scrollHeight, clientHeight } as any); // Cast if necessary, ensure type match
      }
    }, []); // No dependencies needed if only using refs

    // --- Imperative Handle ---
    const scrollToHeading = useCallback((id: string) => {
      const element = previewContainerRef.current?.querySelector(`#${CSS.escape(id)}`); // Use querySelector for safety
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn(
          `[PreviewPane] Heading element with id "${id}" not found.`
        );
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        scrollToHeading,
        getContainer: () => previewContainerRef.current,
      }),
      [scrollToHeading]
    );

    // --- Render ---
    return (
      // Assign previewContainerRef to the ScrollArea's viewport using its dedicated prop if available,
      // or find the viewport element manually if needed for getContainer.
      // Assuming ScrollArea's default structure works with getContainer targeting previewContainerRef.
      <ScrollArea
        ref={previewContainerRef} // Assign ref here IF ScrollArea forwards it to the scrollable div
        className={cn('h-full w-full bg-card p-4 rounded-md border', className)}
        onScroll={handleScroll}
        // REMOVE viewportRef prop
        data-testid="preview-pane"
      >
        {/* Render the HTML content */}
        <div
          // Tailwind Typography styles
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none p-6 md:p-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </ScrollArea>
    );
  }
);
PreviewPane.displayName = 'PreviewPane';
