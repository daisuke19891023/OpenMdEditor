import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/components/providers/ThemeProvider'; // Import useTheme hook
import { Button } from '@/components/ui/button'; // Import Shadcn Button
import { Moon, Sun, FileCode } from 'lucide-react'; // Import icons

export const EditorHeader: React.FC = () => {
  // --- Zustand Store Hook ---
  // Get file name and saved status from the editor store
  const { currentFileName, isSaved } = useEditorStore();
  // --- Theme Hook ---
  // Get current theme and setter function from ThemeProvider context
  const { theme, setTheme } = useTheme();

  // Determine the actual theme (light/dark) considering the 'system' option
  const currentActualTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  // --- Event Handlers ---
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(currentActualTheme === 'dark' ? 'light' : 'dark');
  };

  // --- Render ---
  return (
    // Use theme variables for background and text colors
    <header className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center flex-shrink-0 h-12">
      {' '}
      {/* Fixed height */}
      {/* Left Section: Title and File Name */}
      <div className="flex items-center overflow-hidden">
        {' '}
        {/* Added overflow-hidden */}
        {/* Application Icon/Logo */}
        <FileCode className="h-6 w-6 mr-2 flex-shrink-0" />{' '}
        {/* Replaced generic icon */}
        {/* Application Title */}
        <h1 className="text-lg font-semibold mr-4 flex-shrink-0">
          AI Markdown Editor
        </h1>
        {/* Current File Name and Saved Status */}
        {currentFileName && (
          // Use tooltip for long filenames?
          <span
            className={`text-sm truncate ${isSaved ? 'opacity-80' : 'opacity-100 font-medium'}`}
            title={currentFileName} // Show full name on hover
          >
            {currentFileName}
            {/* Unsaved indicator */}
            {!isSaved && <span className="ml-1 text-xs">•</span>}
          </span>
        )}
      </div>
      {/* Right Section: Theme Toggle Button */}
      <div className="flex items-center space-x-3">
        {/* Use Shadcn Button for theme toggle */}
        <Button
          variant="ghost" // Use ghost variant for less emphasis
          size="icon"
          onClick={toggleTheme}
          className="text-primary-foreground hover:bg-primary/90 focus-visible:ring-offset-primary-foreground" // Adjust focus ring offset
          aria-label="Toggle theme" // Add fixed aria-label for testing
          title={
            // Use title for dynamic state description
            currentActualTheme === 'dark'
              ? 'ライトモードに切り替え'
              : 'ダークモードに切り替え'
          }
        >
          {/* Show Sun icon for dark mode, Moon icon for light mode */}
          {currentActualTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          {/* Screen reader only text */}
          <span className="sr-only">Toggle theme</span>
        </Button>
        {/* Placeholder for other potential header actions (e.g., settings, user menu) */}
      </div>
    </header>
  );
};
