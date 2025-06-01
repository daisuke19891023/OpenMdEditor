import type { FC } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { HeadingItem } from '@/types/editor';
import { cn } from '@/lib/utils'; // Shadcn UI utility for class names

// Props definition for the TableOfContents component
interface TableOfContentsProps {
  // Callback function to execute when a heading link is clicked
  onHeadingClick: (id: string) => void;
}

export const TableOfContents: FC<TableOfContentsProps> = ({
  onHeadingClick,
}: TableOfContentsProps) => {
  // Get the list of headings from the Zustand store
  const headings = useEditorStore((state) => state.headings);

  // Handler for clicking a heading link in the TOC
  const handleItemClick = (
    id: string,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault(); // Prevent default anchor link behavior (page jump)
    onHeadingClick(id); // Call the parent's scroll function
  };

  // Render nothing or a placeholder if there are no headings
  if (headings.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground h-full flex items-center justify-center">
        目次はありません
      </div>
    );
  }

  // Render the list of headings
  return (
    // Container with padding, full height, and vertical scroll
    <div
      role="navigation" // Add role for accessibility
      aria-label="目次" // Add accessible name
      className="p-4 h-full overflow-y-auto text-sm"
    >
      {/* TOC Title */}
      <p className="mb-3 font-semibold text-foreground text-base">目次</p>
      {/* Unordered list for headings */}
      <ul className="space-y-1.5">
        {' '}
        {/* Adjust spacing */}
        {headings.map((heading) => (
          <li key={heading.id}>
            {/* Clickable anchor link for each heading */}
            <a
              href={`#${heading.id}`} // Set href for semantic correctness and fallback
              onClick={(e) => handleItemClick(heading.id, e)}
              // Apply dynamic classes based on heading level using cn utility
              className={cn(
                'block truncate text-muted-foreground hover:text-foreground transition-colors duration-150',
                {
                  // Styling for different heading levels
                  'font-medium text-foreground': heading.level === 1, // H1: Bold, standard color
                  'ml-2': heading.level === 2, // H2: Indent level 1
                  'ml-4': heading.level === 3, // H3: Indent level 2
                  'ml-6 text-xs': heading.level === 4, // H4: Indent level 3, smaller text
                  'ml-8 text-xs': heading.level >= 5, // H5/H6: Indent level 4, smaller text
                }
              )}
              title={heading.text} // Show full text on hover for truncated items
            >
              {heading.text} {/* Display the heading text */}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
