// Filename: frontend/src/components/SystemPromptDisplay.js

import React from 'react';

const SystemPromptDisplay = ({ content, tokenCount }) => {
  if (!content) {
    return (
      <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded">
        <p className="text-sm text-gray-600 dark:text-gray-200 italic">
          No system prompt selected.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">System Prompt</h3>
      <textarea
        className="w-full h-64 p-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg resize-none"
        value={content}
        readOnly
      />
      <div className="text-right mt-1 text-sm text-gray-500 dark:text-gray-400">
        Tokens: {tokenCount}
      </div>
    </div>
  );
};

export default SystemPromptDisplay;