import EditorPage from './pages/EditorPage'; // Import the main page component

/**
 * The root component of the application.
 * Currently, it simply renders the main EditorPage.
 * Routing could be added here in the future if multiple pages are needed.
 */
function App() {
  // Render the main editor page component
  return <EditorPage />;
}

export default App;
