import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Define the possible theme values
type Theme = 'dark' | 'light' | 'system';

// Define the props for the ThemeProvider component
type ThemeProviderProps = {
  children: ReactNode; // The child components to wrap
  defaultTheme?: Theme; // The default theme to use if none is set in storage
  storageKey?: string; // The key to use for storing the theme in localStorage
};

// Define the shape of the context state
type ThemeProviderState = {
  theme: Theme; // The current active theme ('system' resolves to 'light' or 'dark')
  setTheme: (theme: Theme) => void; // Function to change the current theme
};

// Initial state for the context
const initialState: ThemeProviderState = {
  theme: 'system', // Default to system preference
  setTheme: () => null, // Placeholder function
};

// Create the React Context for the theme provider
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Provides theme management (light, dark, system) for the application.
 * Stores the user's preference in localStorage and applies the corresponding
 * class ('light' or 'dark') to the root HTML element.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme', // Default localStorage key
  ...props // Pass through any other props
}: ThemeProviderProps) {
  // State to hold the currently selected theme ('dark', 'light', or 'system')
  const [theme, setTheme] = useState<Theme>(
    // Initialize state from localStorage or use the default theme
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  // Effect to apply the theme class to the HTML root element and update localStorage
  useEffect(() => {
    const root = window.document.documentElement; // Get the root HTML element

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Determine the effective theme (resolve 'system')
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    // Add the class for the effective theme (light or dark)
    root.classList.add(effectiveTheme);

    // Store the selected theme preference (even if it's 'system') in localStorage
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]); // Re-run effect when theme or storageKey changes

  // Memoize the context value
  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Update localStorage and the state when the theme is changed
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  // Provide the theme state and setter function to children via context
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Custom hook to access the current theme and the theme setter function.
 * Throws an error if used outside of a ThemeProvider.
 * @returns The theme context value: { theme, setTheme }.
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  // Ensure the hook is used within a ThemeProvider
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
