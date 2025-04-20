import { create } from 'zustand';
import type { AIChatMode } from '@/types/ai'; // Import AI related types

// Define the shape of the AI-specific state (excluding chat history managed by useChat)
interface AIState {
  chatMode: AIChatMode; // Current mode of the AI chat ('create' or 'edit')
  // Add other AI-related settings here if needed in the future, e.g.:
  // selectedModel: string;
  // temperature: number;

  // --- Actions ---
  setChatMode: (mode: AIChatMode) => void;
  // Add actions for other settings if implemented
  // setSelectedModel: (model: string) => void;
  // setTemperature: (temp: number) => void;
}

// Create the Zustand store for AI state
export const useAIStore = create<AIState>((set) => ({
  // --- Initial State ---
  chatMode: 'create', // Default to 'create' mode
  // selectedModel: 'gpt-4o-mini', // Example default model
  // temperature: 0.7, // Example default temperature

  // --- Actions Implementation ---
  setChatMode: (mode: AIChatMode) => set({ chatMode: mode }),
  // setSelectedModel: (model) => set({ selectedModel: model }),
  // setTemperature: (temp) => set({ temperature: temp }),
}));

// Note: Chat history, input value, and loading status are managed by
// the useChat hook from the Vercel AI SDK in AiChatPanel.tsx.
// This store holds AI settings that might affect the chat interaction.
