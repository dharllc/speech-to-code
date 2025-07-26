// Filename: frontend/src/components/SystemPromptSelector.tsx
import React from 'react';

interface SystemPrompt {
  id: number | string;
  name?: string;
  step?: string;
}

interface SystemPromptSelectorProps {
  prompts: SystemPrompt[];
  activePromptId: number | string | null;
  onSelect: (id: number | string | null) => void;
}

/**
 * Renders a simple selector (list or dropdown) for picking the active System Prompt.
 * The parent component (LLMInteraction) can pass in:
 *  - prompts: an array of system prompts fetched from the backend
 *  - activePromptId: the currently selected prompt's ID (or null)
 *  - onSelect: callback(id) when the user selects a new prompt
 */
const SystemPromptSelector: React.FC<SystemPromptSelectorProps> = ({ prompts, activePromptId, onSelect }) => {
  if (!prompts || prompts.length === 0) {
    return (
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No system prompts found.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
        System Prompt (Optional)
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          key="none"
          type="button"
          onClick={() => onSelect(null)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium
            border border-transparent shadow-sm
            transition-colors duration-200
            ${
              activePromptId === null
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
            }
          `}
        >
          None
        </button>
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelect(prompt.id)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium
              border border-transparent shadow-sm
              transition-colors duration-200
              ${
                activePromptId === prompt.id
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              }
            `}
          >
            {prompt.name || prompt.step}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SystemPromptSelector;