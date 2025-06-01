import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
// Use EditorPage directly or via App component
// import App from './App.tsx';
import EditorPage from './pages/EditorPage.tsx'; // Import the main page component
import { ThemeProvider } from '@/components/providers/ThemeProvider'; // Import the theme provider
// Import index.css which includes Tailwind directives and globals.css
import './index.css';

// Get the root element from the HTML
const rootElement = document.getElementById('root');

// Ensure the root element exists before rendering
if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'");
}

// Create a React root
const root = ReactDOM.createRoot(rootElement);

// Render the application within StrictMode and ThemeProvider
root.render(
  <StrictMode>
    {/* Wrap the entire application with the ThemeProvider */}
    <ThemeProvider defaultTheme="system" storageKey="ai-md-editor-theme">
      {/* Render the main page component (or App component) */}
      <EditorPage />
      {/* <App /> */}
    </ThemeProvider>
  </StrictMode>
);
